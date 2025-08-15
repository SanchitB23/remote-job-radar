package scorer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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
			Timeout: 30 * time.Second,
		},
	}, nil
}

func min(a, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}

func (e *Embedder) Embed(ctx context.Context, text string) ([]float32, error) {
	if text == "" {
		return nil, fmt.Errorf("empty text provided for embedding")
	}

	logger.Debug("Calling embedder service", zap.Int("textLength", len(text)))

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

		httpResp, err := e.Client.Do(req)
		if err != nil {
			logger.Error("Failed to call embedder service", zap.Error(err))
			lastRespError = fmt.Errorf("failed to call embedder service: %w", err)
			break
		}

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
			logger.Debug("Successfully generated embedding", zap.Int("vectorDimensions", len(resp.Vector)))
			return resp.Vector, nil
		} else if httpResp.StatusCode == http.StatusTooManyRequests {
			httpResp.Body.Close()
			delay := min(baseDelay*(1<<attempt), maxDelay) // exponential backoff with cap
			logger.Warn("Embedder service rate limited (429), retrying", zap.Int("attempt", attempt+1), zap.Duration("delay", delay))
			select {
			case <-time.After(delay):
				// continue to next retry
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			continue
		} else {
			logger.Error("Embedder service returned non-OK status", zap.Int("statusCode", httpResp.StatusCode))
			lastRespError = fmt.Errorf("embedder service returned status %d", httpResp.StatusCode)
			httpResp.Body.Close()
			break
		}
	}
	// If we reach here, all retries failed
	if lastRespError != nil {
		return nil, lastRespError
	}
	return nil, fmt.Errorf("embedder service failed with status %d after %d attempts", lastStatus, maxRetries)
}
