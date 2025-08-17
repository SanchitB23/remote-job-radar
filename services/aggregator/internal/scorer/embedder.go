package scorer

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"go.uber.org/zap"
)

type Embedder struct {
	URL    string
	Client *http.Client
}

// EmbedRequest represents the request payload for embedding
type EmbedRequest struct {
	Text string `json:"text"`
}

// EmbedResponse represents the response from the embedding service
type EmbedResponse struct {
	Vector []float32 `json:"vector"`
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
			Timeout: 5 * time.Minute, // Very generous timeout for background jobs
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

// Precompiled regex patterns for HTML to text conversion
var (
	htmlDetectionRegex = regexp.MustCompile(`<[a-zA-Z][^>]*>`)
	blockElements      = regexp.MustCompile(`(?i)</(div|p|br|h[1-6]|li|tr)>`)
	listItems          = regexp.MustCompile(`(?i)<li[^>]*>`)
	htmlTagRegex       = regexp.MustCompile(`<[^>]*>`)
	whitespaceRegex    = regexp.MustCompile(`[ \t]+`)
	lineBreakRegex     = regexp.MustCompile(`\n\s*\n`)
)

// preprocessText cleans and prepares text for embedding
func preprocessText(text string) (string, bool) {
	if text == "" {
		return "", false
	}

	var wasHTML bool
	// Convert HTML to plain text if it appears to contain HTML
	if htmlDetectionRegex.MatchString(text) {
		text = convertHTMLToText(text)
		wasHTML = true
	}

	// Truncate very long text to prevent extremely long processing times
	const maxTextLength = 10000 // 10k characters should be plenty for job descriptions
	if len(text) > maxTextLength {
		text = text[:maxTextLength]
	}

	return strings.TrimSpace(text), wasHTML
}

// convertHTMLToText converts HTML content to plain text
func convertHTMLToText(htmlContent string) string {
	// First, unescape HTML entities
	text := html.UnescapeString(htmlContent)

	// Replace common block elements with line breaks for better readability
	text = blockElements.ReplaceAllString(text, "\n")

	// Replace list items with bullet points
	text = listItems.ReplaceAllString(text, "\n• ")

	// Remove all remaining HTML tags
	text = htmlTagRegex.ReplaceAllString(text, " ")

	// Clean up multiple whitespace characters but preserve line breaks
	text = whitespaceRegex.ReplaceAllString(text, " ")

	// Clean up multiple line breaks
	text = lineBreakRegex.ReplaceAllString(text, "\n")

	// Remove leading/trailing whitespace
	text = strings.TrimSpace(text)

	return text
}

func (e *Embedder) Embed(ctx context.Context, text string) ([]float32, error) {
	// Preprocess the text
	processedText, wasHTML := preprocessText(text)
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

	const (
		maxRetries = 10               // Increased retries for background jobs
		baseDelay  = 1 * time.Second  // Longer base delay
		maxDelay   = 30 * time.Second // Much higher max delay for background processing
	)

	var lastErr error
	var lastStatus int

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Check if the original context was cancelled before attempting
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled before attempt %d: %w", attempt+1, ctx.Err())
		default:
		}

		result, status, err := e.attemptRequest(ctx, body, textHash)
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
		shouldRetry := e.shouldRetryError(status, err)
		if !shouldRetry || attempt == maxRetries-1 {
			break
		}

		// Wait before retrying with exponential backoff
		delay := min(baseDelay*(1<<attempt), maxDelay)
		logger.Warn("Retrying embedder call",
			zap.Int("attempt", attempt+1),
			zap.Int("maxRetries", maxRetries),
			zap.Duration("delay", delay),
			zap.Error(err))

		select {
		case <-time.After(delay):
			continue
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled during retry delay: %w", ctx.Err())
		}
	}

	// All retries failed
	if lastErr != nil {
		return nil, fmt.Errorf("embedder service failed after %d attempts: %w", maxRetries, lastErr)
	}
	return nil, fmt.Errorf("embedder service failed with status %d after %d attempts", lastStatus, maxRetries)
}

// attemptRequest performs a single HTTP request attempt
func (e *Embedder) attemptRequest(ctx context.Context, body []byte, textHash string) ([]float32, int, error) {
	// Create request context that respects parent but extends timeout
	requestCtx, cancel := context.WithTimeout(ctx, 3*time.Minute)
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

// shouldRetryError determines if an error/status code should trigger a retry
func (e *Embedder) shouldRetryError(statusCode int, err error) bool {
	// Always retry on network/timeout errors
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
