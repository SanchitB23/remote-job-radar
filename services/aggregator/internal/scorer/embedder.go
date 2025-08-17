package scorer

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"go.uber.org/zap"
)

type Embedder struct {
	URL    string
	Client *http.Client
}

func NewEmbedder() (*Embedder, error) {
	embedderURL := os.Getenv("EMBEDDER_URL")
	if embedderURL == "" {
		logger.Error("EMBEDDER_URL environment variable not set")
		return nil, fmt.Errorf("EMBEDDER_URL environment variable not set")
	}
	return &Embedder{
		URL: embedderURL,
		Client: &http.Client{
			Timeout: 60 * time.Second, // Increased from 30 to 60 seconds for longer embeddings
		},
	}, nil
}

func min(a, b time.Duration) time.Duration {
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
	if text == "" {
		return nil, fmt.Errorf("empty text provided for embedding")
	}

	// Generate hash and preview for cross-service logging synchronization
	hash := sha256.Sum256([]byte(text))
	textHash := hex.EncodeToString(hash[:])
	textPreview := strings.ReplaceAll(strings.ReplaceAll(text[:minInt(100, len(text))], "\n", " "), "\r", "")

	logger.Info("[EMBED_REQUEST] Starting embedding request",
		zap.Int("textLength", len(text)),
		zap.String("sha256", textHash),
		zap.String("preview", textPreview+"..."))

	body, err := json.Marshal(map[string]string{"text": text})
	if err != nil {
		logger.Error("Failed to marshal embedding request", zap.Error(err))
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	var (
		maxRetries    = 5
		baseDelay     = 500 * time.Millisecond
		maxDelay      = 2 * time.Second // cap the delay to 2 seconds
		lastStatus    int
		lastRespError error
	)
	for attempt := 0; attempt < maxRetries; attempt++ {
		reader := bytes.NewReader(body)
		req, err := http.NewRequestWithContext(ctx, "POST", e.URL, reader)
		if err != nil {
			logger.Error("Failed to create HTTP request", zap.Error(err))
			return nil, fmt.Errorf("failed to create request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		shouldRetry := false

		httpResp, err := e.Client.Do(req)
		if err != nil {
			logger.Error("Failed to call embedder service", zap.Error(err), zap.ByteString("requestBody", body))
			lastRespError = fmt.Errorf("failed to call embedder service: %w", err)
			shouldRetry = true
		} else {
			lastStatus = httpResp.StatusCode
			if httpResp.StatusCode == http.StatusOK {
				var resp struct {
					Vector []float32 `json:"vector"`
				}
				decodeErr := json.NewDecoder(httpResp.Body).Decode(&resp)
				httpResp.Body.Close()
				if decodeErr != nil {
					logger.Error("Failed to decode embedder response", zap.Error(decodeErr))
					return nil, fmt.Errorf("failed to decode response: %w", decodeErr)
				}
				if len(resp.Vector) == 0 {
					logger.Error("Embedder returned empty vector")
					return nil, fmt.Errorf("embedder returned empty vector")
				}
				logger.Info("[EMBED_SUCCESS] Received embedding response",
					zap.Int("vectorDimensions", len(resp.Vector)),
					zap.String("sha256", textHash),
					zap.Int("textLength", len(text)))
				return resp.Vector, nil
			} else if httpResp.StatusCode == http.StatusTooManyRequests {
				httpResp.Body.Close()
				shouldRetry = true
				lastRespError = fmt.Errorf("embedder service rate limited (429)")
			} else if httpResp.StatusCode >= 500 && httpResp.StatusCode < 600 {
				// Retry on server errors
				logger.Error("Embedder service returned server error", zap.Int("statusCode", httpResp.StatusCode))
				lastRespError = fmt.Errorf("embedder service returned status %d", httpResp.StatusCode)
				httpResp.Body.Close()
				shouldRetry = true
			} else {
				logger.Error("Embedder service returned non-OK status", zap.Int("statusCode", httpResp.StatusCode))
				lastRespError = fmt.Errorf("embedder service returned status %d", httpResp.StatusCode)
				httpResp.Body.Close()
				shouldRetry = false
			}
		}

		if shouldRetry && attempt < maxRetries-1 {
			delay := min(baseDelay*(1<<attempt), maxDelay)
			logger.Warn("Retrying embedder call", zap.Int("attempt", attempt+1), zap.Duration("delay", delay))
			select {
			case <-time.After(delay):
				continue
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		} else if shouldRetry {
			break
		} else if !shouldRetry {
			break
		}
	}
	// If we reach here, all retries failed
	if lastRespError != nil {
		return nil, lastRespError
	}
	return nil, fmt.Errorf("embedder service failed with status %d after %d attempts", lastStatus, maxRetries)
}
