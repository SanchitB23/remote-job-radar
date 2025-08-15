package main

import (
	"encoding/json"
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
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})

	r.Get("/health/db", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("DB health check requested", zap.String("remote_addr", r.RemoteAddr))
		w.Header().Set("Content-Type", "application/json")
		err := store.Ping(r.Context())
		if err != nil {
			logger.Error("DB health check failed", zap.Error(err))
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "error": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})

	r.Post("/fetch", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("Manual fetch triggered", zap.String("remote_addr", r.RemoteAddr))
		runFetch(store, skillVec)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "message": "triggered"})
	})

	return r
}
