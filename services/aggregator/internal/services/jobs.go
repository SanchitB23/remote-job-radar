package services

import (
	"context"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/config"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/fetch"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type JobService struct {
	store    *storage.Store
	skillVec []float32
	timeout  time.Duration
	config   *config.Config
}

func NewJobService(store *storage.Store, skillVec []float32, timeout time.Duration, cfg *config.Config) *JobService {
	return &JobService{
		store:    store,
		skillVec: skillVec,
		timeout:  timeout,
		config:   cfg,
	}
}

// fetchFromSources fetches jobs from specified sources, or all if sources is nil/empty
func (j *JobService) fetchFromSources(ctx context.Context, sources []string, jobCount int) ([]storage.JobRow, error) {
	var allJobs []storage.JobRow

	// Create a map for quick source lookup
	sourceMap := make(map[string]bool)
	fetchAll := len(sources) == 0
	for _, source := range sources {
		sourceMap[strings.ToLower(source)] = true
	}

	// Fetch jobs from Remotive if requested or if fetching all
	if fetchAll || sourceMap["remotive"] {
		logger.Info("Fetching jobs from Remotive API", zap.Int("jobCount", jobCount))
		remotiveJobs, err := fetch.Remotive(j.config.RemotiveBaseURL, jobCount)
		if err != nil {
			logger.Error("Remotive fetch error", zap.Error(err))
			// Don't return here - continue with other sources
		} else {
			logger.Info("Retrieved jobs from Remotive", zap.Int("count", len(remotiveJobs)))
			allJobs = append(allJobs, remotiveJobs...)
		}
	}

	// Fetch jobs from Adzuna if configured and requested
	if j.config.IsAdzunaEnabled() && (fetchAll || sourceMap["adzuna"]) {
		adzunaJobs, err := j.fetchFromAdzuna(ctx, jobCount)
		if err != nil {
			logger.Error("Adzuna fetch failed", zap.Error(err))
			// Continue with other sources
		} else {
			logger.Info("Retrieved jobs from Adzuna", zap.Int("count", len(adzunaJobs)))
			allJobs = append(allJobs, adzunaJobs...)
		}
	} else if !j.config.IsAdzunaEnabled() && (fetchAll || sourceMap["adzuna"]) {
		logger.Info("Adzuna API not configured, skipping")
	}

	// Fetch jobs from Jooble if configured and requested
	if j.config.IsJoobleEnabled() && (fetchAll || sourceMap["jooble"]) {
		logger.Info("Fetching jobs from Jooble API", zap.Int("jobCount", jobCount))
		joobleJobs, err := j.fetchFromJooble(ctx, jobCount)
		if err != nil {
			logger.Error("Jooble fetch error", zap.Error(err))
			// Continue with other sources
		} else {
			logger.Info("Retrieved jobs from Jooble", zap.Int("count", len(joobleJobs)))
			allJobs = append(allJobs, joobleJobs...)
		}
	} else if !j.config.IsJoobleEnabled() && (fetchAll || sourceMap["jooble"]) {
		logger.Info("Jooble API not configured, skipping")
	}

	// Fetch jobs from RemoteOK if requested or if fetching all
	if fetchAll || sourceMap["remoteok"] {
		logger.Info("Fetching jobs from RemoteOK API", zap.Int("jobCount", jobCount))
		remoteokJobs, err := fetch.RemoteOK("", jobCount) // Empty baseURL will use default
		if err != nil {
			logger.Error("RemoteOK fetch error", zap.Error(err))
			// Don't return here - continue with other sources
		} else {
			logger.Info("Retrieved jobs from RemoteOK", zap.Int("count", len(remoteokJobs)))
			allJobs = append(allJobs, remoteokJobs...)
		}
	}

	// Fetch jobs from WWR if requested or if fetching all
	if fetchAll || sourceMap["wwr"] {
		logger.Info("Fetching jobs from WWR API", zap.Int("jobCount", jobCount))
		wwrJobs, err := fetch.WWR("", jobCount) // Empty baseURL will use default
		if err != nil {
			logger.Error("WWR fetch error", zap.Error(err))
			// Don't return here - continue with other sources
		} else {
			logger.Info("Retrieved jobs from WWR", zap.Int("count", len(wwrJobs)))
			allJobs = append(allJobs, wwrJobs...)
		}
	}

	return allJobs, nil
}

// fetchFromAdzuna fetches jobs from Adzuna API with pagination
func (j *JobService) fetchFromAdzuna(ctx context.Context, jobCount int) ([]storage.JobRow, error) {
	logger.Info("Fetching jobs from Adzuna API", zap.Int("jobCount", jobCount))
	var allAdzunaJobs []storage.JobRow

	// Calculate how many pages we need to fetch based on jobCount
	maxPages := j.config.FetcherMaxPageNum
	if jobCount > 0 {
		// Calculate pages needed: jobCount / 50 (results per page) + 1 for remainder
		calculatedPages := (jobCount + 49) / 50 // Ceiling division
		if calculatedPages < maxPages {
			maxPages = calculatedPages
		}
		logger.Info("Calculated pages needed for job count",
			zap.Int("jobCount", jobCount),
			zap.Int("pagesNeeded", calculatedPages),
			zap.Int("maxPages", maxPages))
	}

	// Fetch multiple pages from Adzuna (since it's paginated)
	for page := 1; page <= maxPages; page++ {
		select {
		case <-ctx.Done():
			logger.Warn("Adzuna fetch interrupted by context cancellation",
				zap.Int("page", page),
				zap.Int("jobsFetched", len(allAdzunaJobs)))
			return allAdzunaJobs, ctx.Err()
		default:
		}

		// Create a timeout for individual page fetch
		pageCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		adzunaJobs, err := fetch.Adzuna(pageCtx, page, j.config.AdzunaAppID, j.config.AdzunaAppKey, j.config.AdzunaBaseURL, jobCount)
		cancel()

		if err != nil {
			logger.Error("Adzuna fetch error", zap.Error(err), zap.Int("page", page))
			// Continue with what we have if we got some results
			if len(allAdzunaJobs) > 0 {
				logger.Info("Continuing with partial Adzuna results", zap.Int("count", len(allAdzunaJobs)))
				break
			}
			return nil, err
		}

		logger.Info("Retrieved jobs from Adzuna",
			zap.Int("count", len(adzunaJobs)),
			zap.Int("page", page))
		allAdzunaJobs = append(allAdzunaJobs, adzunaJobs...)

		// Break early if we get fewer results than expected (last page)
		// or if we've reached the job count limit
		if len(adzunaJobs) < 50 || (jobCount > 0 && len(allAdzunaJobs) >= jobCount) {
			break
		}
	}

	// Limit the total jobs if jobCount is specified
	if jobCount > 0 && len(allAdzunaJobs) > jobCount {
		allAdzunaJobs = allAdzunaJobs[:jobCount]
	}

	logger.Info("Total jobs fetched from Adzuna", zap.Int("count", len(allAdzunaJobs)))
	return allAdzunaJobs, nil
}

// getAdaptiveSearchStrategy adjusts search strategy based on job count and time constraints
func (j *JobService) getAdaptiveSearchStrategy(jobCount int) (int, []struct {
	keyword  string
	location string
	weight   int
}) {
	// Get base queries
	baseQueries := j.getOptimizedSearchQueries()

	// Adaptive strategy based on job count
	if jobCount > 0 {
		if jobCount <= 50 {
			// Small job count: focus on high-priority queries only
			return 1, baseQueries[:3] // Top 3 queries
		} else if jobCount <= 200 {
			// Medium job count: use moderate number of queries
			return 2, baseQueries[:6] // Top 6 queries
		}
		// Large job count: use all queries
		return j.config.JoobleConcurrency, baseQueries
	}

	// No job count limit: use all queries with full concurrency
	return j.config.JoobleConcurrency, baseQueries
}

// getOptimizedSearchQueries returns weighted search queries for optimal job discovery
func (j *JobService) getOptimizedSearchQueries() []struct {
	keyword  string
	location string
	weight   int
} {
	// Base search queries with weights (higher weight = search first)
	baseQueries := []struct {
		keyword  string
		location string
		weight   int
	}{
		{"*", "remote", 10}, // Most general, highest priority
		{"engineer", "remote", 9},
		{"developer", "remote", 9},
		{"software", "remote", 8},
		{"*", "india", 7},
		{"engineer", "india", 6},
		{"developer", "india", 6},
		{"*", "united states", 5},
		{"*", "europe", 4},
	}

	// Sort by weight (highest first)
	sort.Slice(baseQueries, func(i, j int) bool {
		return baseQueries[i].weight > baseQueries[j].weight
	})

	return baseQueries
}

// fetchFromJooble fetches jobs from Jooble API with pagination & multiple keywords/locations
func (j *JobService) fetchFromJooble(ctx context.Context, jobCount int) ([]storage.JobRow, error) {
	logger.Info("Fetching jobs from Jooble API", zap.Int("jobCount", jobCount))

	// Pre-allocate slice with estimated capacity to reduce memory allocations
	estimatedCapacity := jobCount
	if estimatedCapacity == 0 {
		estimatedCapacity = j.config.FetcherMaxPageNum * 50 * 4 // maxPages * pageSize * keyword/location combinations
	}
	allJoobleJobs := make([]storage.JobRow, 0, estimatedCapacity)

	// Use sync.Map for thread-safe deduplication with better memory efficiency
	seen := make(map[string]struct{}, estimatedCapacity)

	// Get adaptive search strategy based on job count
	concurrency, searchQueries := j.getAdaptiveSearchStrategy(jobCount)
	logger.Info("Using adaptive search strategy",
		zap.Int("concurrency", concurrency),
		zap.Int("searchQueries", len(searchQueries)),
		zap.Int("jobCount", jobCount),
		zap.Int("maxPages", j.config.FetcherMaxPageNum))

	// Calculate optimal max pages based on jobCount - distribute across queries
	maxPages := j.config.FetcherMaxPageNum
	if jobCount > 0 {
		// Calculate total pages needed across all queries
		totalPagesNeeded := (jobCount + 49) / 50 // Ceiling division
		// Distribute pages across queries, but ensure each query gets at least 1 page
		pagesPerQuery := totalPagesNeeded / len(searchQueries)
		if pagesPerQuery < 1 {
			pagesPerQuery = 1
		}
		if pagesPerQuery < maxPages {
			maxPages = pagesPerQuery
		}
		logger.Info("Calculated pages distribution",
			zap.Int("jobCount", jobCount),
			zap.Int("totalPagesNeeded", totalPagesNeeded),
			zap.Int("searchQueries", len(searchQueries)),
			zap.Int("pagesPerQuery", pagesPerQuery),
			zap.Int("maxPages", maxPages))
	}

	// Use buffered channel for concurrent fetching with adaptive concurrency
	semaphore := make(chan struct{}, concurrency)

	// Create a context with timeout for the entire operation
	operationCtx, cancel := context.WithTimeout(ctx, j.config.JoobleTimeout)
	defer cancel()

	// Use errgroup for better error handling and cancellation
	g, gCtx := errgroup.WithContext(operationCtx)

	// Track successful fetches for early termination
	var totalFetched int32
	var mu sync.Mutex

	for _, query := range searchQueries {
		// Early termination if we have enough jobs
		if jobCount > 0 && atomic.LoadInt32(&totalFetched) >= int32(jobCount) {
			break
		}

		query := query // Capture for goroutine
		g.Go(func() error {
			return j.fetchJoobleQuery(gCtx, query.keyword, query.location, maxPages, jobCount,
				&allJoobleJobs, seen, &totalFetched, &mu, semaphore)
		})
	}

	// Wait for all goroutines to complete
	if err := g.Wait(); err != nil {
		logger.Warn("Some Jooble queries failed", zap.Error(err))
		// Continue with partial results
	}

	// Trim if overshot
	if jobCount > 0 && len(allJoobleJobs) > jobCount {
		allJoobleJobs = allJoobleJobs[:jobCount]
	}

	logger.Info("Total jobs fetched from Jooble",
		zap.Int("count", len(allJoobleJobs)),
		zap.Int("uniqueJobs", len(seen)))

	return allJoobleJobs, nil
}

// fetchJoobleQuery handles fetching for a single keyword/location combination
func (j *JobService) fetchJoobleQuery(ctx context.Context, keyword, location string, maxPages, jobCount int,
	allJobs *[]storage.JobRow, seen map[string]struct{}, totalFetched *int32, mu *sync.Mutex, semaphore chan struct{}) error {

	// Acquire semaphore to limit concurrency
	select {
	case semaphore <- struct{}{}:
		defer func() { <-semaphore }()
	case <-ctx.Done():
		return ctx.Err()
	}

	logger.Info("Fetching Jooble jobs",
		zap.String("keyword", keyword),
		zap.String("location", location))

	var queryJobs []storage.JobRow
	seenLocal := make(map[string]struct{}) // Local deduplication for this query

	for page := 1; page <= maxPages; page++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		// Check if we've already reached the global job count limit
		if jobCount > 0 && atomic.LoadInt32(totalFetched) >= int32(jobCount) {
			break
		}

		// Per-page timeout with exponential backoff for retries
		pageCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		joobleJobs, err := fetch.Jooble(pageCtx, page, j.config.JoobleAPIKey, keyword, location, jobCount)
		cancel()

		if err != nil {
			logger.Error("Jooble fetch error",
				zap.Error(err),
				zap.String("keyword", keyword),
				zap.String("location", location),
				zap.Int("page", page))

			// Implement exponential backoff for transient errors
			if isRetryableError(err) && page < maxPages {
				backoff := time.Duration(page) * time.Second
				logger.Info("Retrying after backoff", zap.Duration("backoff", backoff))
				time.Sleep(backoff)
				continue
			}
			break
		}

		logger.Debug("Retrieved jobs from Jooble",
			zap.Int("count", len(joobleJobs)),
			zap.String("keyword", keyword),
			zap.String("location", location),
			zap.Int("page", page))

		// Local deduplication
		for _, job := range joobleJobs {
			if _, exists := seenLocal[job.ID]; exists {
				continue
			}
			seenLocal[job.ID] = struct{}{}
			queryJobs = append(queryJobs, job)
		}

		// Stop if no more results or if we have enough jobs locally
		if len(joobleJobs) < 50 {
			break
		}

		// Check again if we've reached the job count limit after processing this page
		if jobCount > 0 && atomic.LoadInt32(totalFetched) >= int32(jobCount) {
			break
		}
	}

	// Merge results with thread-safe access and early termination
	if len(queryJobs) > 0 {
		mu.Lock()
		for _, job := range queryJobs {
			// Check if we've reached the job count limit before adding more jobs
			if jobCount > 0 && atomic.LoadInt32(totalFetched) >= int32(jobCount) {
				break
			}
			if _, exists := seen[job.ID]; !exists {
				seen[job.ID] = struct{}{}
				*allJobs = append(*allJobs, job)
				atomic.AddInt32(totalFetched, 1)
			}
		}
		mu.Unlock()
	}

	return nil
}

// isRetryableError determines if an error should trigger a retry
func isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	errStr := err.Error()
	// Retry on network timeouts, rate limits, and temporary server errors
	retryablePatterns := []string{
		"timeout", "deadline exceeded", "rate limit", "429", "503", "502", "500",
		"connection refused", "network is unreachable",
	}

	for _, pattern := range retryablePatterns {
		if strings.Contains(strings.ToLower(errStr), pattern) {
			return true
		}
	}
	return false
}

func (j *JobService) FetchAndProcessJobs(ctx context.Context) error {
	return j.FetchAndProcessJobsFromSources(ctx, nil, 0)
}

func (j *JobService) FetchAndProcessJobsFromSources(ctx context.Context, sources []string, jobCount int) error {
	startTime := time.Now()
	if len(sources) > 0 {
		logger.Info("Starting job fetch operation from specific sources", zap.Strings("sources", sources))
	} else {
		logger.Info("Starting job fetch operation from all sources")
	}

	if jobCount > 0 {
		logger.Info("Job count limit specified", zap.Int("jobCount", jobCount))
	} else {
		logger.Info("No job count limit specified, fetching all available jobs")
	}

	// Create context with timeout
	fetchCtx, cancel := context.WithTimeout(ctx, j.timeout)
	defer cancel()

	// Fetch jobs from specified sources (or all if sources is nil)
	allJobs, err := j.fetchFromSources(fetchCtx, sources, jobCount)
	if err != nil {
		logger.Error("Error fetching from sources", zap.Error(err))
		return err
	}

	if len(allJobs) == 0 {
		if len(sources) > 0 {
			logger.Warn("No jobs fetched from specified sources", zap.Strings("sources", sources))
		} else {
			logger.Warn("No jobs fetched from any source")
		}
		return nil
	}

	// Store all jobs in database
	logger.Info("Upserting jobs to database", zap.Int("totalJobs", len(allJobs)))

	// Create a separate context for database operations to avoid cancellation
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer dbCancel()

	if err = j.store.UpsertJobs(dbCtx, allJobs); err != nil {
		logger.Error("Database error", zap.Error(err))
		return err
	}

	duration := time.Since(startTime)
	if len(sources) > 0 {
		logger.Info("Successfully upserted jobs from specified sources",
			zap.Strings("sources", sources),
			zap.Int("count", len(allJobs)),
			zap.Duration("duration", duration))
	} else {
		logger.Info("Successfully upserted jobs from all sources",
			zap.Int("count", len(allJobs)),
			zap.Duration("duration", duration))
	}

	// Score new jobs immediately after fetching
	logger.Info("Scoring newly fetched jobs")

	// For large batches, use a very long timeout or no timeout for background processing
	// Create a separate context for scoring operations with no timeout for background jobs
	scoreCtx := context.Background()

	if err := j.ScoreNewJobs(scoreCtx); err != nil {
		logger.Error("Scoring error", zap.Error(err))
		return err
	}

	return nil
}

func (j *JobService) ScoreNewJobs(ctx context.Context) error {
	scoringStartTime := time.Now()
	logger.Info("Starting job scoring operation")

	if err := scorer.ScoreNewRows(ctx, j.store, j.skillVec, j.config); err != nil {
		logger.Error("Scoring error", zap.Error(err))
		return err
	}

	logger.Info("Scoring completed",
		zap.Duration("duration", time.Since(scoringStartTime)))
	return nil
}
