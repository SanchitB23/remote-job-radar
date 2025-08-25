package fetch

import (
	"strings"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/utils"
)

func FetchWWR() ([]storage.JobRow, error) {
	fp := gofeed.NewParser()
	feed, err := fp.ParseURL("https://weworkremotely.com/remote-jobs.rss")
	if err != nil {
		return nil, err
	}

	var jobs []storage.JobRow
	for _, item := range feed.Items {
		// Extract company from title (usually format: "Company: Job Title")
		company := ""
		title := item.Title
		if colonIndex := strings.Index(item.Title, ":"); colonIndex > 0 {
			company = strings.TrimSpace(item.Title[:colonIndex])
			title = strings.TrimSpace(item.Title[colonIndex+1:])
		}

		// Extract location from region field
		location := ""
		if region := item.Custom["region"]; region != "" {
			location = region
		}

		// Extract work type from type field
		workType := ""
		if jobType := item.Custom["type"]; jobType != "" {
			workType = jobType
		}

		// Convert HTML description to plain text using utility function
		description, _ := utils.PreprocessText(item.Description, 0)

		// Parse published date
		publishedAt := ""
		if item.PublishedParsed != nil {
			publishedAt = item.PublishedParsed.Format(time.RFC3339)
		}

		jobs = append(jobs, storage.JobRow{
			ID:          "wwr-" + item.GUID,
			Source:      "weworkremotely",
			Title:       title,
			Company:     company,
			Description: description,
			Location:    location,
			WorkType:    workType,
			URL:         item.Link,
			PublishedAt: publishedAt,
			SalaryMin:   0, // WWR doesn't provide salary info in RSS
			SalaryMax:   0,
		})
	}
	return jobs, nil
}
