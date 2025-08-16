# Aggregator Service Debug Report

## Issues Identified

### 1. **Context Cancellation (Primary Issue)**
**Problem**: The `TriggerFetch` handler was using the HTTP request context (`r.Context()`) for background job processing. This context gets canceled immediately when the HTTP response is sent, causing all subsequent operations to fail with "context canceled" errors.

**Affected Operations**:
- Adzuna API calls
- Database upsert operations  
- Job scoring operations

**Fix Applied**: 
- Changed background goroutine to use `context.Background()` instead of `r.Context()`
- Added separate timeouts for database and scoring operations

### 2. **Insufficient Timeout**
**Problem**: Default `FETCH_TIMEOUT` was set to 30 seconds, which is too short for:
- Multiple API calls (Remotive + Adzuna pagination with up to 10 pages)
- Database operations with 1000+ jobs
- Embedding generation and scoring

**Fix Applied**:
- Increased default timeout from 30s to 5 minutes
- Updated `.env.example` to reflect better default

### 3. **Database Connection Handling**
**Problem**: Database connections were being forcefully closed during context cancellation, leading to "broken pipe" errors.

**Fixes Applied**:
- Added graceful database cleanup with timeout
- Added connection health check before closing
- Implemented batch processing for large job sets (100 jobs per batch)
- Added context checking within batch loops to prevent hanging

### 4. **Error Handling Improvements**
**Problems**: 
- Single API failure could abort entire operation
- No resilience for partial data

**Fixes Applied**:
- Better error handling for Adzuna pagination (continue with partial results)
- Individual page timeouts (30s per page)
- Batch processing with progress logging

## Changes Made

### 1. `/internal/handlers/handlers.go`
```go
// Before: Used r.Context() which gets canceled
go func() {
    if err := h.jobService.FetchAndProcessJobs(r.Context()); err != nil {
        
// After: Use context.Background() for background operations  
go func() {
    ctx := context.Background()
    if err := h.jobService.FetchAndProcessJobs(ctx); err != nil {
```

### 2. `/internal/config/config.go`
```go
// Before: 30 second timeout
FetchTimeout: getDurationWithDefault("FETCH_TIMEOUT", 30*time.Second),

// After: 5 minute timeout
FetchTimeout: getDurationWithDefault("FETCH_TIMEOUT", 5*time.Minute),
```

### 3. `/internal/services/jobs.go`
- Added separate contexts for database and scoring operations
- Enhanced Adzuna error handling with per-page timeouts
- Better logging for debugging

### 4. `/internal/storage/db.go`
- Added batch processing (100 jobs per batch)
- Added context cancellation checks within loops
- Enhanced logging for batch progress

### 5. `/internal/app/app.go`
- Added graceful database cleanup with timeout
- Added connection health check before closing

## Expected Behavior After Fixes

1. **Manual fetch triggers** will no longer fail due to context cancellation
2. **Adzuna API calls** will have individual timeouts and better error recovery
3. **Database operations** will process in smaller batches with progress logging
4. **Large job sets** (1000+ jobs) will be handled efficiently
5. **Service shutdown** will be graceful without connection errors

## Testing Recommendations

1. **Test manual fetch endpoint**:
   ```bash
   curl -X POST http://localhost:8001/fetch
   ```

2. **Monitor logs** for batch processing progress and timeout behavior

3. **Test with large datasets** to verify batch processing works correctly

4. **Test graceful shutdown** with SIGTERM to verify cleanup

## Configuration Updates

Update your `.env.local` if needed:
```bash
# Increase timeout for large operations
FETCH_TIMEOUT=5m

# Reduce max pages if Adzuna is timing out
FETCHER_MAX_PAGE_NUM=5
```

## Root Cause Summary

The primary issue was architectural: using an HTTP request context for long-running background operations. HTTP contexts are designed to be canceled when the client disconnects or the response is sent. This created a cascade of failures throughout the job fetching pipeline.

The fix separates concerns by using appropriate contexts for different operations:
- HTTP request context for immediate response
- Background context for long-running operations  
- Timeout contexts for external API calls
- Database contexts with appropriate timeouts
