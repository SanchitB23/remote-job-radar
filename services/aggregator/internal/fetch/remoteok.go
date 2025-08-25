package fetch

import (
	"encoding/json"
	"net/http"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/utils"
)

type RemoteOKJob struct {
	Slug        string   `json:"slug"`
	ID          string   `json:"id"`
	Epoch       int64    `json:"epoch"`
	Date        string   `json:"date"`
	Company     string   `json:"company"`
	CompanyLogo string   `json:"company_logo"`
	Position    string   `json:"position"`
	Tags        []string `json:"tags"`
	Logo        string   `json:"logo"`
	Description string   `json:"description"`
	Location    string   `json:"location"`
	SalaryMin   int      `json:"salary_min"`
	SalaryMax   int      `json:"salary_max"`
	ApplyURL    string   `json:"apply_url"`
	URL         string   `json:"url"`
}

func FetchRemoteOK() ([]storage.JobRow, error) {
	resp, err := http.Get("https://remoteok.com/api")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data []RemoteOKJob
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var jobs []storage.JobRow
	for _, r := range data {
		// Convert HTML description to plain text using utility function
		description, _ := utils.PreprocessText(r.Description, 0)

		// Create work type from tags
		workType := ""
		if len(r.Tags) > 0 {
			workType = r.Tags[0] // Use first tag as work type
		}

		jobs = append(jobs, storage.JobRow{
			ID:          "remoteok-" + r.ID,
			Source:      "remoteok",
			Title:       r.Position,
			Company:     r.Company,
			Description: description,
			Location:    r.Location,
			WorkType:    workType,
			URL:         r.URL,
			PublishedAt: r.Date,
			SalaryMin:   r.SalaryMin,
			SalaryMax:   r.SalaryMax,
		})
	}
	return jobs, nil
}
