# Environment Setup Guide

This guide will help you set up all the necessary environment variables for the Remote Job Radar application.

## 📋 Prerequisites

Before setting up environment variables, make sure you have:

1. **Node.js 18+** and npm installed
2. **Docker** and Docker Compose installed  
3. **Go 1.24.5+** installed
4. **Python 3.8+** installed
5. A **Clerk account** for authentication

## 🚀 Quick Setup

### 1. Copy Environment Files

```bash
# Root level
cp .env.example .env.local

# Web app
cp apps/web/.env.example apps/web/.env.local

# API server  
cp apps/api/.env.example apps/api/.env.local

# Aggregator service
cp services/aggregator/.env.example services/aggregator/.env.local

# Embedder service
cp services/embedder/.env.example services/embedder/.env.local
```

### 2. Set Up Clerk Authentication

1. Go to [Clerk Dashboard](https://clerk.com)
2. Create a new application or use existing one
3. Go to **"API Keys"** section
4. Copy your keys to the environment files:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

5. Go to **"JWT Templates"** section
6. Create a new template named **"remote-job-radar"**
7. Copy the template details:
   - `CLERK_JWT_KID` (the template ID)
   - `CLERK_JWT_ISSUER` (your instance URL)
   - `CLERK_JWK_URL` (JWKS endpoint)

### 3. Configure Your Skills

Edit `services/aggregator/skills.yml` with your technical skills:

```yaml
skills:
  - react
  - typescript
  - golang
  - python
  - kubernetes
  - aws
  - postgresql
  - docker
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL and embedder service
npm run dev:infra
```

### 5. Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 6. Start All Services

```bash
# Start everything
npm run dev:all
```

## 🔧 Detailed Configuration

### Required Environment Variables

These variables **must** be set for the application to work:

| Variable | Service | Description | Example |
|----------|---------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web | Clerk public key | `pk_test_abc123...` |
| `CLERK_SECRET_KEY` | Web/API | Clerk secret key | `sk_test_def456...` |
| `CLERK_JWT_KID` | Web/API | JWT template ID | `ins_2abc123def456` |
| `CLERK_JWT_ISSUER` | Web/API | Your Clerk instance URL | `https://your-app.clerk.accounts.dev` |
| `DATABASE_URL` | API | PostgreSQL connection | `postgresql://postgres:local@localhost:5432/postgres` |
| `DB_DSN` | Aggregator | PostgreSQL connection | `host=localhost user=postgres password=local dbname=postgres sslmode=disable` |
| `EMBEDDER_URL` | Aggregator | ML service URL | `http://localhost:8000` |
| `SKILLS_FILE` | Aggregator | Skills config path | `skills.yml` |
| `CORS_ORIGIN` | API | Allowed origins | `http://localhost:3000` |

### Optional Environment Variables

These variables have sensible defaults but can be customized:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000/4000/8080/8000 | Service ports |
| `FETCH_INTERVAL` | `2h` | Job fetch frequency |
| `SCORE_INTERVAL` | `4h` | Job scoring frequency |
| `FETCH_TIMEOUT` | `30s` | Fetch operation timeout |
| `LOG_LEVEL` | `info` | Logging verbosity |

## 🌍 Environment-Specific Setup

### Development

All the example files are configured for development. Key characteristics:

- Uses `localhost` URLs
- Docker Compose for infrastructure
- Debug logging enabled
- CORS allows localhost origins

### Staging

For staging environment:

1. Update service URLs to your staging domains
2. Use staging database
3. Set `NODE_ENV=staging` and `ENV=staging`
4. Update CORS origins

### Production

For production deployment:

1. Use production database URLs
2. Set `NODE_ENV=production` and `ENV=production`
3. Use HTTPS URLs for all services
4. Configure proper CORS origins
5. Use secure secrets management
6. Enable structured JSON logging

## 🔒 Security Considerations

### Development
- ✅ Use `.env.local` files (already in `.gitignore`)
- ✅ Never commit real secrets to git
- ✅ Use different keys for each environment

### Production
- ✅ Use environment variables or secrets management
- ✅ Enable HTTPS for all services
- ✅ Restrict CORS origins
- ✅ Use strong, unique passwords
- ✅ Regularly rotate API keys

## 🧪 Testing Your Setup

### Health Checks

```bash
# Check all services
npm run dev:smokeTest

# Manual checks
curl http://localhost:3000/api/health        # Web app
curl http://localhost:4000/health           # GraphQL API
curl http://localhost:8080/health           # Aggregator
curl http://localhost:8000/health           # Embedder
```

### Database Connection

```bash
# Test GraphQL API
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Check database
cd apps/api
npx prisma studio  # Opens database viewer
```

### Authentication

1. Visit http://localhost:3000
2. Sign up/sign in with Clerk
3. Check that JWT tokens are being generated
4. Verify protected GraphQL queries work

## 🐛 Troubleshooting

### Common Issues

1. **"CORS Origin not allowed"**
   - Check `CORS_ORIGIN` in API `.env.local`
   - Make sure it includes your frontend URL

2. **"Cannot connect to database"**
   - Ensure Docker is running
   - Check `DATABASE_URL` and `DB_DSN` format
   - Run `npm run dev:infra` to start PostgreSQL

3. **"Embedder service unavailable"**
   - Check if Docker container is running
   - Verify `EMBEDDER_URL` points to correct port
   - Check Docker logs: `docker logs remote-job-radar-embedder-1`

4. **"JWT verification failed"**
   - Verify all Clerk environment variables
   - Check JWT template is named "remote-job-radar"
   - Ensure template is active in Clerk dashboard

5. **"Skills file not found"**
   - Check `SKILLS_FILE` path in aggregator config
   - Ensure `skills.yml` exists in aggregator directory
   - Verify file format is valid YAML

### Getting Help

If you encounter issues not covered here:

1. Check the service logs for error messages
2. Verify environment variables are loaded correctly
3. Test each service's health endpoint individually
4. Consult the main README for additional troubleshooting

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [Docker Compose Environment Files](https://docs.docker.com/compose/environment-variables/)
