package scorer

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
)

func Embed(ctx context.Context, text string) ([]float32, error) {
	body, _ := json.Marshal(map[string]string{"text": text})
	req, _ := http.NewRequestWithContext(ctx, "POST", "http://localhost:8000/embed", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	var resp struct{ Vector []float32 `json:"vector"` }
	client := &http.Client{}
	httpResp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()
	if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
		return nil, err
	}
	return resp.Vector, nil
}