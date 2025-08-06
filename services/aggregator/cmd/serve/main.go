package main

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/fetch"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

type skillFile struct {
	Skills []string `yaml:"skills"`
}

func loadSkillVec(ctx context.Context) []float32 {
	skillsFile := os.Getenv("SKILLS_FILE")
	logger.Info("Loading skills from file", zap.String("file", skillsFile))

	buf, err := os.ReadFile(skillsFile)
	if err != nil {
		logger.Error("Error reading skills file", zap.Error(err), zap.String("file", skillsFile))
		return nil
	}

	var sf skillFile
	if err := yaml.Unmarshal(buf, &sf); err != nil {
		logger.Error("Error parsing skills YAML", zap.Error(err))
		return nil
	}

	logger.Info("Loaded skills",
		zap.Int("count", len(sf.Skills)),
		zap.Strings("skills", sf.Skills))
	skillsText := strings.Join(sf.Skills, " ")

	logger.Info("Generating embeddings for skills")
	emb, err := scorer.Embed(ctx, skillsText)
	if err != nil {
		logger.Error("Error generating embeddings", zap.Error(err))
		return nil
	}

	logger.Info("Generated embeddings vector",
		zap.Int("dimensions", len(emb)))
	return emb
}

func main() {
	if err := logger.InitLogger(); err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting Remote Job Radar Aggregator Service")

	err := godotenv.Load(".env.local") // load DB_DSN, etc.
	if err != nil {
		logger.Warn("Could not load .env.local", zap.Error(err))
	}

	dsn := os.Getenv("DB_DSN")
	logger.Info("Database configuration", zap.String("dsn", dsn))

	logger.Info("Establishing database connection")
	store, err := storage.New(dsn)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	logger.Info("Database connection established")

	logger.Info("Loading skills configuration")
	skillVec := loadSkillVec(context.Background())
	if skillVec == nil {
		logger.Fatal("Failed to load skills vector")
	}

	// Kick off first fetch on startup
	logger.Info("Starting initial fetch")
	runFetch(store, skillVec)
	logger.Info("Initial fetch completed")

	// schedule every 2 h
	logger.Info("Setting up scheduled fetch job", zap.Duration("interval", 2*time.Hour))
	ticker := time.NewTicker(2 * time.Hour)
	go func() {
		for range ticker.C {
			logger.Info("Scheduled fetch triggered")
			runFetch(store, skillVec)
		}
	}()

	logger.Info("Setting up scheduled scoring job", zap.Duration("interval", 4*time.Hour))
	scoreTicker := time.NewTicker(4 * time.Hour)
	go func() {
		for range scoreTicker.C {
			logger.Info("Scheduled scoring triggered")
			startTime := time.Now()
			scorer.ScoreNewRows(context.Background(), store, skillVec)
			logger.Info("Scoring completed", zap.Duration("duration", time.Since(startTime)))
		}
	}()

	// tiny REST for health + manual trigger
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	logger.Info("Starting HTTP server", zap.String("port", port))
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("Health check requested", zap.String("remote_addr", r.RemoteAddr))
		w.Write([]byte("ok"))
	})

	r.Post("/fetch", func(w http.ResponseWriter, r *http.Request) {
		logger.Info("Manual fetch triggered", zap.String("remote_addr", r.RemoteAddr))
		runFetch(store, skillVec)
		w.Write([]byte("triggered"))
	})

	logger.Info("Service fully initialized and ready to serve requests")
	logger.Fatal("HTTP server stopped", zap.Error(http.ListenAndServe(":"+port, r)))
}

func runFetch(store *storage.Store, skillVec []float32) {
	startTime := time.Now()
	logger.Info("Starting job fetch operation")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	logger.Info("Fetching jobs from Remotive API")
	rows, err := fetch.FetchRemotive()
	if err != nil {
		logger.Error("Fetch error", zap.Error(err))
		return
	}

	logger.Info("Retrieved jobs from Remotive", zap.Int("count", len(rows)))

	logger.Info("Upserting jobs to database")
	if err = store.UpsertJobs(ctx, rows); err != nil {
		logger.Error("Database error", zap.Error(err))
		return
	}

	duration := time.Since(startTime)
	logger.Info("Successfully upserted Remotive jobs",
		zap.Int("count", len(rows)),
		zap.Duration("duration", duration))

	// Immediately score new jobs after fetching
	logger.Info("Scoring newly fetched jobs")
	scoringStartTime := time.Now()
	if err := scorer.ScoreNewRows(context.Background(), store, skillVec); err != nil {
		logger.Error("Scoring error", zap.Error(err))
	} else {
		logger.Info("Scoring completed for new jobs",
			zap.Duration("duration", time.Since(scoringStartTime)))
	}
}
