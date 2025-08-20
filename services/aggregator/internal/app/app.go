package app

import (
	"context"
	"fmt"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/handlers"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scheduler"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/services"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

type App struct {
	Config    *config.Config
	Store     *storage.Store
	Handlers  *handlers.Handlers
	Scheduler *scheduler.Scheduler
}

func NewApp() (*App, error) {
	// Initialize logger first
	if err := logger.InitLogger(); err != nil {
		return nil, fmt.Errorf("failed to initialize logger: %w", err)
	}

	logger.Info("Starting Remote Job Radar Aggregator Service")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}

	// Initialize database
	logger.Info("Establishing database connection")
	store, err := storage.New(cfg.DatabaseDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	logger.Info("Database connection established")

	// Start embedder and skills vector loading in the background
	var jobService *services.JobService
	var h *handlers.Handlers
	var s *scheduler.Scheduler

	go func() {
		embedder, err := scorer.NewEmbedder(cfg)
		if err != nil {
			logger.Error("Failed to initialize embedder (background)", zap.Error(err))
			return
		}
		skillsService := services.NewSkillsService(embedder, cfg.SkillsFile)
		logger.Info("[Background] Loading skills configuration and vector for job service")
		skillVec, err := skillsService.LoadSkillVector(context.Background())
		if err != nil {
			logger.Error("Failed to load skills vector (background)", zap.Error(err))
			return
		}
		jobService = services.NewJobService(store, skillVec, cfg.FetchTimeout, cfg)
		h = handlers.NewHandlers(store, jobService)
		s = scheduler.NewScheduler(jobService, cfg.FetchInterval, cfg.ScoreInterval, cfg.RunInitialFetch)
		logger.Info("[Background] Embedder and skills vector loaded, job service initialized")
	}()

	logger.Info("Embedder and skills vector loading in background; server setup starting now.")

	return &App{
		Config:    cfg,
		Store:     store,
		Handlers:  h,
		Scheduler: s,
	}, nil
}

func (a *App) Cleanup() {
	logger.Info("Cleaning up application resources...")

	if a.Scheduler != nil {
		a.Scheduler.Stop()
	}

	if a.Store != nil && a.Store.DB != nil {
		// Use a timeout for database cleanup to prevent hanging
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Try to ping first to check if connection is alive
		if err := a.Store.DB.PingContext(ctx); err != nil {
			logger.Warn("Database connection already closed or unavailable", zap.Error(err))
		} else {
			if err := a.Store.DB.Close(); err != nil {
				logger.Error("Error closing database connection", zap.Error(err))
			} else {
				logger.Info("Database connection closed")
			}
		}
	}

	logger.Sync()
	logger.Info("Application cleanup completed")
}
