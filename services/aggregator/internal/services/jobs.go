package services

import (
	"context"
	"time"

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
}

func NewJobService(store *storage.Store, skillVec []float32, timeout time.Duration) *JobService {
	return &JobService{
		store:    store,
		skillVec: skillVec,
		timeout:  timeout,
	}
}

func (j *JobService) FetchAndProcessJobs(ctx context.Context) error {
	startTime := time.Now()
	logger.Info("Starting job fetch operation")

	// Create context with timeout
	fetchCtx, cancel := context.WithTimeout(ctx, j.timeout)
	defer cancel()

	// Fetch jobs from sources
	logger.Info("Fetching jobs from Remotive API")
	rows, err := fetch.FetchRemotive()
	if err != nil {
		logger.Error("Fetch error", zap.Error(err))
		return err
	}

	logger.Info("Retrieved jobs from Remotive", zap.Int("count", len(rows)))

	// Store jobs in database
	logger.Info("Upserting jobs to database")
	if err = j.store.UpsertJobs(fetchCtx, rows); err != nil {
		logger.Error("Database error", zap.Error(err))
		return err
	}

	duration := time.Since(startTime)
	logger.Info("Successfully upserted Remotive jobs",
		zap.Int("count", len(rows)),
		zap.Duration("duration", duration))

	// Score new jobs immediately after fetching
	logger.Info("Scoring newly fetched jobs")
	if err := j.ScoreNewJobs(fetchCtx); err != nil {
		logger.Error("Scoring error", zap.Error(err))
		return err
	}

	return nil
}

func (j *JobService) ScoreNewJobs(ctx context.Context) error {
	scoringStartTime := time.Now()
	logger.Info("Starting job scoring operation")

	if err := scorer.ScoreNewRows(ctx, j.store, j.skillVec); err != nil {
		logger.Error("Scoring error", zap.Error(err))
		return err
	}

	logger.Info("Scoring completed",
		zap.Duration("duration", time.Since(scoringStartTime)))
	return nil
}
