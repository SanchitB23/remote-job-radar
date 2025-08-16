# Remote Job Radar - AI Agent Instructions

## Architecture Overview

Remote Job Radar is a **Turbo monorepo** for AI-powered job discovery, using a microservices architecture:

- **`apps/web/`**: Next.js 15 frontend (App Router, TanStack Query, Clerk auth)
- **`apps/api/`**: GraphQL API (Apollo Server, Prisma, PostgreSQL)
- **`services/aggregator/`**: Go service for job fetching, deduplication, and fit scoring
- **`services/embedder/`**: Python FastAPI for ML embeddings (SentenceTransformers)
- **PostgreSQL + pgvector**: Vector similarity search for job matching

## Data Flow & Integration Points

**End-to-end flow:**

1. **Aggregator** fetches jobs from sources (Remotive, etc.) every 2h, deduplicates, and stores in DB
2. **Embedder** (Python) generates vector embeddings for jobs and user skills (via `/embed` endpoint)
3. **Aggregator** scores jobs using vector similarity (pgvector)
4. **API** exposes jobs, bookmarks, and pipeline via GraphQL (real-time via subscriptions)
5. **Web** app consumes both GraphQL and REST endpoints for UI, using TanStack Query for state

**Key integration patterns:**

- **Go <-> Python**: Aggregator calls embedder via HTTP for vectorization
- **Go <-> Postgres**: Direct SQL (not Prisma) for job upserts and scoring
- **API <-> DB**: Prisma ORM, schema in `apps/api/prisma/schema.prisma`
- **Web <-> API**: GraphQL for complex queries, Next.js API routes for simple REST
- **Web <-> Aggregator**: Health checks, not direct job fetch

## ML Pipeline Details

- **Model**: SentenceTransformers (e.g., `BAAI/bge-small-en-v1.5`)
- **Service**: `/services/embedder/main.py` exposes `/embed` and `/health` endpoints
- **Skills config**: `services/aggregator/skills.yml` (edit to change user profile)
- **Scoring**: Go service computes fit score as vector similarity between user skills and job description

## Database Patterns

- **Schema**: Defined in `apps/api/prisma/schema.prisma`
- **Key tables**: `jobs` (with vector), `bookmarks`, `PipelineItem` (Kanban)
- **Vector search**: Uses `pgvector` for semantic job matching
- **Migrations**: `npx prisma migrate dev` (run in `apps/api`)

## Deployment & Local Dev

- **Start all services**: `npm run dev:all` (runs DB, embedder, API, web, aggregator)
- **Infra only**: `npm run dev:infra` (DB + embedder)
- **Health check**: `npm run dev:smokeTest`
- **Docker Compose**: See `infra/docker-compose.yml` for DB/embedder
- **Environment**: Copy `.env.example` to `.env.local` in each app/service

## State Management & UI Patterns

- **TanStack Query**: Used for all data fetching/mutations in web app
- **Infinite scroll**: `useInfiniteJobs` hook for paginated job lists
- **Optimistic updates**: Bookmarks and pipeline use optimistic mutation patterns
- **WebSocket subscriptions**: Real-time job alerts via GraphQL subscriptions (see `components/jobAlertToast.tsx`)

## Example Patterns

**Add a new job source (Go):**

1. Implement fetcher in `services/aggregator/internal/fetch/`
2. Register in `cmd/serve/main.go`
3. Map fields to DB schema

**Extend GraphQL schema:**

1. Edit `apps/api/src/schema.graphql` and `resolvers/`
2. Update Prisma schema if DB changes needed
3. Run `npx prisma migrate dev` and regenerate client

**Add a new UI feature:**

1. Create component in `apps/web/components/`
2. Use TanStack Query hooks for data
3. Add API route or GraphQL resolver as needed

## Testing & Debugging

- **API test**: `curl -X POST http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{"query":"{ jobs(first:3){ id title fitScore } }"}'`
- **Aggregator health**: `curl http://localhost:8080/health`
- **Check DB**: `docker exec -it remote-job-radar-db-1 psql -U postgres -c "SELECT COUNT(*) FROM jobs;"`
- **Prisma Studio**: `npx prisma studio` (in `apps/api`)

## Project Conventions & Gotchas

- **Imports**: Use `@/` alias for `apps/web/` paths
- **Types**: Centralized in `apps/web/types/gql.d.ts`
- **Clerk JWT**: All API calls require Clerk JWT context (`getToken({ template: "remote-job-radar" })`)
- **Skills**: Edit `skills.yml` before first run for meaningful fit scores
- **Turbo**: Use `turbo dev` for monorepo caching; avoid per-app `npm run dev`
- **Go service**: Connects directly to DB, not via Prisma
- **Embeddings**: Jobs must be embedded before fit scoring works

---

For more, see `README.md` in root and `apps/web/README.md` for environment and deployment details.
