package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/services"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

type Handlers struct {
	store      *storage.Store
	jobService *services.JobService
}

func NewHandlers(store *storage.Store, jobService *services.JobService) *Handlers {
	return &Handlers{
		store:      store,
		jobService: jobService,
	}
}

func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	logger.Info("Health check requested", zap.String("remote_addr", r.RemoteAddr))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (h *Handlers) HealthDB(w http.ResponseWriter, r *http.Request) {
	logger.Info("DB health check requested", zap.String("remote_addr", r.RemoteAddr))
	w.Header().Set("Content-Type", "application/json")

	err := h.store.Ping(r.Context())
	if err != nil {
		logger.Error("DB health check failed", zap.Error(err))
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":    false,
			"error": err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (h *Handlers) TriggerFetch(w http.ResponseWriter, r *http.Request) {
	logger.Info("Manual fetch triggered", zap.String("remote_addr", r.RemoteAddr))

	// Run fetch in background to avoid blocking the HTTP response
	// Use context.Background() instead of r.Context() to prevent cancellation
	go func() {
		ctx := context.Background()
		if err := h.jobService.FetchAndProcessJobs(ctx); err != nil {
			logger.Error("Manual fetch failed", zap.Error(err))
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "fetch triggered",
	})
}
