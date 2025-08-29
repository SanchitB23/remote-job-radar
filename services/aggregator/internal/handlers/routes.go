package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func (h *Handlers) SetupRoutes() http.Handler {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	// Routes
	r.Get("/health", h.Health)
	r.Get("/health/db", h.HealthDB)
	r.Post("/fetch", h.TriggerFetch)
	r.Get("/healthz", h.Healthz)
	r.Delete("/clean", h.TriggerClean)

	return r
}
