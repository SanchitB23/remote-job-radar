package fetch

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
)

const remotiveURL = "https://remotive.com/api/remote-jobs"

type remotiveResp struct {
	Jobs []struct {
		ID          int    `json:"id"`
		Title       string `json:"title"`
		CompanyName string `json:"company_name"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Salary      string `json:"salary"` // "80k-100k USD"
		URL         string `json:"url"`
		PublicDate  string `json:"publication_date"` // "2025-08-06T08:00:30"
	} `json:"jobs"`
}

func FetchRemotive() ([]storage.JobRow, error) {
	resp, err := http.Get(remotiveURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data remotiveResp
	if err = json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	rows := make([]storage.JobRow, 0, len(data.Jobs))
	for _, j := range data.Jobs {
		// Use source ID with prefix to prevent duplicates within source
		id := fmt.Sprintf("remotive-%d", j.ID)
		min, max := parseSalary(j.Salary)
		rows = append(rows, storage.JobRow{
			ID:          id,
			Source:      "remotive",
			Title:       j.Title,
			Company:     j.CompanyName,
			Description: j.Description,
			Location:    "", // Remotive doesn't provide location, only category
			WorkType:    j.Category,
			SalaryMin:   min,
			SalaryMax:   max,
			URL:         j.URL,
			PublishedAt: j.PublicDate,
		})
	}
	return rows, nil
}

func parseSalary(s string) (min, max int) {
	// crude "80k-100k" -> 80_000,100_000 parser (skips currency)
	var low, high int
	fmt.Sscanf(s, "%dk-%dk", &low, &high)
	return low * 1000, high * 1000
}
