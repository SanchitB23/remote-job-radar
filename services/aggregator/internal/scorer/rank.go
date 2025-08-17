package scorer

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

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

// Update rows that lack vector/fit
func ScoreNewRows(ctx context.Context, st *storage.Store, skillVec []float32) error {
	rows, err := st.FetchRowsNeedingVector(ctx) // you write this query
	if err != nil {
		return fmt.Errorf("failed to fetch rows needing vector: %w", err)
	}

	if len(rows) == 0 {
		// No rows to process, not an error
		return nil
	}

	logger.Info("Processing jobs for scoring", zap.Int("count", len(rows)))

	for i, r := range rows {
		logger.Info("Processing job",
			zap.Int("current", i+1),
			zap.Int("total", len(rows)),
			zap.String("jobId", r.ID))

		// Combine title and description for embedding
		text := r.Title + " " + r.Description
		if text == " " || strings.TrimSpace(text) == "" {
			logger.Warn("Skipping job with empty title and description", zap.String("jobId", r.ID))
			continue
		}

		embedder, err := NewEmbedder()
		if err != nil {
			logger.Error("Failed to initialize embedder", zap.Error(err))
			continue
		}
		vec, err := embedder.Embed(ctx, text)
		if err != nil {
			logger.Error("Failed to embed job", zap.String("jobId", r.ID), zap.Error(err))
			continue // Skip this job but continue with others
		}

		if len(vec) == 0 {
			logger.Warn("Skipping job with empty vector", zap.String("jobId", r.ID))
			continue
		}

		if len(skillVec) == 0 {
			logger.Warn("Skipping job due to empty skill vector", zap.String("jobId", r.ID))
			continue
		}

		if len(vec) != len(skillVec) {
			logger.Warn("Skipping job due to vector dimension mismatch",
				zap.String("jobId", r.ID),
				zap.Int("jobVectorDim", len(vec)),
				zap.Int("skillVectorDim", len(skillVec)))
			continue
		}

		fit := FitScore(vec, skillVec)
		logger.Debug("Job scored", zap.String("jobId", r.ID), zap.Float32("fitScore", fit))

		if err := st.UpdateVectorAndFit(ctx, r.ID, vec, fit); err != nil {
			logger.Error("Failed to update job", zap.String("jobId", r.ID), zap.Error(err))
			continue // Continue with other jobs
		}
	}

	logger.Info("Completed scoring process")
	return nil
}
