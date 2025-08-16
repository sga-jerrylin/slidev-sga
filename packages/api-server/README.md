# Slidev API Server

A production-ready API server for dynamically generating Slidev presentations from Markdown content.

## Features

- 🚀 **Dynamic Presentation Generation**: Create Slidev presentations from Markdown content via REST API
- 🔒 **Security**: Built-in rate limiting, CORS, helmet security headers, and input validation
- 📊 **Monitoring**: Health checks, metrics, and comprehensive logging
- ⚡ **Performance**: Compression, caching, and resource management
- 🛠 **Production Ready**: Error handling, graceful shutdown, and process management
- 🎨 **Customizable**: Support for themes, custom CSS, and Slidev configurations

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Start the server
pnpm start
```

### Development

```bash
# Start in development mode with hot reload
pnpm dev
```

## API Endpoints

### Create Presentation

```http
POST /api/presentations
Content-Type: application/json

{
  "content": "# My Presentation\n\nSlide content here...",
  "title": "My Awesome Presentation",
  "theme": "seriph",
  "ttl": 3600000
}
```

**Response:**
```json
{
  "id": "slidev-abc123def456",
  "url": "http://localhost:3001",
  "status": "ready",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "createdAt": "2024-01-01T11:00:00.000Z",
  "urls": {
    "presentation": "http://localhost:3001/1",
    "presenter": "http://localhost:3001/presenter/1",
    "overview": "http://localhost:3001/overview",
    "print": "http://localhost:3001/print"
  }
}
```

### List Presentations

```http
GET /api/presentations
```

### Get Presentation Details

```http
GET /api/presentations/{id}
```

### Delete Presentation

```http
DELETE /api/presentations/{id}
```

### Extend Presentation TTL

```http
POST /api/presentations/{id}/extend
Content-Type: application/json

{
  "ttl": 7200000
}
```

### Health Check

```http
GET /api/health
```

### Service Statistics

```http
GET /api/stats
```

## Configuration

Configure the server using environment variables:

```bash
# Server configuration
API_PORT=3000
API_HOST=0.0.0.0
BASE_URL=http://localhost

# Resource limits
MAX_CONCURRENT=10
DEFAULT_TTL=3600000
TEMP_DIR=/tmp/slidev-api

# Port range for presentations
PORT_RANGE_START=3001
PORT_RANGE_END=3100

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Features
ENABLE_CORS=true
ENABLE_COMPRESSION=true

# Logging
LOG_LEVEL=info
```

## Request Format

### Presentation Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Markdown content for the presentation |
| `title` | string | No | Presentation title |
| `theme` | string | No | Slidev theme name (default: 'default') |
| `config` | object | No | Custom Slidev configuration |
| `ttl` | number | No | Time to live in milliseconds (default: 1 hour) |
| `customCSS` | string | No | Custom CSS styles |
| `frontmatter` | object | No | Additional frontmatter properties |

### Example with Custom Configuration

```json
{
  "content": "# Welcome\n\nThis is my presentation\n\n---\n\n# Slide 2\n\nMore content here",
  "title": "My Custom Presentation",
  "theme": "seriph",
  "config": {
    "aspectRatio": "16/9",
    "canvasWidth": 980,
    "highlighter": "shiki",
    "lineNumbers": true
  },
  "customCSS": ".slidev-page { background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); }",
  "frontmatter": {
    "background": "https://source.unsplash.com/1920x1080/?nature",
    "class": "text-center"
  },
  "ttl": 7200000
}
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Validation Error",
  "message": "Content is required",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "req_abc123"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `TOO_MANY_REQUESTS`: Rate limit exceeded
- `SERVICE_UNAVAILABLE`: Service is unhealthy
- `INSUFFICIENT_RESOURCES`: No available resources
- `INTERNAL_ERROR`: Unexpected server error

## Monitoring

### Health Endpoints

- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Metrics

- `GET /api/stats` - Service and system statistics

### Logging

Logs are written to:
- Console (with colors in development)
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## Security

- **Rate Limiting**: Configurable per-IP rate limits
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers and CSP
- **Input Validation**: Joi schema validation
- **Content Sanitization**: Markdown content sanitization
- **Resource Limits**: Memory and disk usage monitoring

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment Variables

```bash
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0
MAX_CONCURRENT=20
DEFAULT_TTL=1800000
RATE_LIMIT_MAX=200
LOG_LEVEL=warn
```

### Process Management

Use PM2 or similar process manager:

```json
{
  "name": "slidev-api",
  "script": "dist/index.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Development

### Project Structure

```
src/
├── config.ts          # Configuration management
├── error-handler.ts   # Error handling middleware
├── health.ts          # Health monitoring
├── logger.ts          # Logging setup
├── port-manager.ts    # Port allocation
├── presentation-manager.ts  # Core presentation logic
├── project-generator.ts     # Project creation
├── routes.ts          # API routes
├── server.ts          # Express server setup
├── types.ts           # TypeScript types
├── validation.ts      # Request validation
└── index.ts           # Entry point
```

### Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run linting
pnpm lint
```

## License

MIT License - see LICENSE file for details.
