package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"go.uber.org/zap"
)

type Config struct {
	// Server
	Port string

	// Database
	DatabaseDSN string

	// External services
	EmbedderURL string

	// Job Sources
	AdzunaBaseURL     string
	AdzunaAppID       string
	AdzunaAppKey      string
	RemotiveBaseURL   string
	FetcherMaxPageNum int

	// Skills
	SkillsFile string

	// Scheduling
	FetchInterval   time.Duration
	ScoreInterval   time.Duration
	FetchTimeout    time.Duration
	RunInitialFetch bool

	// Embedder Configuration
	EmbedderMaxRetries     int
	EmbedderBaseDelay      time.Duration
	EmbedderMaxDelay       time.Duration
	EmbedderRequestTimeout time.Duration
	EmbedderClientTimeout  time.Duration
	EmbedderMaxTextLength  int
	EmbedderWorkerCount    int

	// Security
	ManualJobFetchToken string

	// Environment
	Environment string
}

func Load() (*Config, error) {
	// Load environment file in local development
	env := os.Getenv("ENV")

	logger.Info("Loading configuration", zap.String("env", env))

	if env == "local" {
		if err := godotenv.Load(".env.local"); err != nil {
			logger.Warn("Could not load .env.local", zap.Error(err))
		}
	}

	cfg := &Config{
		Port:        getEnvWithDefault("PORT", "8080"),
		DatabaseDSN: getRequiredEnv("PG_DATABASE_URL"),
		EmbedderURL: getRequiredEnv("EMBEDDER_BASE_URL"),
		SkillsFile:  getRequiredEnv("SKILLS_FILE"),
		Environment: getEnvWithDefault("ENV", "development"),

		// Job Sources (optional)
		RemotiveBaseURL:   os.Getenv("REMOTIVE_BASE_URL"),
		AdzunaBaseURL:     os.Getenv("ADZUNA_BASE_URL"),
		AdzunaAppID:       os.Getenv("ADZUNA_APP_ID"),
		AdzunaAppKey:      os.Getenv("ADZUNA_APP_KEY"),
		FetcherMaxPageNum: getIntEnvWithDefault("FETCHER_MAX_PAGE_NUM", 3),

		// Scheduling defaults
		FetchInterval:   getDurationWithDefault("FETCH_INTERVAL", 2*time.Hour),
		ScoreInterval:   getDurationWithDefault("SCORE_INTERVAL", 4*time.Hour),
		FetchTimeout:    getDurationWithDefault("FETCH_TIMEOUT", 5*time.Minute),
		RunInitialFetch: getBoolEnvWithDefault("RUN_INITIAL_FETCH", false),

		// Embedder Configuration
		EmbedderMaxRetries:     getIntEnvWithDefault("EMBEDDER_MAX_RETRIES", 10),
		EmbedderBaseDelay:      getDurationWithDefault("EMBEDDER_BASE_DELAY", 1*time.Second),
		EmbedderMaxDelay:       getDurationWithDefault("EMBEDDER_MAX_DELAY", 30*time.Second),
		EmbedderRequestTimeout: getDurationWithDefault("EMBEDDER_REQUEST_TIMEOUT", 3*time.Minute),
		EmbedderClientTimeout:  getDurationWithDefault("EMBEDDER_CLIENT_TIMEOUT", 5*time.Minute),
		EmbedderMaxTextLength:  getIntEnvWithDefault("EMBEDDER_MAX_TEXT_LENGTH", 10000),
		EmbedderWorkerCount:    getIntEnvWithDefault("EMBEDDER_WORKER_COUNT", 5),

		// Security
		ManualJobFetchToken: getRequiredEnv("MANUAL_JOB_FETCH_TOKEN"),
	}

	logger.Info("Configuration loaded successfully",
		zap.String("port", cfg.Port),
		zap.String("environment", cfg.Environment),
		zap.Duration("fetchInterval", cfg.FetchInterval),
		zap.Duration("scoreInterval", cfg.ScoreInterval),
		zap.Bool("runInitialFetch", cfg.RunInitialFetch),
		zap.Bool("adzunaEnabled", cfg.AdzunaAppID != "" && cfg.AdzunaAppKey != ""),
		zap.Int("embedderMaxRetries", cfg.EmbedderMaxRetries),
		zap.Duration("embedderRequestTimeout", cfg.EmbedderRequestTimeout),
		zap.Int("embedderWorkerCount", cfg.EmbedderWorkerCount),
		zap.Int("embedderMaxTextLength", cfg.EmbedderMaxTextLength),
		zap.Bool("manualJobFetchTokenConfigured", cfg.ManualJobFetchToken != ""))

	return cfg, nil
}

func getRequiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		logger.Fatal("Required environment variable not set", zap.String("key", key))
	}
	return value
}

func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDurationWithDefault(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	if parsed, err := time.ParseDuration(value); err == nil {
		return parsed
	}

	// Try parsing as seconds (for backward compatibility)
	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second
	}

	logger.Warn("Invalid duration format, using default",
		zap.String("key", key),
		zap.String("value", value),
		zap.Duration("default", defaultValue))
	return defaultValue
}

// getIntEnvWithDefault returns the int value of an environment variable, or the default if unset or invalid
func getIntEnvWithDefault(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	if parsed, err := strconv.Atoi(value); err == nil {
		return parsed
	}
	logger.Warn("Invalid int format, using default",
		zap.String("key", key),
		zap.String("value", value),
		zap.Int("default", defaultValue))
	return defaultValue
}

// getBoolEnvWithDefault returns the bool value of an environment variable, or the default if unset or invalid
func getBoolEnvWithDefault(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	if parsed, err := strconv.ParseBool(value); err == nil {
		return parsed
	}
	logger.Warn("Invalid bool format, using default",
		zap.String("key", key),
		zap.String("value", value),
		zap.Bool("default", defaultValue))
	return defaultValue
}

// IsAdzunaEnabled returns true if Adzuna API credentials are configured
func (c *Config) IsAdzunaEnabled() bool {
	return c.AdzunaAppID != "" && c.AdzunaAppKey != ""
}
