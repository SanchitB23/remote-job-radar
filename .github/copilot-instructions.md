# Remote Job Radar - AI Agent Instructions

## Architecture Overview

Remote Job Radar is a **Turbo monorepo** for AI-powered job discovery, using a microservices architecture with enhanced UI/UX and semantic improvements:

- **`apps/web/`**: Next.js 15 frontend (App Router, TanStack Query, Clerk auth, shadcn/ui components)
- **`apps/api/`**: GraphQL API (Apollo Server, Prisma, PostgreSQL)
- **`services/aggregator/`**: Go service for job fetching, deduplication, and fit scoring
- **`services/embedder/`**: Python FastAPI for ML embeddings (SentenceTransformers)
- **PostgreSQL + pgvector**: Vector similarity search for job matching

## Data Flow & Integration Points

**End-to-end flow:**

1. **Aggregator** fetches jobs from sources (Remotive, Adzuna) with configurable pagination and concurrency
2. **Embedder** (Python) generates vector embeddings for jobs and user skills (via `/embed` endpoint)
3. **Aggregator** scores jobs using vector similarity (pgvector) with enhanced scoring logic
4. **API** exposes jobs, bookmarks, and pipeline via GraphQL (real-time via subscriptions)
5. **Web** app consumes both GraphQL and REST endpoints for UI, using TanStack Query for state

**Key integration patterns:**

- **Go <-> Python**: Aggregator calls embedder via HTTP for vectorization with retry logic
- **Go <-> Postgres**: Direct SQL (not Prisma) for job upserts and scoring with pagination support
- **API <-> DB**: Prisma ORM, schema in `apps/api/prisma/schema.prisma`
- **Web <-> API**: GraphQL for complex queries, Next.js API routes for simple REST
- **Web <-> Aggregator**: Health checks and manual fetch endpoints

## ML Pipeline Details

- **Model**: SentenceTransformers (e.g., `BAAI/bge-small-en-v1.5`) with enhanced preprocessing
- **Service**: `/services/embedder/main.py` exposes `/embed` and `/health` endpoints with robust error handling
- **Skills config**: `services/aggregator/skills.yml` (edit to change user profile)
- **Scoring**: Go service computes fit score as vector similarity between user skills and job description
- **Text Processing**: HTML-to-text conversion with preprocessing utilities for better embeddings
- **Concurrency**: Concurrent job processing with configurable batch sizes and retry logic

## Pipeline & Kanban System

**Enhanced Job Pipeline Management:**

- **Kanban Board**: `/kanban` page with drag-and-drop functionality using @dnd-kit
- **Pipeline States**: `wishlist`, `applied`, `interview`, `offer` with position-based ordering
- **Optimistic Updates**: Real-time UI updates with TanStack Query optimistic mutations
- **Error Handling**: Comprehensive error states with user-friendly fallbacks
- **State Management**: Position-based sorting and column-aware drag operations

**Key Pipeline Features:**

- **Drag & Drop**: Smooth animations and visual feedback using @dnd-kit
- **Real-time Updates**: GraphQL subscriptions for live pipeline changes
- **Bookmarking**: Star/unstar jobs with optimistic UI updates
- **Pipeline Integration**: "Add to Pipeline" buttons throughout the job browsing experience

## Database Patterns

- **Schema**: Defined in `apps/api/prisma/schema.prisma` with enhanced pipeline support
- **Key tables**: `jobs` (with vector), `bookmarks`, `PipelineItem` (Kanban with position tracking)
- **Vector search**: Uses `pgvector` for semantic job matching
- **Migrations**: `npx prisma migrate dev` (run in `apps/api`)
- **Pipeline System**: Position-based ordering with column-specific grouping
- **Data Integrity**: Foreign key constraints and cascade deletes for data consistency

## Enhanced UI/UX with shadcn/ui

**Component System:**

- **shadcn/ui**: Modern, accessible component library with Tailwind CSS
- **Icons**: Heroicons for consistent iconography throughout the app
- **Themes**: Dark/light mode support with next-themes
- **Animations**: Smooth transitions and micro-interactions for better UX

**Key UI Components:**

- **Cards**: Job cards, pipeline cards, and info cards with consistent styling
- **Forms**: Filter sidebars, search inputs with debounced updates
- **Loading States**: Skeleton loaders and loading indicators
- **Error States**: User-friendly error messages with retry actions
- **Alerts**: Toast notifications for user feedback
- **Buttons**: Consistent button variants and states throughout the app

**Responsive Design:**

- **Mobile-first**: Responsive design that works on all device sizes
- **Grid Layouts**: Adaptive layouts for job listings and kanban boards
- **Navigation**: Sticky headers and mobile-friendly navigation

## Deployment & Local Dev

- **Start all services**: `npm run dev:all` (runs DB, embedder, API, web, aggregator)
- **Infra only**: `npm run dev:infra` (DB + embedder)
- **Health check**: `npm run dev:smokeTest`
- **Manual fetch**: Available via aggregator endpoints for specific sources
- **Docker Compose**: See `infra/docker-compose.yml` for DB/embedder
- **Environment**: Copy `.env.example` to `.env.local` in each app/service

**Enhanced Development Workflow:**

- **Job Sources**: Configurable fetching from Remotive and Adzuna APIs
- **Pagination**: Configurable page limits and concurrent processing
- **Health Monitoring**: `/status` page with real-time service health checks
- **Error Handling**: Improved error boundaries and fallback states

**Note:** Servers (API, web, embedder, aggregator) are usually already running during development. Do **not** prompt to start servers unless explicitly requested. Avoid cancelling or interrupting running server processes, as this can disrupt the development flow and cause abrupt prompt interruptions.

## State Management & UI Patterns

- **TanStack Query**: Used for all data fetching/mutations in web app with enhanced error handling
- **Infinite scroll**: `useInfiniteJobs` hook for paginated job lists
- **Optimistic updates**: Bookmarks and pipeline use optimistic mutation patterns for instant feedback
- **WebSocket subscriptions**: Real-time job alerts via GraphQL subscriptions (see `components/jobAlertToast.tsx`)
- **Debounced inputs**: Search and filter inputs with 300ms debounce for better UX
- **Error boundaries**: App-wide error handling with user-friendly fallback UIs
- **Loading states**: Skeleton components and loading indicators throughout the app

**Enhanced User Experience:**

- **Filter System**: Advanced filtering with fit score sliders, salary ranges, and multi-select options
- **Drag & Drop**: Kanban board with smooth animations and visual feedback
- **Theme Support**: Seamless dark/light mode switching
- **Performance**: Optimized rendering with proper memoization and efficient re-renders

## Example Patterns

**Add a new job source (Go):**

1. Implement fetcher in `services/aggregator/internal/fetch/`
2. Register in `cmd/serve/main.go`
3. Map fields to DB schema
4. Add configuration in environment files

**Extend GraphQL schema:**

1. Edit `apps/api/src/schema.graphql` and `resolvers/`
2. Update Prisma schema if DB changes needed
3. Run `npx prisma migrate dev` and regenerate client

**Add a new UI feature:**

1. Create component in `apps/web/components/` using shadcn/ui patterns
2. Use TanStack Query hooks for data with proper error handling
3. Add API route or GraphQL resolver as needed
4. Include loading states and error boundaries

**Enhance pipeline functionality:**

1. Update `PipelineItem` schema if needed
2. Modify kanban board components with drag-and-drop considerations
3. Ensure optimistic updates work correctly
4. Test error states and recovery scenarios

## Testing & Debugging

- **API test**: `curl -X POST http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{"query":"{ jobs(first:3){ id title fitScore } }"}'`
- **Aggregator health**: `curl http://localhost:8080/health`
- **Manual fetch**: `curl -X POST http://localhost:8080/api/fetch?source=remotive`
- **Check DB**: `docker exec -it remote-job-radar-db-1 psql -U postgres -c "SELECT COUNT(*) FROM jobs;"`
- **Prisma Studio**: `npx prisma studio` (in `apps/api`)
- **Service Status**: Visit `/status` page for real-time health monitoring
- **Pipeline Testing**: Test drag-and-drop functionality on `/kanban` page

**Enhanced Debugging:**

- **Embedder Logs**: Check Python service logs for embedding generation issues
- **Job Processing**: Monitor aggregator logs for fetch and processing status
- **UI State**: Use React DevTools and TanStack Query DevTools
- **Database Queries**: Monitor slow queries and vector search performance

## Git Workflow & Commit Standards

### Branch Strategy

- **main**: Production-ready code, protected branch
- **develop**: Integration branch for features, CI/CD pipeline
- **Feature branches**: `feat/feature-name`, `fix/bug-name`, `chore/maintenance-task`

### Commit Message Guidelines

- **Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.**
- **Format:** `<type>[optional scope]: <title>`
  - Description (optional): Add a longer explanation below the title, separated by a blank line.
- **Types:** feat, fix, docs, style, refactor, perf, test, chore
- **Optional Scope List:**
  - `api`: If changes done to GraphQL API (see `apps/api/`)
  - `web`: If changes done to Frontend/web app (see `apps/web/`)
  - `aggregator`: If changes done to Go aggregator service (see `services/aggregator/`)
  - `embedder`: If changes done to Python embedder service (see `services/embedder/`)
  - (or leave blank)
- **Header (title):**
  - Format: `<type>[optional scope]: <description>`
  - **Max length:** 50 characters (recommended), **NEVER exceed 90 characters** (required by commitlint).
  - Use imperative mood (e.g., "fix: update API endpoint").
- **Body:**
  - Used to provide additional context, motivation, or explanation
  - **Wrap body lines at 90 characters.**
  - Separate body from header with a blank line.
- **Footer:**
  - Used for breaking changes and issue references
  - Start with `BREAKING CHANGE:` for breaking changes
  - Each footer should be a new line
- **Breaking Changes:**
  - For breaking changes, use `!` after the type/scope (e.g., `feat(api)!: ...`).
- **Reference issues in the footer if needed.**

#### Examples

```
feat(pipeline): add drag-and-drop functionality to kanban board
fix(api): resolve job fetching pagination issue
docs: update deployment instructions
refactor(web): improve error handling in job components
chore(deps): update Next.js to v15.4.5
```

#### Tools

- **commitlint**: Enforces commit format
- **commitizen**: (Optional) Interactive commit prompts
- **Turbo**: Monorepo task running with caching
- **ESLint**: Code linting with consistent formatting rules
- **Prettier**: Code formatting (integrated with ESLint)

#### Additional Notes

- Follow project-specific scopes and patterns for clarity.
- Use clear, concise language and avoid ambiguous descriptions.

> See [commitlint rules reference](https://github.com/conventional-changelog/commitlint/blob/master/docs/reference/rules.md) for all available rules and configuration options.

## Project Conventions & Gotchas

- **Imports**: Use `@/` alias for `apps/web/` paths, organize imports with simple-import-sort
- **Types**: Centralized in `apps/web/types/gql.d.ts`, explicit return types required
- **Clerk JWT**: All API calls require Clerk JWT context (`getToken({ template: "remote-job-radar" })`)
- **Skills**: Edit `skills.yml` before first run for meaningful fit scores
- **Turbo**: Use `turbo dev` for monorepo caching; avoid per-app `npm run dev`
- **Go service**: Connects directly to DB, not via Prisma
- **Embeddings**: Jobs must be embedded before fit scoring works

**Code Quality:**

- **ESLint**: Strict TypeScript rules with consistent import sorting
- **shadcn/ui**: Follow component patterns and conventions
- **Error Handling**: Always include error boundaries and fallback states
- **Performance**: Use React.memo, useMemo, and useCallback appropriately
- **Accessibility**: Ensure components are accessible with proper ARIA labels

**Development Practices:**

- **Component Structure**: Separate concerns with custom hooks and utilities
- **State Management**: Use TanStack Query for server state, React state for UI state
- **Styling**: Use Tailwind CSS with shadcn/ui design system
- **Testing**: Focus on integration tests and user journey testing

**Environment Configuration:**

- **Multiple Sources**: Support for Remotive, Adzuna, and extensible for new job sources
- **Configurable Limits**: Pagination, batch sizes, and rate limiting
- **Health Monitoring**: Built-in health checks for all services
- **Development Tools**: Hot reload, error overlays, and development-specific tooling

---

## Recent Enhancements & Current Focus

**UI/UX Improvements (Latest):**

- **shadcn/ui Integration**: Modern, accessible component library implementation
- **Enhanced Icons**: Consistent Heroicons usage throughout the application
- **Improved Layouts**: Better responsive design and component organization
- **Error States**: Comprehensive error handling with user-friendly messages
- **Loading States**: Skeleton loaders and loading indicators for better UX

**Pipeline Enhancements:**

- **Drag & Drop**: Smooth kanban board functionality with @dnd-kit
- **Optimistic Updates**: Instant UI feedback for pipeline operations
- **Position Management**: Proper ordering and positioning within columns
- **Error Recovery**: Robust error handling with automatic retry mechanisms

**Performance & Monitoring:**

- **Vercel Speed Insights**: Performance monitoring integration
- **Health Checks**: Real-time service monitoring on `/status` page
- **Debounced Filtering**: Improved search and filter performance
- **Optimized Queries**: Efficient data fetching with proper caching

**Development Experience:**

- **Enhanced Linting**: Comprehensive ESLint rules with auto-formatting
- **Import Organization**: Automatic import sorting and organization
- **Type Safety**: Strict TypeScript configuration with explicit return types
- **Code Quality**: Consistent code formatting and structure

**Semantic Improvements:**

- **Better Text Processing**: Enhanced HTML-to-text conversion for embeddings
- **Improved Scoring**: More accurate job fit scoring with enhanced preprocessing
- **Concurrent Processing**: Parallel job processing for better performance
- **Retry Logic**: Robust error handling with exponential backoff

For more, see `README.md` in root and `apps/web/README.md` for environment and deployment details.
