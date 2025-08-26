package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/services"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
)

type Handlers struct {
	store      *storage.Store
	jobService *services.JobService
	config     *config.Config
}

func NewHandlers(store *storage.Store, jobService *services.JobService, cfg *config.Config) *Handlers {
	return &Handlers{
		store:      store,
		jobService: jobService,
		config:     cfg,
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

	// Accept either ?token=... or ?cron_secret=... for authorization
	token := r.URL.Query().Get("token")
	cronSecret := r.Header.Get("X-Cron-Secret")

	validToken := token != "" && token == h.config.ManualJobFetchToken
	validCronSecret := cronSecret != "" && h.config.CronSecret != "" && cronSecret == h.config.CronSecret

	if !validToken && !validCronSecret {
		logger.Warn("Missing or invalid token or X-Cron-Secret header", zap.String("remote_addr", r.RemoteAddr))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":      false,
			"error":   "Missing or invalid token or X-Cron-Secret header",
			"message": "Authorization required",
		})
		return
	}

	if validToken {
		logger.Info("Token validation successful", zap.String("remote_addr", r.RemoteAddr))
	} else if validCronSecret {
		logger.Info("Cron secret validation successful", zap.String("remote_addr", r.RemoteAddr))
	}

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

	// Parse job_count parameter from query string
	var jobCount int
	if jobCountParam := r.URL.Query().Get("job_count"); jobCountParam != "" {
		if count, err := strconv.Atoi(jobCountParam); err == nil && count > 0 {
			jobCount = count
		} else {
			logger.Warn("Invalid job_count parameter, using default",
				zap.String("job_count", jobCountParam),
				zap.Error(err))
		}
	}

	logger.Info("Manual fetch with sources",
		zap.Strings("sources", sources),
		zap.Int("job_count", jobCount),
		zap.String("remote_addr", r.RemoteAddr))

	// Run fetch in background to avoid blocking the HTTP response
	// Use context.Background() instead of r.Context() to prevent cancellation
	go func() {
		ctx := context.Background()
		if err := h.jobService.FetchAndProcessJobsFromSources(ctx, sources, jobCount); err != nil {
			logger.Error("Manual fetch failed", zap.Error(err))
		}
	}()

	message := "fetch triggered"
	if len(sources) > 0 {
		message = fmt.Sprintf("fetch triggered for sources: %s", strings.Join(sources, ", "))
	}
	if jobCount > 0 {
		message = fmt.Sprintf("%s (max %d jobs per source)", message, jobCount)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":        true,
		"message":   message,
		"sources":   sources,
		"job_count": jobCount,
	})
}
