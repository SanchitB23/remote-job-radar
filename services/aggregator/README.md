# Aggregator Service - Restructured

## Overview

The aggregator service has been restructured to follow Go best practices and improve maintainability, testability, and separation of concerns.

## New Directory Structure


```
services/aggregator/
├── cmd/serve/           # Application entry point
│   └── main.go         # Clean main function (dependency injection)
├── internal/
│   ├── app/            # Application setup and dependency injection
│   │   └── app.go
│   ├── config/         # Configuration management
│   │   └── config.go
│   ├── handlers/       # HTTP handlers and routes
│   │   ├── handlers.go
│   │   └── routes.go
│   ├── services/       # Business logic services
│   │   ├── jobs.go     # Job fetching and processing
│   │   └── skills.go   # Skills loading and vector generation
│   ├── scheduler/      # Background job scheduling
│   │   └── scheduler.go
│   ├── fetch/          # External API clients
│   │   ├── adzuna.go
│   │   └── remotive.go
│   ├── scorer/         # ML scoring logic
│   │   ├── embedder.go
│   │   └── rank.go
│   ├── storage/        # Database operations
│   │   └── db.go
│   └── logger/         # Logging configuration
│       └── logger.go
├── go.mod
├── go.sum
├── skills.yml          # Skills configuration
└── README.md           # This file
```

## Improvements Made

### 1. **Separation of Concerns**

- **Configuration**: Centralized in `internal/config/`
- **HTTP Layer**: Separated into `internal/handlers/`
- **Business Logic**: Organized into `internal/services/`
- **Scheduling**: Isolated in `internal/scheduler/`
- **Application Setup**: Managed in `internal/app/`

### 2. **Clean Main Function**

- Reduced from 150+ lines to ~60 lines
- Focused only on application lifecycle management
- All initialization moved to `app.NewApp()`
- Proper error handling and graceful shutdown

### 3. **Dependency Injection**

- Dependencies are injected through constructors
- Makes the code more testable
- Clearer dependency relationships
- Easier to mock for testing

### 4. **Better Error Handling**

- Consistent error propagation
- Structured logging with context
- Graceful degradation on errors

### 5. **Configuration Management**

- Environment-based configuration
- Validation of required variables
- Default values for optional settings
- Centralized configuration loading

### 6. **Improved Scheduling**

- Graceful shutdown support
- Cancellable contexts
- Better error handling
- Synchronized goroutine management

## Key Components

### App (`internal/app/`)

Central application orchestrator that:

- Initializes all dependencies
- Sets up service connections
- Handles cleanup on shutdown

### Config (`internal/config/`)

Manages all configuration:

- Environment variable loading
- Validation and defaults
- Duration parsing with fallbacks

### Services (`internal/services/`)

Business logic layer:

- **JobService**: Handles job fetching and processing
- **SkillsService**: Manages skills loading and vector generation

### Handlers (`internal/handlers/`)

HTTP layer:

- Clean request/response handling
- Middleware configuration
- Route setup

### Scheduler (`internal/scheduler/`)

Background job management:

- Configurable intervals
- Graceful shutdown
- Error recovery

## Configuration

The service supports the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_DSN` | Yes | - | Database connection string |
| `EMBEDDER_URL` | Yes | - | Embedder service URL |
| `SKILLS_FILE` | Yes | - | Path to skills YAML file |
| `PORT` | No | `8080` | HTTP server port |
| `FETCH_INTERVAL` | No | `2h` | Job fetch interval |
| `SCORE_INTERVAL` | No | `4h` | Scoring interval |
| `FETCH_TIMEOUT` | No | `30s` | Fetch operation timeout |
| `ENV` | No | - | Environment name |

## Benefits of the New Structure

1. **Testability**: Each component can be tested in isolation
2. **Maintainability**: Clear separation makes changes easier
3. **Readability**: Smaller, focused files are easier to understand
4. **Extensibility**: Easy to add new features or data sources
5. **Error Recovery**: Better error handling and logging
6. **Performance**: More efficient resource management

## Migration Notes

The refactored service maintains the same external API and behavior, but with improved internal structure. No changes are required for clients or deployment configurations.

## Future Improvements

With this new structure, the following improvements become easier to implement:

1. **Unit Tests**: Each service can be tested independently
2. **Integration Tests**: Mock dependencies for isolated testing
3. **New Data Sources**: Add new fetchers in `internal/fetch/`
4. **Health Checks**: Enhanced monitoring capabilities
5. **Metrics**: Add observability without affecting core logic
6. **Rate Limiting**: Add middleware for API protection
