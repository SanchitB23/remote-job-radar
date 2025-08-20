# Remote Job Radar – Web App

This is the **Next.js 15 frontend** for Remote Job Radar, providing a modern, AI-powered job discovery and pipeline management experience.

## Overview

- **Framework:** Next.js 15 (App Router)
- **UI:** shadcn/ui, Tailwind CSS, Heroicons
- **State/Data:** TanStack Query, GraphQL, REST
- **Auth:** Clerk
- **Features:**
  - Kanban pipeline with drag-and-drop (powered by @dnd-kit)
  - Real-time job alerts and pipeline updates (GraphQL subscriptions)
  - Advanced filtering, semantic job matching, and fit scoring
  - Optimistic UI, skeleton loaders, and error boundaries
  - Responsive, accessible, and themeable (dark/light mode)

## Getting Started

### 1. Environment Setup

Copy the example environment file and update with your values:

```bash
cp .env.example .env.local
```

**Required variables:**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk publishable key
- `CLERK_SECRET_KEY` – Clerk secret key
- `CLERK_JWT_KID` – JWT Key ID
- `CLERK_JWT_ISSUER` – JWT issuer URL
- `GRAPHQL_BASE_URL` – GraphQL HTTP endpoint (default: `http://localhost:4000/graphql`)
- `NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT` – GraphQL WebSocket endpoint (default: `ws://localhost:4000/graphql`)

### 2. Development Workflow

Start the web app (from this directory):

```bash
npm run dev
```

> **Note:** In a monorepo setup, use `npm run dev:all` from the root to start all services (DB, API, embedder, aggregator, web).

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 3. Project Structure

- `app/` – Next.js App Router pages (jobs, kanban, status, etc.)
- `components/` – UI components (job cards, toasts, spinners, etc.)
- `lib/` – Client libraries and hooks
- `services/` – API and GraphQL clients
- `constants/` – Query and config constants
- `types/` – TypeScript types (GraphQL, API)

### 4. UI/UX Stack

- **shadcn/ui** – Modern, accessible component library
- **Tailwind CSS** – Utility-first styling
- **Heroicons** – Consistent iconography
- **@dnd-kit** – Drag-and-drop for Kanban
- **TanStack Query** – Data fetching, caching, and optimistic updates
- **Clerk** – Authentication and user management

### 5. Key Features

- **Kanban Board:** `/kanban` – Drag-and-drop job pipeline (wishlist, applied, interview, offer)
- **Job Listings:** `/jobs` – Infinite scroll, advanced filters, fit score, bookmarking
- **Real-time Updates:** GraphQL subscriptions for job alerts and pipeline changes
- **Optimistic UI:** Instant feedback for bookmarks and pipeline actions
- **Error Handling:** User-friendly error boundaries and fallback states
- **Loading States:** Skeleton loaders and spinners
- **Responsive Design:** Mobile-first, adaptive layouts
- **Theme Support:** Dark/light mode

### 6. Testing & Debugging

- **API test:** See `api-test.ts` for sample queries
- **Prisma Studio:** Use for DB inspection (run in API app)
- **DevTools:** Use React DevTools and TanStack Query DevTools for debugging

### 7. Deployment

- Deploy on [Vercel](https://vercel.com/) or your preferred platform
- Ensure all required environment variables are set in production

### 8. More Info

- See the main repo `README.md` and `.github/copilot-instructions.md` for full architecture and integration details
