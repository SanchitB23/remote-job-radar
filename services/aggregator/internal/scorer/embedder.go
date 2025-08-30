package scorer

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/utils"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"go.uber.org/zap"
)

type Embedder struct {
	URL         string
	Client      *http.Client
	Config      *config.Config
	warmupDone  bool
	warmupMutex sync.Mutex
}

// EmbedRequest represents the request payload for embedding
type EmbedRequest struct {
	Text string `json:"text"`
}

// EmbedResponse represents the response from the embedding service
type EmbedResponse struct {
	Vector []float32 `json:"vector"`
}

// HealthResponse represents the response from the web app health endpoint
type HealthResponse struct {
	Ok        bool   `json:"ok"`
	Error     string `json:"error,omitempty"`
	Timestamp string `json:"timestamp,omitempty"`
}

func NewEmbedder(cfg *config.Config) (*Embedder, error) {
	if cfg.EmbedderURL == "" {
		logger.Error("EMBEDDER_URL not configured")
		return nil, fmt.Errorf("EMBEDDER_URL not configured")
	}
	return &Embedder{
		URL:    strings.TrimRight(cfg.EmbedderURL, "/") + "/embed",
		Config: cfg,
		Client: &http.Client{
			Timeout: cfg.EmbedderClientTimeout,
		},
	}, nil
}

// ensureEmbedderWarmedUp ensures the embedder service is warmed up before making calls
func (e *Embedder) ensureEmbedderWarmedUp(ctx context.Context) error {
	e.warmupMutex.Lock()
	defer e.warmupMutex.Unlock()

	// If already warmed up, return immediately
	if e.warmupDone {
		return nil
	}

	// Attempt to warm up the embedder
	if err := e.warmupEmbedder(ctx); err != nil {
		logger.Warn("[EMBEDDER_WARMUP] Warmup failed, proceeding with direct embedder call",
			zap.Error(err))
		// Don't return error here - proceed with direct call as fallback
		// This ensures backward compatibility if the web app is not available
	} else {
		e.warmupDone = true
		logger.Info("[EMBEDDER_WARMUP] Embedder successfully warmed up")
	}

	return nil
}

// warmupEmbedder warms up the embedder service by calling the web app's health endpoint
func (e *Embedder) warmupEmbedder(ctx context.Context) error {
	if e.Config.WebAppURL == "" {
		return fmt.Errorf("WEB_APP_BASE_URL not configured")
	}

	// Validate that WEB_APP_BASE_URL includes a protocol
	if !strings.HasPrefix(e.Config.WebAppURL, "http://") && !strings.HasPrefix(e.Config.WebAppURL, "https://") {
		return fmt.Errorf("WEB_APP_BASE_URL must include a protocol (http:// or https://), got: %s", e.Config.WebAppURL)
	}

	// Build the health endpoint URL
	webAppURL := strings.TrimRight(e.Config.WebAppURL, "/")
	healthURL := webAppURL + "/api/health/embedder"

	logger.Info("[EMBEDDER_WARMUP] Starting embedder warmup via web app health endpoint",
		zap.String("healthURL", healthURL))

	// Create request with context and timeout - use embedder request timeout since cold starts can take time
	warmupCtx, cancel := context.WithTimeout(ctx, e.Config.EmbedderRequestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(warmupCtx, "GET", healthURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create warmup request: %w", err)
	}

	// Set headers
	req.Header.Set("User-Agent", "aggregator-service/warmup")
	req.Header.Set("Accept", "application/json")

	// Make the request
	resp, err := e.Client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call web app health endpoint: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read health response body: %w", err)
	}

	// Attempt to parse the response as JSON
	var healthResp HealthResponse
	if err := json.Unmarshal(body, &healthResp); err != nil {
		logger.Warn("[EMBEDDER_WARMUP] Failed to decode health response as JSON",
			zap.String("rawResponse", string(body)),
			zap.Error(err))
		return fmt.Errorf("failed to decode health response: %w", err)
	}

	// Check if the embedder is healthy
	if !healthResp.Ok {
		return fmt.Errorf("embedder health check failed: %s", healthResp.Error)
	}

	logger.Info("[EMBEDDER_WARMUP] Embedder successfully warmed up",
		zap.String("healthURL", healthURL),
		zap.Int("statusCode", resp.StatusCode),
		zap.String("timestamp", healthResp.Timestamp))

	return nil
}

func minDuration(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (e *Embedder) Embed(ctx context.Context, text string) ([]float32, error) {
	// Ensure embedder is warmed up before proceeding
	if err := e.ensureEmbedderWarmedUp(ctx); err != nil {
		logger.Warn("[EMBEDDER_WARMUP] Warmup process encountered an issue, proceeding anyway",
			zap.Error(err))
	}

	// Preprocess the text using shared utils
	processedText, wasHTML := utils.PreprocessText(text, e.Config.EmbedderMaxTextLength)
	if processedText == "" {
		return nil, fmt.Errorf("empty text provided for embedding")
	}

	// Generate hash and preview for cross-service logging synchronization
	hash := sha256.Sum256([]byte(processedText))
	textHash := hex.EncodeToString(hash[:])
	textPreview := strings.ReplaceAll(strings.ReplaceAll(processedText[:minInt(100, len(processedText))], "\n", " "), "\r", "")

	// Log at debug level to reduce production log volume
	logger.Info("[EMBED_REQUEST] Starting embedding request",
		zap.Int("originalLength", len(text)),
		zap.Int("processedLength", len(processedText)),
		zap.Bool("wasHTML", wasHTML),
		zap.String("sha256", textHash),
		zap.String("preview", textPreview+"..."))

	return e.performEmbedding(ctx, processedText, textHash)
}

// performEmbedding handles the actual HTTP request with robust retry logic
func (e *Embedder) performEmbedding(ctx context.Context, text, textHash string) ([]float32, error) {
	request := EmbedRequest{Text: text}
	body, err := json.Marshal(request)
	if err != nil {
		logger.Error("Failed to marshal embedding request", zap.Error(err))
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	maxRetries := e.Config.EmbedderMaxRetries
	baseDelay := e.Config.EmbedderBaseDelay
	maxDelay := e.Config.EmbedderMaxDelay

	var lastErr error
	var lastStatus int

	for attempt := 0; attempt < maxRetries; attempt++ {
		// For background jobs, if the context is already cancelled, create a fresh one
		// This allows embeddings to complete even if the parent operation times out
		workingCtx := ctx
		if ctx.Err() != nil {
			logger.Warn("Parent context cancelled, creating independent context for background embedding",
				zap.String("parentError", ctx.Err().Error()),
				zap.Int("attempt", attempt+1))
			// Create a completely independent context for this operation
			independentCtx, cancel := context.WithTimeout(context.Background(), e.Config.EmbedderRequestTimeout)
			defer cancel()
			workingCtx = independentCtx
		}

		result, status, err := e.attemptRequest(workingCtx, body)
		if err == nil {
			// Success case
			logger.Info("[EMBED_SUCCESS] Received embedding response",
				zap.Int("vectorDimensions", len(result)),
				zap.String("sha256", textHash),
				zap.Int("textLength", len(text)),
				zap.Int("attempt", attempt+1))
			return result, nil
		}

		lastErr = err
		lastStatus = status

		// Determine if we should retry
		shouldRetry := e.shouldRetryError(status)
		if !shouldRetry || attempt == maxRetries-1 {
			break
		}

		// Wait before retrying with exponential backoff
		delay := minDuration(baseDelay*(1<<attempt), maxDelay)
		logger.Warn("Retrying embedder call",
			zap.Int("attempt", attempt+1),
			zap.Int("maxRetries", maxRetries),
			zap.Duration("delay", delay),
			zap.Error(err))

		// Use working context for delay as well
		select {
		case <-time.After(delay):
			continue
		case <-workingCtx.Done():
			return nil, fmt.Errorf("context cancelled during retry delay: %w", workingCtx.Err())
		}
	}

	// All retries failed
	if lastErr != nil {
		return nil, fmt.Errorf("embedder service failed after %d attempts: %w", maxRetries, lastErr)
	}
	return nil, fmt.Errorf("embedder service failed with status %d after %d attempts", lastStatus, maxRetries)
}

func (e *Embedder) attemptRequest(ctx context.Context, body []byte) ([]float32, int, error) {
	// Create request context that respects parent but extends timeout
	requestCtx, cancel := context.WithTimeout(ctx, e.Config.EmbedderRequestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(requestCtx, "POST", e.URL, bytes.NewReader(body))
	if err != nil {
		return nil, 0, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := e.Client.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to call embedder service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("embedder service returned status %d", resp.StatusCode)
	}

	var embedResp EmbedResponse
	if err := json.NewDecoder(resp.Body).Decode(&embedResp); err != nil {
		return nil, resp.StatusCode, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(embedResp.Vector) == 0 {
		return nil, resp.StatusCode, fmt.Errorf("embedder returned empty vector")
	}

	return embedResp.Vector, resp.StatusCode, nil
}

// shouldRetryError determines if a given HTTP status code should trigger a retry
func (e *Embedder) shouldRetryError(statusCode int) bool {
	// Always retry on unknown status (e.g., network/timeout errors are represented as statusCode == 0)
	if statusCode == 0 {
		return true
	}

	// Retry on rate limiting
	if statusCode == http.StatusTooManyRequests {
		return true
	}

	// Retry on server errors
	if statusCode >= 500 && statusCode < 600 {
		return true
	}

	// Don't retry on client errors (400-499, except 429)
	return false
}
