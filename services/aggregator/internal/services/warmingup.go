package services

import (
	"context"
	"errors"
)

type WarmingUpJobService struct{}

func (w *WarmingUpJobService) FetchAndProcessJobs(ctx context.Context) error {
	return ErrWarmingUp
}

func (w *WarmingUpJobService) FetchAndProcessJobsFromSources(ctx context.Context, sources []string) error {
	return ErrWarmingUp
}

func (w *WarmingUpJobService) ScoreNewJobs(ctx context.Context) error {
	return ErrWarmingUp
}

var ErrWarmingUp = errors.New("service warming up, please try again soon")
