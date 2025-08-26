package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/app"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"go.uber.org/zap"
)

func main() {
	// Initialize application
	application, err := app.NewApp()
	if err != nil {
		logger.Fatal("Failed to initialize application", zap.Error(err))
	}
	defer application.Cleanup()

	// Setup HTTP server
	server := &http.Server{
		Addr:    ":" + application.Config.Port,
		Handler: application.Handlers.SetupRoutes(),
	}

	// Start HTTP server in background
	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("Starting HTTP server", zap.String("port", application.Config.Port))
		serverErrors <- server.ListenAndServe()
	}()

	logger.Info("Service fully initialized and ready to serve requests")

	// Wait for shutdown signals or server errors
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		logger.Error("Server error", zap.Error(err))
	case sig := <-shutdown:
		logger.Info("Shutdown signal received", zap.String("signal", sig.String()))
	}

	// Graceful shutdown
	logger.Info("Starting graceful shutdown...")

	// Shutdown HTTP server with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("HTTP server shutdown error", zap.Error(err))
		// Force close if graceful shutdown fails
		server.Close()
	} else {
		logger.Info("HTTP server shutdown complete")
	}

	logger.Info("Shutdown complete")
}
