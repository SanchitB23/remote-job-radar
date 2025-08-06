package fetch

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

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
		SalaryMin   float64 `json:"salary_min"`
		SalaryMax   float64 `json:"salary_max"`
		RedirectURL string  `json:"redirect_url"`
		Created     string  `json:"created"` // RFC3339
	} `json:"results"`
}

func FetchAdzuna(page int) ([]storage.JobRow, error) {
	q := url.Values{
		"app_id":           {os.Getenv("ADZUNA_APP_ID")},
		"app_key":          {os.Getenv("ADZUNA_APP_KEY")},
		"results_per_page": {"50"},
		"page":             {fmt.Sprintf("%d", page)},
		"what":             {"software"}, // filter optional
		"where":            {"remote"},
		"sort_by":          {"date"},
	}
	endpt := fmt.Sprintf("https://api.adzuna.com/v1/api/jobs/us/search/%d?%s", page, q.Encode())

	resp, err := http.Get(endpt)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data adzResp
	if err = json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	out := make([]storage.JobRow, 0, len(data.Results))
	for _, j := range data.Results {
		hash := fmt.Sprintf("%x", sha256.Sum256([]byte(j.RedirectURL)))
		out = append(out, storage.JobRow{
			ID:          hash,
			Source:      "adzuna",
			Title:       j.Title,
			Company:     j.Company.DisplayName,
			Description: j.Description,
			Location:    j.Location.DisplayName,
			SalaryMin:   int(j.SalaryMin),
			SalaryMax:   int(j.SalaryMax),
			URL:         j.RedirectURL,
			PublishedAt: j.Created,
		})
	}
	return out, nil
}
