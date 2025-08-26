# Remote Job Radar – Aggregator Service

This is the **Go microservice** responsible for fetching, deduplicating, and scoring jobs for Remote Job Radar.

## Overview

- **Language:** Go
- **Responsibilities:**
  - Fetch jobs from multiple sources (Remotive, Adzuna, etc.)
  - Deduplicate and upsert jobs into the database
  - Call the embedder service for vector embeddings
  - Score jobs using vector similarity (pgvector)
  - Expose endpoints for manual fetch and health checks
- **Integration:**
  - Connects directly to PostgreSQL (not via Prisma)
  - Calls Python embedder service via HTTP
  - Reads user skills from `skills.yml`

## Directory Structure

- `cmd/serve/` – Application entry point (`main.go`)
- `internal/app/` – App setup and dependency injection
- `internal/config/` – Configuration management
- `internal/handlers/` – HTTP handlers and routes
- `internal/services/` – Business logic (job fetching, skills)
- `internal/fetch/` – External API clients (Remotive, Adzuna, etc.)
- `internal/scorer/` – Embedding and scoring logic
- `internal/storage/` – Database operations
- `internal/logger/` – Logging
- `skills.yml` – User skills configuration

## Environment Variables

| Variable                 | Required | Default                 | Description                     |
| ------------------------ | -------- | ----------------------- | ------------------------------- |
| `PG_DATABASE_URL`        | Yes      | -                       | PostgreSQL connection           |
| `EMBEDDER_BASE_URL`      | Yes      | -                       | Python embedder service         |
| `WEB_APP_BASE_URL`       | No       | `http://localhost:3000` | Web app URL for embedder warmup |
| `SKILLS_FILE`            | Yes      | -                       | Path to skills YAML file        |
| `MANUAL_JOB_FETCH_TOKEN` | Yes      | -                       | Security token for manual fetch |
| `REMOTIVE_BASE_URL`      | No       | -                       | Remotive API base URL           |
| `ADZUNA_APP_ID`          | No       | -                       | Adzuna API application ID       |
| `ADZUNA_APP_KEY`         | No       | -                       | Adzuna API application key      |
| `JOOBLE_API_KEY`         | No       | -                       | Jooble API key                  |
| `JOOBLE_CONCURRENCY`     | No       | 3                       | Jooble concurrent requests      |
| `JOOBLE_TIMEOUT`         | No       | 5m                      | Jooble request timeout          |
| `PORT`                   | No       | 8080                    | HTTP server port                |
| `FETCH_TIMEOUT`          | No       | 5m                      | Fetch operation timeout         |
| `ENV`                    | No       | -                       | Environment name                |

## Development Commands

```bash
# Development (with hot reload)
npm run dev

# Build the binary
npm run build

# Run the built binary
npm run start
```

## API Endpoints

### Manual Fetch

- **POST /fetch** – Trigger job fetching from one or more sources
  - Query param: `sources` (comma-separated, e.g. `remotive,adzuna`)
  - If not provided, fetches from all configured sources

### Health Check

- **GET /health** – Service health status

## Adding a New Job Source

1. Implement a fetcher in `internal/fetch/`
2. Register it in `cmd/serve/main.go`
3. Map fields to DB schema in `internal/services/jobs.go`
4. Add config in environment files

## Key Features

- **Concurrent job fetching and scoring**
- **Robust error handling and logging**
- **Configurable batch sizes and timeouts**
- **Extensible for new job sources**
- **Graceful shutdown and on-demand fetching**
- **Embedder cold start protection**: Automatically warms up the embedder service via the web app health endpoint to prevent cold start failures

## Embedder Cold Start Solution

In production environments, the embedder service may spin down after periods of inactivity, causing cold start delays and potential failures when the aggregator tries to make embedding calls. To address this:

1. **Automatic Warmup**: Before making embedding calls, the aggregator automatically calls the web app's `/api/health/embedder` endpoint
2. **Graceful Fallback**: If the warmup fails, the aggregator continues with direct embedder calls (backward compatibility)
3. **One-time Warmup**: Each embedder instance only performs warmup once per session
4. **Configuration**: Set `WEB_APP_BASE_URL` to enable this feature (optional)

## More Info

- See the main repo `README.md` and `.github/copilot-instructions.md` for full architecture and integration details
