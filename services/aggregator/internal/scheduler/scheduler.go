package scheduler

import (
	"context"
	"sync"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/services"
	"go.uber.org/zap"
)

type Scheduler struct {
	jobService    *services.JobService
	fetchInterval time.Duration
	scoreInterval time.Duration

	// For graceful shutdown
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewScheduler(jobService *services.JobService, fetchInterval, scoreInterval time.Duration) *Scheduler {
	return &Scheduler{
		jobService:    jobService,
		fetchInterval: fetchInterval,
		scoreInterval: scoreInterval,
	}
}

func (s *Scheduler) Start(ctx context.Context) {
	// Create a cancellable context for the scheduler
	schedulerCtx, cancel := context.WithCancel(ctx)
	s.cancel = cancel

	logger.Info("Starting scheduler",
		zap.Duration("fetchInterval", s.fetchInterval),
		zap.Duration("scoreInterval", s.scoreInterval))

	// Run initial fetch
	logger.Info("Running initial fetch")
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		if err := s.jobService.FetchAndProcessJobs(schedulerCtx); err != nil {
			logger.Error("Initial fetch failed", zap.Error(err))
		} else {
			logger.Info("Initial fetch completed")
		}
	}()

	// Schedule periodic fetch jobs
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		s.scheduleTask(schedulerCtx, "fetch", s.fetchInterval, func() {
			if err := s.jobService.FetchAndProcessJobs(schedulerCtx); err != nil {
				logger.Error("Scheduled fetch failed", zap.Error(err))
			}
		})
	}()

	// Schedule periodic scoring jobs
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		s.scheduleTask(schedulerCtx, "score", s.scoreInterval, func() {
			if err := s.jobService.ScoreNewJobs(schedulerCtx); err != nil {
				logger.Error("Scheduled scoring failed", zap.Error(err))
			}
		})
	}()
}

func (s *Scheduler) Stop() {
	logger.Info("Stopping scheduler...")

	if s.cancel != nil {
		s.cancel()
	}

	// Wait for all goroutines to finish
	s.wg.Wait()

	logger.Info("Scheduler stopped")
}

func (s *Scheduler) scheduleTask(ctx context.Context, taskName string, interval time.Duration, task func()) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	logger.Info("Started scheduled task",
		zap.String("task", taskName),
		zap.Duration("interval", interval))

	for {
		select {
		case <-ctx.Done():
			logger.Info("Stopping scheduled task", zap.String("task", taskName))
			return
		case <-ticker.C:
			logger.Info("Executing scheduled task", zap.String("task", taskName))
			startTime := time.Now()
			task()
			logger.Info("Completed scheduled task",
				zap.String("task", taskName),
				zap.Duration("duration", time.Since(startTime)))
		}
	}
}
