package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/services"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

type Handlers struct {
	store *storage.Store
}

func NewHandlers(store *storage.Store) *Handlers {
	return &Handlers{
		store: store,
	}
}

func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	logger.Info("Health check requested", zap.String("remote_addr", r.RemoteAddr))
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (h *Handlers) Healthz(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (h *Handlers) HealthDB(w http.ResponseWriter, r *http.Request) {
	logger.Info("DB health check requested", zap.String("remote_addr", r.RemoteAddr))
	w.Header().Set("Content-Type", "application/json")

	err := h.store.Ping(r.Context())
	if err != nil {
		logger.Error("DB health check failed", zap.Error(err))
		w.WriteHeader(http.StatusServiceUnavailable)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":    false,
			"error": err.Error(),
		})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}

func (h *Handlers) TriggerFetch(w http.ResponseWriter, r *http.Request) {
	logger.Info("Manual fetch triggered", zap.String("remote_addr", r.RemoteAddr))

	// Parse sources parameter from query string
	var sources []string
	if sourcesParam := r.URL.Query().Get("sources"); sourcesParam != "" {
		// Split comma-separated sources and build sources slice directly
		for _, source := range strings.Split(sourcesParam, ",") {
			trimmed := strings.TrimSpace(source)
			if trimmed != "" {
				sources = append(sources, trimmed)
			}
		}
	}

	logger.Info("Manual fetch with sources",
		zap.Strings("sources", sources),
		zap.String("remote_addr", r.RemoteAddr))

	// Run fetch in background to avoid blocking the HTTP response
	// Use context.Background() instead of r.Context() to prevent cancellation
	go func() {
		ctx := context.Background()
		jobService := services.GetJobService()
		if err := jobService.FetchAndProcessJobsFromSources(ctx, sources); err != nil {
			logger.Error("Manual fetch failed", zap.Error(err))
		}
	}()

	message := "fetch triggered"
	if len(sources) > 0 {
		message = fmt.Sprintf("fetch triggered for sources: %s", strings.Join(sources, ", "))
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": message,
		"sources": sources,
	})
}
