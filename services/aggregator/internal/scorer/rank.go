package scorer

import (
	"context"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

// JobResult represents the result of processing a single job
type JobResult struct {
	JobID    string
	Vector   []float32
	FitScore float32
	Error    error
}

// WorkerPool manages concurrent job processing
type WorkerPool struct {
	workerCount int
	embedder    *Embedder
	skillVec    []float32
	store       *storage.Store
}

// NewWorkerPool creates a new worker pool for processing jobs
func NewWorkerPool(store *storage.Store, skillVec []float32, cfg *config.Config) (*WorkerPool, error) {
	// Use configurable number of concurrent workers to balance throughput and API rate limits
	workerCount := cfg.EmbedderWorkerCount

	embedder, err := NewEmbedder(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create embedder: %w", err)
	}

	return &WorkerPool{
		workerCount: workerCount,
		embedder:    embedder,
		skillVec:    skillVec,
		store:       store,
	}, nil
}

func Cosine(a, b []float32) float32 {
	var dot, na, nb float32
	for i := range a {
		dot += a[i] * b[i]
		na += a[i] * a[i]
		nb += b[i] * b[i]
	}
	return dot / float32(math.Sqrt(float64(na*nb+1e-9)))
}

// Returns fit 0-100
func FitScore(jobVec, skillVec []float32) float32 {
	return Cosine(jobVec, skillVec) * 100
}

// processJob processes a single job and returns the result
func (wp *WorkerPool) processJob(ctx context.Context, row storage.JobRow) JobResult {
	result := JobResult{JobID: row.ID}

	// Combine title and description for embedding
	text := row.Title + " " + row.Description
	if text == " " || strings.TrimSpace(text) == "" {
		result.Error = fmt.Errorf("empty title and description")
		return result
	}

	// Generate embedding
	vec, err := wp.embedder.Embed(ctx, text)
	if err != nil {
		result.Error = fmt.Errorf("failed to embed: %w", err)
		return result
	}

	if len(vec) == 0 {
		result.Error = fmt.Errorf("empty vector returned")
		return result
	}

	if len(wp.skillVec) == 0 {
		result.Error = fmt.Errorf("empty skill vector")
		return result
	}

	if len(vec) != len(wp.skillVec) {
		result.Error = fmt.Errorf("vector dimension mismatch: job=%d, skill=%d", len(vec), len(wp.skillVec))
		return result
	}

	// Calculate fit score
	fit := FitScore(vec, wp.skillVec)
	result.Vector = vec
	result.FitScore = fit

	return result
}

// ProcessJobsConcurrently processes multiple jobs concurrently
func (wp *WorkerPool) ProcessJobsConcurrently(ctx context.Context, rows []storage.JobRow) error {
	if len(rows) == 0 {
		return nil
	}

	logger.Info("Starting concurrent job processing",
		zap.Int("totalJobs", len(rows)),
		zap.Int("workers", wp.workerCount))

	// Create channels for work distribution
	jobChan := make(chan storage.JobRow, wp.workerCount)
	resultChan := make(chan JobResult, wp.workerCount)

	// Start workers
	var wg sync.WaitGroup
	for i := 0; i < wp.workerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			logger.Debug("Worker started", zap.Int("workerID", workerID))

			for row := range jobChan {
				select {
				case <-ctx.Done():
					return
				default:
					result := wp.processJob(ctx, row)
					select {
					case resultChan <- result:
					case <-ctx.Done():
						return
					}
				}
			}
			logger.Debug("Worker finished", zap.Int("workerID", workerID))
		}(i)
	}

	// Start result processor
	var processorWg sync.WaitGroup
	processorWg.Add(1)
	processed := 0
	errors := 0

	go func() {
		defer processorWg.Done()
		for result := range resultChan {
			processed++

			if result.Error != nil {
				errors++
				logger.Warn("Job processing failed",
					zap.String("jobId", result.JobID),
					zap.Error(result.Error))
				continue
			}

			// Update database
			if err := wp.store.UpdateVectorAndFit(ctx, result.JobID, result.Vector, result.FitScore); err != nil {
				errors++
				logger.Error("Failed to update job in database",
					zap.String("jobId", result.JobID),
					zap.Error(err))
				continue
			}

			// Log progress every 50 jobs
			if processed%50 == 0 {
				logger.Info("Processing progress",
					zap.Int("processed", processed),
					zap.Int("total", len(rows)),
					zap.Int("errors", errors),
					zap.Float64("percentComplete", float64(processed)/float64(len(rows))*100))
			}
		}
	}()

	// Send jobs to workers
	go func() {
		defer close(jobChan)
		for i, row := range rows {
			select {
			case jobChan <- row:
				if i%100 == 0 {
					logger.Debug("Queued jobs", zap.Int("queued", i+1), zap.Int("total", len(rows)))
				}
			case <-ctx.Done():
				logger.Warn("Context cancelled while queuing jobs", zap.Int("queued", i))
				return
			}
		}
	}()

	// Wait for all workers to finish
	wg.Wait()
	close(resultChan)

	// Wait for result processor to finish
	processorWg.Wait()

	logger.Info("Concurrent job processing completed",
		zap.Int("totalJobs", len(rows)),
		zap.Int("processed", processed),
		zap.Int("errors", errors),
		zap.Float64("successRate", float64(processed-errors)/float64(processed)*100))

	return nil
}

// Update rows that lack vector/fit with concurrent processing
func ScoreNewRows(ctx context.Context, st *storage.Store, skillVec []float32, cfg *config.Config) error {
	rows, err := st.FetchRowsNeedingVector(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch rows needing vector: %w", err)
	}

	if len(rows) == 0 {
		logger.Info("No jobs need vector processing")
		return nil
	}

	logger.Info("Jobs requiring vector processing", zap.Int("count", len(rows)))

	// Create worker pool for concurrent processing
	workerPool, err := NewWorkerPool(st, skillVec, cfg)
	if err != nil {
		return fmt.Errorf("failed to create worker pool: %w", err)
	}

	// Process jobs concurrently
	startTime := time.Now()
	if err := workerPool.ProcessJobsConcurrently(ctx, rows); err != nil {
		return fmt.Errorf("failed to process jobs concurrently: %w", err)
	}

	duration := time.Since(startTime)
	logger.Info("Completed scoring process",
		zap.Int("totalJobs", len(rows)),
		zap.Duration("duration", duration),
		zap.Float64("jobsPerSecond", float64(len(rows))/duration.Seconds()))

	return nil
}
