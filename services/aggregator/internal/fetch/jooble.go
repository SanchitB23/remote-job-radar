package fetch

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/utils"
)

type JoobleResp struct {
	Jobs []struct {
		ID       json.Number `json:"id"`
		Title    string      `json:"title"`
		Company  string      `json:"company"`
		Location string      `json:"location"`
		Snippet  string      `json:"snippet"`
		Link     string      `json:"link"`
		Updated  string      `json:"updated"`
		Salary   string      `json:"salary"`
	} `json:"jobs"`
}

func Jooble(ctx context.Context, page int, apiKey string, keywords string, location string, jobCount int) ([]storage.JobRow, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("jooble API key is required")
	}

	// Calculate results per page based on jobCount
	resultsPerPage := 50 // default Jooble page size
	if jobCount > 0 {
		// If jobCount is specified, calculate how many results we need per page
		// For the first page, we might need fewer results if jobCount < 50
		if page == 1 && jobCount < 50 {
			resultsPerPage = jobCount
		}
		// For subsequent pages, we'll use the standard 50 but the calling logic will handle limiting
	}

	// Build request body with configurable parameters
	requestBody := map[string]interface{}{
		"keywords": keywords,
		"location": location,
		"page":     page,
		"limit":    resultsPerPage,
	}

	// Convert to JSON
	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create HTTP request with context
	req, err := http.NewRequestWithContext(ctx, "POST", "https://jooble.org/api/"+apiKey, strings.NewReader(string(bodyBytes)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	// Make the request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check for non-200 status codes
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("jooble: status %d", resp.StatusCode)
	}

	var jr JoobleResp
	if err := json.NewDecoder(resp.Body).Decode(&jr); err != nil {
		return nil, fmt.Errorf("failed to decode Jooble response: %w", err)
	}

	var jobs []storage.JobRow
	for _, j := range jr.Jobs {
		// Parse salary if available
		salaryMin, salaryMax := parseJoobleSalary(j.Salary)

		// Convert HTML snippet to plain text using utility function
		description, _ := utils.PreprocessText(j.Snippet, 0)

		// Parse updated time
		publishedAt := ""
		if j.Updated != "" {
			if parsed, err := time.Parse(time.RFC3339, j.Updated); err == nil {
				publishedAt = parsed.Format(time.RFC3339)
			} else {
				// Try alternative time formats if RFC3339 fails
				publishedAt = j.Updated
			}
		}

		// Convert ID to string safely
		jobID := "jooble-" + j.ID.String()

		// Validate that we have a valid ID
		if jobID == "jooble-" {
			// Skip jobs with empty IDs
			continue
		}

		jobs = append(jobs, storage.JobRow{
			ID:          jobID,
			Source:      "jooble",
			Title:       j.Title,
			Company:     j.Company,
			Description: description,
			Location:    j.Location,
			WorkType:    "", // Jooble doesn't provide work type in basic response
			URL:         j.Link,
			PublishedAt: publishedAt,
			SalaryMin:   salaryMin,
			SalaryMax:   salaryMax,
		})
	}
	return jobs, nil
}

// parseJoobleSalary parses salary string like "50k-80k USD" or "100k USD" to min/max integers
func parseJoobleSalary(salaryStr string) (minSal, maxSal int) {
	if salaryStr == "" {
		return 0, 0
	}

	// Remove currency and common suffixes
	salaryStr = strings.ToUpper(salaryStr)
	salaryStr = strings.ReplaceAll(salaryStr, "USD", "")
	salaryStr = strings.ReplaceAll(salaryStr, "EUR", "")
	salaryStr = strings.ReplaceAll(salaryStr, "GBP", "")
	salaryStr = strings.TrimSpace(salaryStr)

	// Handle ranges like "50k-80k"
	if strings.Contains(salaryStr, "-") {
		parts := strings.Split(salaryStr, "-")
		if len(parts) == 2 {
			minSal = parseSalaryAmount(parts[0])
			maxSal = parseSalaryAmount(parts[1])
		}
	} else {
		// Single amount like "100k"
		amount := parseSalaryAmount(salaryStr)
		minSal = amount
		maxSal = amount
	}

	return minSal, maxSal
}

// parseSalaryAmount parses individual salary amounts like "50k", "100k", "1.5m"
func parseSalaryAmount(amountStr string) int {
	amountStr = strings.TrimSpace(amountStr)
	amountStr = strings.ToLower(amountStr)

	var multiplier int
	if strings.HasSuffix(amountStr, "k") {
		multiplier = 1000
		amountStr = strings.TrimSuffix(amountStr, "k")
	} else if strings.HasSuffix(amountStr, "m") {
		multiplier = 1000000
		amountStr = strings.TrimSuffix(amountStr, "m")
	} else {
		multiplier = 1
	}

	if amount, err := strconv.ParseFloat(amountStr, 64); err == nil {
		return int(amount * float64(multiplier))
	}

	return 0
}
