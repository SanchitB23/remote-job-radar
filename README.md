# Remote Job Radar

🚀 **AI-Powered Remote Job Discovery Platform** - Find and track remote jobs with personalized fit scores based on your skills.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

## 🌟 Features

### 🎯 Smart Job Matching

- **AI-Powered Fit Scoring**: Jobs are automatically scored (0-100) based on your skills using vector similarity
- **Semantic Search**: Find jobs using natural language queries
- **Multiple Filters**: Filter by salary, location, source, and minimum fit score
- **Real-time Updates**: WebSocket subscriptions for new job notifications

### 📊 Job Application Tracking

- **Kanban Board**: Visual pipeline to track job applications
- **Four Stages**: Wishlist → Applied → Interview → Offer
- **Drag & Drop**: Intuitive interface for moving jobs between stages
- **Bookmark System**: Save interesting jobs for later review

### 🔍 Job Sources

- **Remotive**: Premium remote job listings
- **Extensible Architecture**: Easy to add new job sources (Adzuna, LinkedIn, Indeed)
- **Automated Fetching**: Jobs are automatically collected every 2 hours
- **Deduplication**: Smart handling of duplicate job postings

### 🔐 Authentication & User Management

- **Clerk Integration**: Secure authentication with social logins
- **User-specific Data**: Personalized bookmarks and application tracking
- **JWT Security**: Secure API access with token-based authentication

## 🏗️ Architecture

This is a modern **monorepo** built with **Turbo** featuring a microservices architecture:

```
remote-job-radar/
├── apps/
│   ├── web/              # Next.js frontend (React, TypeScript, Tailwind)
│   └── api/              # GraphQL API server (Node.js, Apollo Server)
├── services/
│   ├── aggregator/       # Job fetching service (Go)
│   └── embedder/         # ML embedding service (Python, FastAPI)
└── infra/                # Docker infrastructure
```

### 🔧 Tech Stack

#### Frontend (`apps/web`)

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with dnd-kit for drag & drop
- **State Management**: TanStack Query (React Query)
- **Authentication**: Clerk
- **Real-time**: GraphQL subscriptions via WebSocket

#### Backend (`apps/api`)

- **Runtime**: Node.js with TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: Prisma ORM with PostgreSQL + pgvector
- **Real-time**: GraphQL subscriptions and WebSocket support
- **Authentication**: JWT tokens from Clerk

#### Job Aggregator (`services/aggregator`)

- **Language**: Go 1.24.5
- **HTTP Router**: Chi
- **Database**: Direct PostgreSQL connection
- **Scheduling**: Built-in cron for job fetching
- **APIs**: Remotive integration (more sources planned)

#### ML Service (`services/embedder`)

- **Language**: Python
- **Framework**: FastAPI
- **ML Model**: SentenceTransformers (all-MiniLM-L6-v2)
- **Purpose**: Generate embeddings for job descriptions and skills

#### Database

- **Primary**: PostgreSQL 15 with pgvector extension
- **Vector Search**: Semantic similarity matching for job recommendations
- **Migrations**: Prisma-managed schema evolution

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Go** 1.24.5+
- **Python** 3.8+

### 1. Clone and Install

```bash
git clone https://github.com/sanchitb23/remote-job-radar.git
cd remote-job-radar
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and ML embedder service
npm run dev:infra
```

### 3. Configure Environment

#### API Configuration (`apps/api/.env`)

```env
DATABASE_URL="postgresql://postgres:local@localhost:5432/postgres"
CLERK_JWT_KID="your_clerk_jwt_kid"
CLERK_JWT_ISSUER="your_clerk_issuer_url"
```

#### Web Configuration (`apps/web/.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
CLERK_JWT_KID="your_clerk_jwt_kid"
CLERK_JWT_ISSUER="your_clerk_issuer_url"
NEXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT="http://localhost:4000/graphql"
NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT="ws://localhost:4000/graphql"
```

#### Aggregator Configuration (`services/aggregator/.env.local`)

```env
DB_DSN="host=localhost user=postgres password=local dbname=postgres sslmode=disable"
SKILLS_FILE="skills.yml"
EMBEDDER_URL="http://localhost:8000"
PORT="8080"
```

### 4. Set Up Your Skills Profile

Edit `services/aggregator/skills.yml`:

```yaml
skills:
  - react
  - typescript
  - aws
  - golang
  - python
  - kubernetes
```

### 5. Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 6. Start All Services

```bash
# Start everything in development mode
npm run dev
```

This will start:

- **Web App**: <http://localhost:3000>
- **GraphQL API**: <http://localhost:4000/graphql>
- **Job Aggregator**: <http://localhost:8080>
- **ML Embedder**: <http://localhost:8000>

### 7. Health Check

```bash
# Verify all services are running
npm run dev:smokeTest
```

## 📚 API Documentation

### GraphQL Endpoints

#### Queries

```graphql
# Get job listings with filters
query GetJobs($minFit: Float, $search: String, $first: Int, $after: String) {
  jobs(minFit: $minFit, search: $search, first: $first, after: $after) {
    edges {
      id
      title
      company
      fitScore
      bookmarked
      isTracked
    }
    hasNextPage
    endCursor
  }
}

# Get user's application pipeline
query GetPipeline {
  pipeline {
    id
    column
    position
    job {
      id
      title
      company
    }
  }
}
```

#### Mutations

```graphql
# Bookmark a job
mutation BookmarkJob($id: ID!) {
  bookmark(id: $id)
}

# Add job to pipeline
mutation AddToPipeline($jobId: ID!, $column: String!, $position: Int!) {
  pipelineUpsert(jobId: $jobId, column: $column, position: $position)
}
```

#### Subscriptions

```graphql
# Subscribe to new high-fit jobs
subscription NewJobs($minFit: Float!) {
  newJob(minFit: $minFit) {
    id
    title
    company
    fitScore
  }
}
```

### REST Endpoints

#### Job Aggregator Service

- `GET /health` - Health check
- `POST /fetch` - Trigger manual job fetch

## 📊 Database Schema

### Core Tables

- **jobs**: Job listings with vector embeddings for similarity search
- **bookmarks**: User job bookmarks
- **PipelineItem**: Job application tracking in Kanban columns

### Key Features

- **pgvector**: Vector similarity search for job recommendations
- **Prisma**: Type-safe database operations
- **Migrations**: Version-controlled schema changes

## 🔧 Development

### Available Scripts

#### Root Level

```bash
npm run dev          # Start all services in development
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run test         # Run all tests
npm run dev:infra    # Start Docker services only
npm run dev:all      # Start infrastructure + all services
npm run dev:smokeTest # Run health checks
```

#### Per Package

```bash
# Web app
cd apps/web
npm run dev          # Next.js dev server
npm run build        # Production build

# API
cd apps/api
npm run dev          # API server with hot reload
npm run build        # TypeScript compilation

# Aggregator
cd services/aggregator
npm run dev          # Go development server
npm run build        # Build binary
```

### Project Structure

```
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App router pages
│   │   │   ├── jobs/       # Job listing page
│   │   │   ├── kanban/     # Application tracking
│   │   │   └── (auth)/     # Authentication pages
│   │   ├── components/     # Reusable UI components
│   │   └── lib/           # Utilities and GraphQL client
│   └── api/                # GraphQL API server
│       ├── src/           # TypeScript source
│       ├── prisma/        # Database schema & migrations
│       └── resolvers/     # GraphQL resolvers
├── services/
│   ├── aggregator/        # Go job fetching service
│   │   ├── cmd/          # CLI commands
│   │   └── internal/     # Go packages
│   └── embedder/         # Python ML service
└── infra/
    └── docker-compose.yml # Development infrastructure
```

## 🚀 Deployment

### Environment Setup

1. Set up PostgreSQL with pgvector extension
2. Configure Clerk authentication
3. Deploy ML embedder service
4. Set environment variables for production

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with production settings
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Submit** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write tests for new features
- Update documentation for API changes

## 🔮 Roadmap

### Near Term

- [ ] **Additional Job Sources**: LinkedIn, Indeed, Stack Overflow Jobs
- [ ] **Advanced Filters**: Remote vs. hybrid, company size, technology stack
- [ ] **Email Notifications**: Job alerts for high-fit positions
- [ ] **Skills Management**: UI for updating skills profile

### Medium Term

- [ ] **Job Analytics**: Trends, salary insights, application success rates
- [ ] **Company Profiles**: Detailed information about hiring companies
- [ ] **Application Notes**: Notes and reminders for job applications
- [ ] **Calendar Integration**: Interview scheduling

### Long Term

- [ ] **Mobile App**: React Native mobile application
- [ ] **Chrome Extension**: One-click job saving from any site
- [ ] **AI Resume Matching**: Resume optimization suggestions
- [ ] **Team Features**: Collaborative job searching for teams

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Remotive** for providing excellent remote job data
- **SentenceTransformers** for semantic job matching capabilities
- **Clerk** for seamless authentication
- **Vercel** for Next.js and deployment platform
- **pgvector** for efficient vector similarity search

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sanchitb23/remote-job-radar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sanchitb23/remote-job-radar/discussions)
- **Email**: <contact.rdrapp@sanchitb23.com>

---

### Built with ❤️ for the remote work community
