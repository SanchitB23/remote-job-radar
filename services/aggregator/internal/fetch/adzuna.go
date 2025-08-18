package fetch

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
)

type adzResp struct {
	Results []struct {
		ID      string `json:"id"`
		Title   string `json:"title"`
		Company struct {
			DisplayName string `json:"display_name"`
		} `json:"company"`
		Description string `json:"description"`
		Location    struct {
			DisplayName string `json:"display_name"`
		} `json:"location"`
		Category struct {
			Label string `json:"label"`
		} `json:"category"`
		SalaryMin   float64 `json:"salary_min"`
		SalaryMax   float64 `json:"salary_max"`
		RedirectURL string  `json:"redirect_url"`
		Created     string  `json:"created"` // RFC3339
	} `json:"results"`
}

func Adzuna(ctx context.Context, page int, appID, appKey string) ([]storage.JobRow, error) {
	if appID == "" || appKey == "" {
		return nil, fmt.Errorf("adzuna API credentials are required")
	}

	q := url.Values{
		"app_id":           {appID},
		"app_key":          {appKey},
		"results_per_page": {"50"},
		"sort_by":          {"date"},
	}
	endpt := fmt.Sprintf("https://api.adzuna.com/v1/api/jobs/us/search/%d?%s", page, q.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpt, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check for non-200 status codes and log the response body for debugging
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("adzuna: status %d, body: %s", resp.StatusCode, string(body))
	}
	// Check for non-JSON content-type (e.g., HTML error page)
	if ct := resp.Header.Get("Content-Type"); ct != "" && !strings.Contains(ct, "json") {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("adzuna: unexpected content-type %s, body: %s", ct, string(body))
	}

	var data adzResp
	if err = json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	out := make([]storage.JobRow, 0, len(data.Results))
	for _, j := range data.Results {
		// Use source ID with prefix to prevent duplicates within source
		id := fmt.Sprintf("adzuna-%s", j.ID)
		// Remove "Job" or "Jobs" (case-insensitive, suffix only) from category label
		workType := strings.TrimSpace(j.Category.Label)
		workType = strings.TrimSuffix(workType, " Jobs")
		workType = strings.TrimSuffix(workType, " jobs")
		workType = strings.TrimSuffix(workType, " Job")
		workType = strings.TrimSuffix(workType, " job")

		out = append(out, storage.JobRow{
			ID:          id,
			Source:      "adzuna",
			Title:       j.Title,
			Company:     j.Company.DisplayName,
			Description: j.Description,
			Location:    j.Location.DisplayName,
			WorkType:    workType,
			SalaryMin:   int(j.SalaryMin),
			SalaryMax:   int(j.SalaryMax),
			URL:         j.RedirectURL,
			PublishedAt: j.Created,
		})
	}
	return out, nil
}
