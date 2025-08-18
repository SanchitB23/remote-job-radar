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
		PublicDate  string `json:"publication_date"`            // "2025-08-06T08:00:30"
		Location    string `json:"candidate_required_location"` // "Remote"
	} `json:"jobs"`
}

func Remotive() ([]storage.JobRow, error) {
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
		minSal, maxSal := parseSalary(j.Salary)
		rows = append(rows, storage.JobRow{
			ID:          id,
			Source:      "remotive",
			Title:       j.Title,
			Company:     j.CompanyName,
			Description: j.Description,
			Location:    "", // Remotive doesn't provide location, only category
			WorkType:    j.Category,
			SalaryMin:   minSal,
			SalaryMax:   maxSal,
			URL:         j.URL,
			PublishedAt: j.PublicDate,
		})
	}
	return rows, nil
}

func parseSalary(s string) (minSal, maxSal int) {
	// crude "80k-100k" -> 80_000,100_000 parser (skips currency)
	var low, high int
	_, err := fmt.Sscanf(s, "%dk-%dk", &low, &high)
	if err != nil {
		return 0, 0
	}
	return low * 1000, high * 1000
}
