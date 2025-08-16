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
	AdzunaAppID  string
	AdzunaAppKey string

	// Skills
	SkillsFile string

	// Scheduling
	FetchInterval time.Duration
	ScoreInterval time.Duration
	FetchTimeout  time.Duration

	// Environment
	Environment string
}

func Load() (*Config, error) {
	// Load environment file in local development
	env := os.Getenv("ENV")
	goEnv := os.Getenv("GO_ENV")
	ginMode := os.Getenv("GIN_MODE")

	logger.Info("Loading configuration",
		zap.String("env", env),
		zap.String("goEnv", goEnv),
		zap.String("ginMode", ginMode))

	if env == "local" || goEnv == "local" || ginMode == "debug" {
		if err := godotenv.Load(".env.local"); err != nil {
			logger.Warn("Could not load .env.local", zap.Error(err))
		}
	}

	cfg := &Config{
		Port:        getEnvWithDefault("PORT", "8080"),
		DatabaseDSN: getRequiredEnv("DB_DSN"),
		EmbedderURL: getRequiredEnv("EMBEDDER_URL"),
		SkillsFile:  getRequiredEnv("SKILLS_FILE"),
		Environment: getEnvWithDefault("ENV", "development"),

		// Job Sources (optional)
		AdzunaAppID:  os.Getenv("ADZUNA_APP_ID"),
		AdzunaAppKey: os.Getenv("ADZUNA_APP_KEY"),

		// Scheduling defaults
		FetchInterval: getDurationWithDefault("FETCH_INTERVAL", 2*time.Hour),
		ScoreInterval: getDurationWithDefault("SCORE_INTERVAL", 4*time.Hour),
		FetchTimeout:  getDurationWithDefault("FETCH_TIMEOUT", 30*time.Second),
	}

	logger.Info("Configuration loaded successfully",
		zap.String("port", cfg.Port),
		zap.String("environment", cfg.Environment),
		zap.Duration("fetchInterval", cfg.FetchInterval),
		zap.Duration("scoreInterval", cfg.ScoreInterval),
		zap.Bool("adzunaEnabled", cfg.AdzunaAppID != "" && cfg.AdzunaAppKey != ""))

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

// IsAdzunaEnabled returns true if Adzuna API credentials are configured
func (c *Config) IsAdzunaEnabled() bool {
	return c.AdzunaAppID != "" && c.AdzunaAppKey != ""
}
