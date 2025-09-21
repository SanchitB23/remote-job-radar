# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Remote Job Radar is a **Turbo monorepo** for AI-powered job discovery, built as a microservices architecture that combines Next.js, GraphQL, Go, Python, and PostgreSQL with vector search capabilities.

## Architecture & Data Flow

### High-Level Service Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │  GraphQL API    │    │    Go Service   │
│   (Port 3000)   │◄──►│   (Port 4000)   │◄──►│   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                        ▲
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │ Python Embedder │
                       │  + pgvector     │    │   (Port 8000)   │
                       │   (Port 5432)   │    └─────────────────┘
                       └─────────────────┘
```

**Critical Data Flow Pattern:**

1. **Go Aggregator** fetches jobs → calls **Python Embedder** for vectors → stores in **PostgreSQL**
2. **GraphQL API** serves data via Prisma ORM → **Web App** consumes via TanStack Query
3. **Vector scoring** happens in Go service using pgvector, not in API layer
4. **Real-time updates** via GraphQL subscriptions for job alerts and pipeline changes

### Key Integration Points

- **Go ↔ Python**: HTTP calls for vectorization with retry logic (`/embed` endpoint)
- **Go ↔ Postgres**: Direct SQL connections (bypasses Prisma for performance)
- **API ↔ Postgres**: Prisma ORM for GraphQL resolvers
- **Web ↔ API**: GraphQL for complex queries + Next.js API routes for simple REST
- **Web ↔ Go**: Direct calls for health checks and manual job fetching

## Development Commands

### Starting Services

```bash
# Start all services (recommended)
npm run dev:all

# Start only infrastructure (DB + Python embedder)
npm run dev:infra

# Start individual services from root
npm run dev  # Uses turbo to start all dev scripts

# Health check all services
npm run dev:smokeTest
```

### Database Operations

```bash
# Run Prisma migrations (from apps/api/)
cd apps/api && npx prisma migrate dev

# Open Prisma Studio for DB inspection
cd apps/api && npx prisma studio

# Generate Prisma client after schema changes
cd apps/api && npx prisma generate

# Check database directly
docker exec -it remote-job-radar-db-1 psql -U postgres -c "SELECT COUNT(*) FROM jobs;"
```

### Build & Testing

```bash
# Build all services
npm run build

# Run linting across all services
npm run lint

# Run type checking
npm run typecheck

# Format code
npm run format

# Run tests
npm run test
```

### Service-Specific Commands

```bash
# Web app (from apps/web/)
npm run dev          # Start with Turbopack
npm run dev:clear    # Clear Next.js cache first
npm run typecheck    # TypeScript checking

# API (from apps/api/)
npm run dev          # Start with hot reload
npm run db:generate  # Regenerate Prisma client

# Go Aggregator (from services/aggregator/)
npm run dev          # Uses air for hot reload
npm run build        # Build binary
go mod tidy          # Clean dependencies

# Python Embedder (from services/embedder/)
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Understanding the Codebase

### Repository Structure (Clean Architecture)

```
apps/
├── web/                 # Next.js 15 frontend
│   ├── app/            # App Router pages (jobs/, kanban/, auth/)
│   ├── components/     # shadcn/ui components
│   ├── lib/           # GraphQL clients, utilities
│   └── services/      # API integration layer
│
├── api/                # GraphQL API server
│   ├── src/           # TypeScript resolvers
│   ├── prisma/        # Database schema & migrations
│   └── types/         # GraphQL type definitions
│
services/
├── aggregator/         # Go job fetching service (clean architecture)
│   ├── cmd/serve/     # Application entry point
│   └── internal/      # Clean architecture layers:
│       ├── app/       # DI container setup
│       ├── handlers/  # HTTP routes
│       ├── services/  # Business logic
│       ├── fetch/     # External API clients
│       ├── storage/   # Database operations
│       └── scorer/    # ML scoring logic
│
└── embedder/          # Python ML service
    ├── main.py        # FastAPI app
    └── requirements.txt
```

### Database Schema (Key Tables)

```sql
-- Jobs table with vector embeddings
jobs: id, source, title, company, description, vector (pgvector), fit_score

-- User pipeline management
pipeline_items: user_id, job_id, column (wishlist|applied|interview|offer), position

-- Bookmarking system
bookmarks: user_id, job_id

-- User skills with vector embeddings
user_profiles: user_id, skills[], skill_vector (pgvector)
```

### Technology Stack Deep Dive

**Frontend (apps/web):**

- Next.js 15 App Router with Turbopack
- shadcn/ui + Radix UI components + Heroicons
- TanStack Query for server state management
- @dnd-kit for kanban drag-and-drop
- Clerk authentication with JWT templates
- Real-time GraphQL subscriptions via WebSocket

**Backend API (apps/api):**

- Apollo Server 4 with GraphQL subscriptions
- Prisma ORM with PostgreSQL + pgvector
- JWT validation via Clerk
- Express.js with CORS and WebSocket support

**Job Aggregator (services/aggregator):**

- Go 1.24+ with Chi router
- Clean architecture with dependency injection
- Direct PostgreSQL connection (performance reasons)
- Concurrent job processing with worker pools
- External API integrations (Remotive, Adzuna, etc.)

**ML Service (services/embedder):**

- Python FastAPI with SentenceTransformers
- Model: BAAI/bge-small-en-v1.5 (configurable)
- Endpoints: `/embed` and `/health`

## Configuration & Environment Setup

### Git Configuration

**Repository Details:**

- **GitHub Owner**: `SanchitB23`
- **Repository**: `remote-job-radar`
- **Full path**: `SanchitB23/remote-job-radar`

**Important for MCP/API access:**
When accessing GitHub issues, PRs, or repository data, always use the correct owner `SanchitB23`.

### Critical Environment Files

Each service needs its own `.env` file:

```bash
# Root: .env.example (mostly empty, delegates to services)

# apps/web/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_JWT_KID="ins_..."
CLERK_JWT_ISSUER="https://your-app.clerk.accounts.dev"
GRAPHQL_BASE_URL="http://localhost:4000/graphql"
NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT="ws://localhost:4000/graphql"

# apps/api/.env
PG_DATABASE_URL="postgresql://postgres:local@localhost:5432/postgres"
CLERK_JWT_KID="ins_..."
CLERK_JWT_ISSUER="https://your-app.clerk.accounts.dev"

# services/aggregator/.env.local
PG_DATABASE_URL="host=localhost user=postgres password=local dbname=postgres sslmode=disable"
SKILLS_FILE="skills.yml"
EMBEDDER_URL="http://localhost:8000"
MANUAL_JOB_FETCH_TOKEN="your-secure-token"
```

### Skills Configuration

**Critical for ML functionality:**
Edit `services/aggregator/skills.yml` to match user skills:

```yaml
skills:
  - react
  - typescript
  - aws
  - golang
  - python
  - kubernetes
```

## Development Workflow Best Practices

### Commit Message Standards

**Strictly enforced via commitlint:**

```bash
# Format: <type>[optional scope]: <description>
feat(api): add job aggregation endpoint
fix(web): resolve pagination crash on mobile
docs: update deployment instructions
refactor(aggregator): extract job scoring logic
chore(deps): update Next.js to v15.4.5
```

**Available types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Available scopes:** `api`, `web`, `aggregator`, `embedder`, `pipeline`, `ui`, `db`

### Code Quality Standards

**TypeScript/JavaScript (Web + API):**

- Strict TypeScript with explicit return types
- ESLint + Prettier with auto-formatting
- simple-import-sort for organized imports
- `@/` path alias for `apps/web/` imports

**Go (Aggregator):**

- Clean architecture patterns with DI
- golangci-lint for code quality
- Structured logging with zap
- Graceful shutdown handling

**Python (Embedder):**

- FastAPI with type hints
- Error handling for ML model failures
- Structured JSON logging

### Testing & Debugging Commands

```bash
# Quick API health checks
curl http://localhost:4000/health                    # GraphQL API
curl http://localhost:8080/health                    # Go Aggregator
curl http://localhost:8000/health                    # Python Embedder
curl -I http://localhost:3000                        # Next.js Web

# GraphQL query test
curl -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ jobs(first:3){ id title fitScore } }"}'

# Manual job fetch
curl -X POST http://localhost:8080/api/fetch?source=remotive

# Database inspection
docker exec -it remote-job-radar-db-1 psql -U postgres -c "SELECT COUNT(*) FROM jobs;"
```

### Important Patterns & Gotchas

**Authentication:**

- All API calls require Clerk JWT with template: `getToken({ template: "remote-job-radar" })`
- JWT validation happens at GraphQL context level

**Data Flow:**

- Jobs must be embedded via Python service before fit scoring works
- Go service handles vector similarity calculations, not the API
- Pipeline positions are managed optimistically in the UI with TanStack Query

**Performance:**

- Use `turbo dev` for monorepo caching instead of individual `npm run dev`
- TanStack Query handles all client-side caching and optimistic updates
- Infinite scroll implemented via `useInfiniteJobs` hook

**Console Logging Pattern:**

```javascript
console.log("[ComponentName.tsx] [functionName] variableName:", value);
console.trace("[ComponentName.tsx] [functionName] error:", error);
```

**Development Server Notes:**

- Servers are usually already running - avoid starting/stopping unless requested
- Use health endpoints and `/status` page for service monitoring
- Embedder service has cold start protection via web app warmup

## Key Features to Understand

### Kanban Pipeline System

- Drag-and-drop with @dnd-kit
- Four columns: wishlist → applied → interview → offer
- Position-based ordering within columns
- Optimistic UI updates with error recovery

### AI-Powered Job Matching

- Vector embeddings generated by Python service
- Fit scores calculated using pgvector similarity
- Skills configurable via YAML file
- Semantic search capabilities

### Real-time Features

- GraphQL subscriptions for job alerts
- Pipeline updates via WebSocket
- Toast notifications with react-hot-toast

This architecture enables efficient AI-powered job discovery with modern UX patterns and robust error handling across all service boundaries.

## UI Component Registries

Remote Job Radar uses multiple premium UI component registries beyond shadcn/ui for enhanced visual experiences:

### Available Registries

**1. shadcn/ui (`@shadcn`)** - Foundation components

- URL: https://ui.shadcn.com
- Usage: Standard shadcn CLI commands

**2. KokonutUI (`@kokonutui`)** - Animated components

- URL: https://kokonutui.com
- Specialties: Text animations, interactive buttons, AI-themed components
- Key components: `shimmer-text`, `profile-dropdown`, `particle-button`

**3. SmoothUI (`@smoothui`)** - Framer Motion components

- URL: https://smoothui.dev
- Specialties: Job listings, user management, smooth transitions
- Key components: `job-listing-component`, `user-account-avatar`, `animated-tags`

**4. ReUI (`@reui`)** - Advanced UI blocks

- URL: https://reui.io
- Specialties: Kanban boards, data grids, complex layouts
- Key components: `kanban`, `data-grid`, `rating`, `chart`

**5. Motion Primitives (`@motion-primitives`)** - Advanced animations

- URL: https://motion-primitives.com
- Specialties: Text effects, interactive elements, morphing transitions
- Key components: `text-shimmer`, `morphing-dialog`, `dock`, `spotlight`

### Installation Commands

```bash
# Install from specific registries
npx shadcn@latest add "https://kokonutui.com/r/shimmer-text.json"
npx shadcn@latest add "https://smoothui.dev/r/job-listing-component.json"
npx shadcn@latest add "https://reui.io/r/kanban.json"

# Or use registry names (if configured)
npx shadcn@latest add @kokonutui/shimmer-text
npx shadcn@latest add @smoothui/job-listing-component
```

### Component Usage Examples

```tsx
// KokonutUI Shimmer Text
import ShimmerText from "@/components/kokonutui/shimmer-text";
<ShimmerText text="Profile Dashboard" className="text-4xl font-bold" />

// SmoothUI User Avatar
import UserAccountAvatar from "@/components/smoothui/ui/UserAccountAvatar";
<UserAccountAvatar user={{...}} className="hover:scale-110" />

// ReUI Kanban Board
import { Kanban } from "@/components/ui/kanban";
<Kanban columns={columns} onCardMove={handleMove} />
```

### Registry Configuration

The `apps/web/components.json` file configures all registries:

```json
{
  "registries": {
    "@smoothui": "https://smoothui.dev/r/{name}.json",
    "@kokonutui": "https://kokonutui.com/r/{name}.json",
    "@motion-primitives": "https://motion-primitives.com/r/{name}.json",
    "@reui": "https://reui.io/r/{name}.json",
    "@clerk": "https://clerk.com/r/{name}.json"
  }
}
```
