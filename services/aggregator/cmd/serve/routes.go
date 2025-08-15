package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

func setupRoutes(store *storage.Store, skillVec []float32) http.Handler {
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("Health check requested", zap.String("remote_addr", r.RemoteAddr))
		w.Write([]byte("ok"))
	})

	r.Get("/health/db", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("DB health check requested", zap.String("remote_addr", r.RemoteAddr))
		err := store.Ping(r.Context())
		if err != nil {
			logger.Error("DB health check failed", zap.Error(err))
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte("db unhealthy: " + err.Error()))
			return
		}
		w.Write([]byte("db ok"))
	})

	r.Post("/fetch", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("Manual fetch triggered", zap.String("remote_addr", r.RemoteAddr))
		runFetch(store, skillVec)
		w.Write([]byte("triggered"))
	})

	return r
}
