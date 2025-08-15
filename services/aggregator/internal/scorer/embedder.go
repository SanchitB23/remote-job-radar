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

	req, err := http.NewRequestWithContext(ctx, "POST", e.URL, bytes.NewReader(body))
	if err != nil {
		logger.Error("Failed to create HTTP request", zap.Error(err))
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	httpResp, err := e.Client.Do(req)
	if err != nil {
		logger.Error("Failed to call embedder service", zap.Error(err))
		return nil, fmt.Errorf("failed to call embedder service: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		logger.Error("Embedder service returned non-OK status",
			zap.Int("statusCode", httpResp.StatusCode))
		return nil, fmt.Errorf("embedder service returned status %d", httpResp.StatusCode)
	}

	var resp struct {
		Vector []float32 `json:"vector"`
	}
	if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
		logger.Error("Failed to decode embedder response", zap.Error(err))
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(resp.Vector) == 0 {
		logger.Error("Embedder returned empty vector")
		return nil, fmt.Errorf("embedder returned empty vector")
	}

	logger.Debug("Successfully generated embedding", zap.Int("vectorDimensions", len(resp.Vector)))
	return resp.Vector, nil
}
