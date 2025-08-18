# Remote Job Radar – API

This is the **GraphQL API** for Remote Job Radar, serving as the backend for job data, pipeline management, and user interactions.

## Overview

- **Framework:** Node.js (TypeScript)
- **API:** Apollo Server (GraphQL)
- **ORM:** Prisma
- **Database:** PostgreSQL (with pgvector for vector search)
- **Features:**
  - Exposes jobs, bookmarks, and pipeline via GraphQL
  - Real-time updates via GraphQL subscriptions
  - Integrates with aggregator and embedder services
  - Manages user authentication via Clerk JWT

## Getting Started

### 1. Environment Setup

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

**Required variables:**

- `DATABASE_URL` – PostgreSQL connection string
- `CLERK_SECRET_KEY` – Clerk secret key
- `CLERK_JWT_KID` – JWT Key ID
- `CLERK_JWT_ISSUER` – JWT issuer URL

### 2. Development Workflow

Install dependencies:

```bash
npm install
```

Start the API server:

```bash
npm run dev
```

> **Note:** In a monorepo setup, use `npm run dev:all` from the root to start all services.

### 3. Project Structure

- `src/` – API entrypoint, context, resolvers, schema
- `prisma/` – Prisma schema and migrations
- `types/` – TypeScript types for resolvers

### 4. Database & Prisma

- **Schema:** Defined in `prisma/schema.prisma`
- **Migrations:**
  - Create new migration: `npx prisma migrate dev --name <desc>`
  - Open Prisma Studio: `npx prisma studio`
- **Vector Search:** Uses `pgvector` for semantic job matching

### 5. Key Features

- **GraphQL API:** Jobs, bookmarks, pipeline management
- **Subscriptions:** Real-time updates for job alerts and pipeline changes
- **Authentication:** Clerk JWT required for all API calls
- **Integration:** Connects to aggregator and embedder for job ingestion and scoring
- **Error Handling:** Comprehensive error states and user-friendly messages

### 6. Testing & Debugging

- **API test:** Use GraphQL Playground or `curl` for queries
- **Prisma Studio:** Inspect and edit DB data
- **Logs:** Check server logs for errors and status

### 7. Deployment

- Ensure all required environment variables are set in production
- Database must support `pgvector` extension

### 8. More Info

- See the main repo `README.md` and `.github/copilot-instructions.md` for full architecture and integration details
