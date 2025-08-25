# Stats API - Go Implementation

A lightweight, memory-efficient API for analyzing GitHub repositories to count pattern occurrences in markdown documentation files and track commit activity. This Go implementation counts "_**User**_" occurrences in `.specstory/history` directories (if present) and provides commit statistics for any GitHub repository.

## Features

- 🚀 Fast and memory-efficient processing
- 📊 Analyzes public GitHub repositories
- 🔍 Counts specific pattern occurrences in markdown files
- 📈 Daily statistics with averages, medians, and trends
- 📅 Commit activity tracking for any repository
- 🔄 Works with or without `.specstory/history` directory
- 💾 Redis caching for blazing-fast repeated analyses
- 🔑 Content-addressable cache using Git blob SHAs
- 📝 Comprehensive logging with environment-aware configuration
- ⚡ Minimal dependencies and lightweight binary
- 🔄 Streaming file processing for large files
- 📅 Intelligent date extraction from markdown headers

## Tech Stack

- **Language**: Go 1.21+
- **HTTP Server**: Standard library `net/http`
- **Git Operations**: Blobless clones for efficient repository analysis
- **Caching**: Redis with content-addressable storage
- **Logging**: Custom logger with development/production modes

## Prerequisites

- Go 1.21 or higher
- Git (for repository analysis)
- Redis (optional, for caching)
- Make (optional, for using Makefile commands)

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/specstoryai/stats-go.git
cd stats-go

# Download dependencies
go mod download

# Copy the example environment file
cp .env.example .env
# Edit .env with your preferred settings
```

### Building

```bash
# Build the application
make build
# or
go build -o bin/server cmd/server/main.go
```

### Local Development

**Quick Start - Single Command:**
```bash
make run
```

This single command will:
- ✅ Automatically start Redis if not running (on port 6380)
- ✅ Load your `.env` file configuration
- ✅ Build the latest code
- ✅ Start the server
- ✅ Clean shutdown of Redis when you stop with Ctrl+C

The server will be available at `http://localhost:3010` (or whatever port you configured in `.env`).

#### First Time Setup

If you haven't set up your environment yet:
```bash
# Copy the example environment file
cp .env.example .env
# Edit .env if you need custom settings

# Run the server (Redis will auto-start)
make run
```

#### Running Options

```bash
make run           # Run with Redis auto-start (recommended)
make run-no-cache  # Run without Redis cache
make dev           # Run with auto-reload (uses air)
```

#### Note on Redis Management

When using `make run`, Redis is automatically managed:
- Starts only if not already running
- Runs in the background during your dev session
- Cleanly shuts down when you stop the server (Ctrl+C)

For manual Redis control:
```bash
# Start Redis daemon (persists after server stops)
redis-server --port 6380 --daemonize yes

# Stop Redis manually
redis-cli -p 6380 shutdown
```

## API Documentation

### Endpoints

#### `GET /`

Returns API information.

**Response:**
```json
{
  "message": "Stats API",
  "endpoints": {
    "/analyze": "GET - Analyze a GitHub repository for prompt counts"
  }
}
```

#### `GET /analyze`

Analyzes a public GitHub repository to count prompt occurrences (if `.specstory/history` exists) and provide detailed daily statistics including commit activity.

**Query Parameters:**
- `repo` (required): GitHub repository in format `owner/repository`
- `branch` (optional): Branch name. If not specified, uses the repository's default branch (main, master, etc.)

**Example Requests:**
```
GET /analyze?repo=specstoryai/tnyOffice          # Uses default branch
GET /analyze?repo=facebook/react                 # Automatically uses 'master' 
GET /analyze?repo=specstoryai/tnyOffice&branch=develop  # Specific branch
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "repo": "specstoryai/tnyOffice",
    "branch": "main",
    "promptCount": 271,
    "sessionsProcessed": 15,
    "processingTimeMs": 234,
    "totalCommits": 83,
    "dailyStats": {
      "promptsAverage": 90.33,
      "promptsMedian": 37,
      "promptsMax": 202,
      "promptsMin": 32,
      "commitsAverage": 13.83,
      "commitsMedian": 8,
      "commitsMax": 47,
      "commitsMin": 1,
      "totalDays": 6,
      "dateRange": {
        "start": "2025-07-19",
        "end": "2025-08-20"
      },
      "dailyDetails": [
        {
          "date": "2025-07-19",
          "promptCount": 37,
          "sessionCount": 1,
          "commitCount": 23
        },
        {
          "date": "2025-07-20",
          "promptCount": 202,
          "sessionCount": 11,
          "commitCount": 47
        },
        {
          "date": "2025-07-21",
          "promptCount": 32,
          "sessionCount": 3,
          "commitCount": 2
        },
        {
          "date": "2025-08-18",
          "promptCount": 0,
          "sessionCount": 0,
          "commitCount": 6
        },
        {
          "date": "2025-08-19",
          "promptCount": 0,
          "sessionCount": 0,
          "commitCount": 4
        },
        {
          "date": "2025-08-20",
          "promptCount": 0,
          "sessionCount": 0,
          "commitCount": 1
        }
      ]
    }
  }
}
```

**Response Fields:**
- `promptCount`: Total number of prompts found across all sessions (0 if no .specstory/history)
- `sessionsProcessed`: Number of session files analyzed  
- `processingTimeMs`: Time taken to process the repository
- `totalCommits`: Total number of commits in the repository/branch
- `dailyStats`: Daily statistics (may be null if no activity)
  - `promptsAverage`: Average prompts per day
  - `promptsMedian`: Median prompts per day
  - `promptsMax`: Maximum prompts in a single day
  - `promptsMin`: Minimum prompts in a single day
  - `commitsAverage`: Average commits per day
  - `commitsMedian`: Median commits per day
  - `commitsMax`: Maximum commits in a single day
  - `commitsMin`: Minimum commits in a single day
  - `totalDays`: Number of unique days with activity
  - `dateRange`: Start and end dates of activity
  - `dailyDetails`: Array of per-day statistics sorted by date
    - `date`: Date in YYYY-MM-DD format
    - `promptCount`: Number of prompts on this day
    - `sessionCount`: Number of sessions on this day
    - `commitCount`: Number of git commits on this day

**How to Use This Endpoint:**

1. **Basic Usage - Analyze a repository:**
   ```bash
   curl "https://stats.specstory.com/analyze?repo=owner/repo"
   ```

2. **Specific Branch:**
   ```bash
   curl "https://stats.specstory.com/analyze?repo=owner/repo&branch=develop"
   ```

3. **Extract Statistics (using jq):**
   ```bash
   # Get prompts average per day
   curl -s "https://stats.specstory.com/analyze?repo=owner/repo" | \
     jq '.data.dailyStats.promptsAverage'
   
   # Get commits average per day
   curl -s "https://stats.specstory.com/analyze?repo=owner/repo" | \
     jq '.data.dailyStats.commitsAverage'
   ```

4. **Get Date Range of Activity:**
   ```bash
   curl -s "https://stats.specstory.com/analyze?repo=owner/repo" | \
     jq '.data.dailyStats.dateRange'
   ```

5. **List Daily Activity:**
   ```bash
   curl -s "https://stats.specstory.com/analyze?repo=owner/repo" | \
     jq '.data.dailyStats.dailyDetails[] | "\(.date): \(.promptCount) prompts, \(.commitCount) commits"'
   ```

**Features:**
- Works with any public GitHub repository (with or without .specstory/history)
- Automatically detects and uses repository's default branch when not specified
- Uses blobless Git clones (downloads commit history but no file content)
- No API rate limits
- Content-addressable caching using blob SHAs
- Intelligent date extraction from markdown headers
- Automatic cache invalidation for outdated entries

#### `GET /cache-stats`

Returns Redis cache statistics.

**Example Request:**
```
GET /cache-stats
```

**Response:**
```json
{
  "enabled": true,
  "keys": 42,
  "info": "# Server\nredis_version:7.2.0\n..."
}
```

**Error Responses:**

- **400 Bad Request**: Invalid or missing parameters
- **404 Not Found**: Repository or `.specstory/history` directory not found
- **429 Too Many Requests**: GitHub API rate limit exceeded
- **500 Internal Server Error**: Server error

## Project Structure

```
stats-go/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── pkg/
│   ├── cache/
│   │   └── redis_client.go  # Redis caching with content-addressable storage
│   ├── counter/
│   │   └── counter.go       # Pattern counting logic
│   ├── gitops/
│   │   └── client.go        # Git operations (blobless clones, ls-tree)
│   ├── handlers/
│   │   └── analyze.go       # Git-based analysis with caching
│   ├── logger/
│   │   └── logger.go        # Logging utility
│   └── middleware/
│       └── logging.go       # Request/response logging
├── go.mod                   # Go module definition
├── go.sum                   # Dependency checksums
├── Makefile                 # Build and run commands
└── README.md               # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3010` |
| `APP_ENV` | Environment mode (`development` or `production`) | `development` |
| `LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | `info` |
| `REDIS_URL` | Redis connection URL for caching | _(optional)_ |

## Logging

The application includes an environment-aware logging system:

### Development Mode (APP_ENV != 'production')
- Pretty-printed logs with emojis for visual distinction
- Full error details
- Human-readable format

### Production Mode (APP_ENV = 'production')
- Structured JSON logs for parsing by monitoring services
- Optimized for great platforms
- Includes timestamps and context data

## Cloudflare CDN Configuration

The API is deployed behind Cloudflare CDN for optimal performance and global distribution:

### DNS Setup
- **Type**: AAAA record only (IPv6)
- **Name**: `stats`
- **IPv6**: `2a09:8280:1::91:dd64:0` (Fly.io app IPv6)
- **Proxy**: Enabled (orange cloud)

### Page Rule Configuration
To enable proper cache control with 2-minute edge caching:

1. **URL Pattern**: `stats.specstory.com/*`
2. **Settings**:
   - **Cache Level**: Cache Everything
   - **Origin Cache Control**: On (respects app's Cache-Control headers)

### Cache Behavior
- Application sends `Cache-Control: public, max-age=120` (2 minutes)
- Cloudflare edge servers respect this TTL and expire cache after 2 minutes
- Browser cache may show longer TTL but edge cache follows origin settings
- Cache status visible in `CF-Cache-Status` response header (HIT/MISS/EXPIRED)

### Benefits
- Global edge caching reduces latency
- 2-minute TTL balances freshness with performance
- Origin Cache Control ensures app controls cache duration
- Automatic SSL/TLS with Let's Encrypt via Fly.io

## Caching Architecture

The `/analyze` endpoint uses a content-addressable caching strategy:

1. **Cache Key**: Uses only the Git blob SHA (e.g., `blob:abc123...`)
   - Same file content across different repos/branches shares the same cache entry
   - Maximizes cache efficiency and reuse

2. **Cache Value**: Stores only computed stats, not file content
   ```json
   {
     "prompt_count": 42,
     "sha": "abc123...",
     "cached_at": "2024-01-20T12:00:00Z"
   }
   ```

3. **Benefits**:
   - Immutable content (blob SHAs never change)
   - No cache invalidation needed
   - ~100x faster for cache hits
   - Minimal storage footprint

## Performance

- **Memory Usage**: < 50MB for typical repositories
- **Processing Time**: < 5 seconds for repositories with < 100 files (< 500ms with cache hits)
- **Cache Performance**: ~100x faster for cached repositories
- **Cache Storage**: Stores only prompt counts (not file content) - ~50 bytes per file
- **Rate Limits**: No rate limits (uses Git operations, not GitHub API)

## Building for Different Platforms

```bash
# Build for all platforms
make build-all

# Build for specific platform
GOOS=linux GOARCH=amd64 go build -o bin/server-linux cmd/server/main.go
GOOS=darwin GOARCH=arm64 go build -o bin/server-darwin cmd/server/main.go
GOOS=windows GOARCH=amd64 go build -o bin/server.exe cmd/server/main.go
```

## Testing

### Unit Tests

```bash
# Run Go unit tests
make test
# or
go test -v ./...
```

### API Integration Tests

A comprehensive test suite is provided to validate API functionality:

```bash
# Test against local server (default: http://localhost:3010)
./tests/api_test.sh

# Test against production
API_URL=https://stats.specstory.com ./tests/api_test.sh

# Test against production (alternate domain)
API_URL=https://spst-stats.fly.dev ./tests/api_test.sh

# Verbose mode (show response details)
VERBOSE=true ./tests/api_test.sh
```

**Test Coverage:**
- ✅ Home endpoint availability
- ✅ Valid repository analysis
- ✅ Default branch detection (main, master, etc.)
- ✅ Specific branch requests
- ✅ Error handling (400, 404)
- ✅ Invalid repo format validation
- ✅ Non-existent repository handling
- ✅ Missing .specstory/history detection
- ✅ Cache stats endpoint
- ✅ Cache effectiveness (response time comparison)

**Test Configuration:**
Test repositories and endpoints are configured in `tests/test_config.json`

## Development Commands

```bash
# Format code
make fmt

# Run linter (requires golangci-lint)
make lint

# Clean build artifacts
make clean

# Update dependencies
make deps
```

## Deployment

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o server cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates git
WORKDIR /root/
COPY --from=builder /app/server .
EXPOSE 8080
ENV APP_ENV=production
ENV PORT=8080
CMD ["./server"]
```

### Systemd Service

```ini
[Unit]
Description=Stats API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/stats-api
ExecStart=/opt/stats-api/server
Restart=on-failure
Environment="APP_ENV=production"
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the SpecStory AI suite of tools.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.