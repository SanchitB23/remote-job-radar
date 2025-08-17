package services

import (
	"context"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/fetch"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

type JobService struct {
	store    *storage.Store
	skillVec []float32
	timeout  time.Duration
	config   *config.Config
}

func NewJobService(store *storage.Store, skillVec []float32, timeout time.Duration, cfg *config.Config) *JobService {
	return &JobService{
		store:    store,
		skillVec: skillVec,
		timeout:  timeout,
		config:   cfg,
	}
}

// fetchFromAllSources fetches jobs from all configured sources
func (j *JobService) fetchFromAllSources(ctx context.Context) ([]storage.JobRow, error) {
	var allJobs []storage.JobRow

	// Fetch jobs from Remotive (always enabled)
	logger.Info("Fetching jobs from Remotive API")
	remotiveJobs, err := fetch.FetchRemotive()
	if err != nil {
		logger.Error("Remotive fetch error", zap.Error(err))
		// Don't return here - continue with other sources
	} else {
		logger.Info("Retrieved jobs from Remotive", zap.Int("count", len(remotiveJobs)))
		allJobs = append(allJobs, remotiveJobs...)
	}

	// Fetch jobs from Adzuna if configured
	if j.config.IsAdzunaEnabled() {
		adzunaJobs, err := j.fetchFromAdzuna(ctx)
		if err != nil {
			logger.Error("Adzuna fetch failed", zap.Error(err))
			// Continue with other sources
		} else {
			logger.Info("Retrieved jobs from Adzuna", zap.Int("count", len(adzunaJobs)))
			allJobs = append(allJobs, adzunaJobs...)
		}
	} else {
		logger.Info("Adzuna API not configured, skipping")
	}

	return allJobs, nil
}

// fetchFromAdzuna fetches jobs from Adzuna API with pagination
func (j *JobService) fetchFromAdzuna(ctx context.Context) ([]storage.JobRow, error) {
	logger.Info("Fetching jobs from Adzuna API")
	var allAdzunaJobs []storage.JobRow

	// Fetch multiple pages from Adzuna (since it's paginated)
	for page := 1; page <= j.config.FetcherMaxPageNum; page++ {
		select {
		case <-ctx.Done():
			logger.Warn("Adzuna fetch interrupted by context cancellation",
				zap.Int("page", page),
				zap.Int("jobsFetched", len(allAdzunaJobs)))
			return allAdzunaJobs, ctx.Err()
		default:
		}

		// Create a timeout for individual page fetch
		pageCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		adzunaJobs, err := fetch.FetchAdzuna(pageCtx, page, j.config.AdzunaAppID, j.config.AdzunaAppKey)
		cancel()

		if err != nil {
			logger.Error("Adzuna fetch error", zap.Error(err), zap.Int("page", page))
			// Continue with what we have if we got some results
			if len(allAdzunaJobs) > 0 {
				logger.Info("Continuing with partial Adzuna results", zap.Int("count", len(allAdzunaJobs)))
				break
			}
			return nil, err
		}

		logger.Info("Retrieved jobs from Adzuna",
			zap.Int("count", len(adzunaJobs)),
			zap.Int("page", page))
		allAdzunaJobs = append(allAdzunaJobs, adzunaJobs...)

		// Break early if we get fewer results than expected (last page)
		if len(adzunaJobs) < 50 {
			break
		}
	}

	logger.Info("Total jobs fetched from Adzuna", zap.Int("count", len(allAdzunaJobs)))
	return allAdzunaJobs, nil
}

func (j *JobService) FetchAndProcessJobs(ctx context.Context) error {
	startTime := time.Now()
	logger.Info("Starting job fetch operation")

	// Create context with timeout
	fetchCtx, cancel := context.WithTimeout(ctx, j.timeout)
	defer cancel()

	// Fetch jobs from all configured sources
	allJobs, err := j.fetchFromAllSources(fetchCtx)
	if err != nil {
		logger.Error("Error fetching from sources", zap.Error(err))
		return err
	}

	if len(allJobs) == 0 {
		logger.Warn("No jobs fetched from any source")
		return nil
	}

	// Store all jobs in database
	logger.Info("Upserting jobs to database", zap.Int("totalJobs", len(allJobs)))

	// Create a separate context for database operations to avoid cancellation
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer dbCancel()

	if err = j.store.UpsertJobs(dbCtx, allJobs); err != nil {
		logger.Error("Database error", zap.Error(err))
		return err
	}

	duration := time.Since(startTime)
	logger.Info("Successfully upserted jobs from all sources",
		zap.Int("count", len(allJobs)),
		zap.Duration("duration", duration))

	// Score new jobs immediately after fetching
	logger.Info("Scoring newly fetched jobs")

	// For large batches, use a very long timeout or no timeout for background processing
	// Create a separate context for scoring operations with no timeout for background jobs
	scoreCtx := context.Background()

	if err := j.ScoreNewJobs(scoreCtx); err != nil {
		logger.Error("Scoring error", zap.Error(err))
		return err
	}

	return nil
}

func (j *JobService) ScoreNewJobs(ctx context.Context) error {
	scoringStartTime := time.Now()
	logger.Info("Starting job scoring operation")

	if err := scorer.ScoreNewRows(ctx, j.store, j.skillVec, j.config); err != nil {
		logger.Error("Scoring error", zap.Error(err))
		return err
	}

	logger.Info("Scoring completed",
		zap.Duration("duration", time.Since(scoringStartTime)))
	return nil
}
