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

| Variable             | Required | Default | Description                |
| -------------------- | -------- | ------- | -------------------------- |
| `DB_DSN`             | Yes      | -       | Database connection string |
| `EMBEDDER_URL`       | Yes      | -       | Embedder service URL       |
| `SKILLS_FILE`        | Yes      | -       | Path to skills YAML file   |
| `ADZUNA_APP_ID`      | No       | -       | Adzuna API application ID  |
| `ADZUNA_APP_KEY`     | No       | -       | Adzuna API application key |
| `JOOBLE_API_KEY`     | No       | -       | Jooble API key             |
| `JOOBLE_CONCURRENCY` | No       | 3       | Jooble concurrent requests |
| `JOOBLE_TIMEOUT`     | No       | 5m      | Jooble request timeout     |
| `PORT`               | No       | 8080    | HTTP server port           |
| `FETCH_TIMEOUT`      | No       | 5m      | Fetch operation timeout    |
| `ENV`                | No       | -       | Environment name           |

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

## More Info

- See the main repo `README.md` and `.github/copilot-instructions.md` for full architecture and integration details
