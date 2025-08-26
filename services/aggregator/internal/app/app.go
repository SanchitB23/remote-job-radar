package app

import (
	"context"
	"fmt"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/handlers"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/services"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

type App struct {
	Config   *config.Config
	Store    *storage.Store
	Handlers *handlers.Handlers
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

	// Initialize embedder
	embedder, err := scorer.NewEmbedder(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize embedder: %w", err)
	}

	// Initialize skills service and load skill vector
	skillsService := services.NewSkillsService(embedder, cfg.SkillsFile)
	logger.Info("Loading skills configuration")
	skillVec, err := skillsService.LoadSkillVector(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to load skills vector: %w", err)
	}

	// Initialize job service
	jobService := services.NewJobService(store, skillVec, cfg.FetchTimeout, cfg)

	// Initialize handlers
	handlers := handlers.NewHandlers(store, jobService, cfg)

	return &App{
		Config:   cfg,
		Store:    store,
		Handlers: handlers,
	}, nil
}

func (a *App) Cleanup() {
	logger.Info("Cleaning up application resources...")

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
