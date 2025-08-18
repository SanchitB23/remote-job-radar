# Remote Job Radar – Infra

This directory contains infrastructure configuration for local development and testing of the Remote Job Radar platform.

## Overview

- **Purpose:** Provides Docker Compose setup for running required services locally
- **Services:**
  - PostgreSQL (with pgvector extension)
  - Embedder (Python FastAPI ML service)
  - (Optionally) other dependencies as needed

## Files

- `docker-compose.yml` – Main Docker Compose file for spinning up infrastructure services

## Usage

### 1. Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Docker Compose](https://docs.docker.com/compose/) (if not included with Docker)

### 2. Start Infrastructure

From the project root or `infra/` directory, run:

```bash
docker compose -f infra/docker-compose.yml up -d
```

This will start the database and embedder services in the background.

### 3. Stop Infrastructure

```bash
docker compose -f infra/docker-compose.yml down
```

### 4. Check Service Status

```bash
docker compose -f infra/docker-compose.yml ps
```

### 5. Database Access

- The PostgreSQL service is exposed for local connections (see `docker-compose.yml` for port and credentials)
- Use `psql` or a GUI client to connect

### 6. Embedder Service

- The embedder service is available at the port specified in `docker-compose.yml` (default: 8000)
- Used by the aggregator for generating embeddings

## Notes

- The infra stack is intended for local development only
- For production, use managed services or production-grade infrastructure
- Update `docker-compose.yml` to add or modify services as needed

## More Info

- See the main repo `README.md` and `.github/copilot-instructions.md` for full architecture and integration details
