# Performance Tuning — OGIM

Guide to optimizing DB / API / Cache for high load.

## 1. Database Connection Pools

| Variable | Default | Description |
|-------|---------|--------|
| `DATABASE_POOL_SIZE` | 20 | pool PostgreSQL |
| `DATABASE_MAX_OVERFLOW` | 40 | Extra connections |
| `TIMESCALE_CONNECTION_POOL_SIZE` | 30 | pool TimescaleDB |
| `DATABASE_POOL_RECYCLE_SECONDS` | 1800 | Connection recycling |

## 2. API Gateway

| Variable | Default | Description |
|-------|---------|--------|
| `API_GATEWAY_HTTP_KEEPALIVE_CONNECTIONS` | 100 | keep-alive |
| `API_GATEWAY_HTTP_MAX_CONNECTIONS` | 300 | Connection limit |
| `CACHE_TTL_SECONDS` | 30 | GET cache TTL |
| `CACHE_MAX_ENTRIES` | 2048 | Max cache entries |

### Cached paths

- `/api/reporting/bi/metadata`
- `/api/reporting/workflows/templates`
- `/api/digital-twin/wells`
- `/api/tag-catalog/tags`

Monitoring: `GET /kpi/cache-stats` — header `X-Cache: HIT|MISS`

Invalidation: `POST /kpi/cache/invalidate` with an optional body `{ "prefix": "..." }` (without a prefix the whole cache is cleared).

## 3. Rate Limiting & Security

- `RATE_LIMIT_ENABLED=true`
- `API_SECURITY_ENABLE_INPUT_HARDENING=true`
- Module: `backend/shared/input_validation.py`

## 4. Production

1. Redis for rate limiting in multi-replica
2. Read replica for analytics
3. TimescaleDB compression
4. Horizontal scaling for the gateway and ingestion
