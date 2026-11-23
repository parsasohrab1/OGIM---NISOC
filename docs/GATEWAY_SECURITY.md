# Gateway Layer Security

## 📋 Summary

This documentation explains how advanced security is implemented in the Gateway layer:
- Stricter Rate Limiting
- mTLS (Mutual TLS) for communication between microservices

## 🛡️ Rate Limiting

### Implemented strategies

#### 1. Sliding Window (default)
- Uses a Redis sorted set
- Automatic removal of old requests
- More accurate than a fixed window

#### 2. Token Bucket
- Configurable refill rate
- Burst support
- Suitable for variable traffic

### Configuring Rate Limits

#### Per-Service Limits
```python
DEFAULT_LIMITS = {
    "default": {"max_requests": 100, "window_seconds": 60},
    "auth": {"max_requests": 10, "window_seconds": 60},  # stricter
    "command-control": {"max_requests": 50, "window_seconds": 60},
    "ml-inference": {"max_requests": 200, "window_seconds": 60},
    "data-ingestion": {"max_requests": 1000, "window_seconds": 60},
}
```

#### Per-User Limits
```python
USER_LIMITS = {
    "system_admin": {"max_requests": 500, "window_seconds": 60},
    "data_engineer": {"max_requests": 300, "window_seconds": 60},
    "field_operator": {"max_requests": 200, "window_seconds": 60},
    "viewer": {"max_requests": 100, "window_seconds": 60},
}
```

### Response Headers

Rate limit headers in the response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
Retry-After: 60
```

### Usage

```python
# In the API Gateway
from advanced_rate_limiter import get_rate_limiter, RateLimitConfig

rate_limiter = get_rate_limiter(redis_url=settings.RATE_LIMIT_REDIS_URL)

# Check rate limit
allowed, info = await rate_limiter.check_rate_limit(
    identifier=user_id or client_ip,
    endpoint=service_name,
    max_requests=100,
    window_seconds=60,
    strategy="sliding_window"
)
```

## 🔐 mTLS (Mutual TLS)

### Overview

mTLS for securing communication between microservices:
- Each service must present its own certificate
- CA certificate for verification
- Prevents intrusion into the internal network

### Architecture

```
┌─────────────┐                    ┌─────────────┐
│ API Gateway │ ────mTLS──────> │  Service A  │
│ (Client)    │ <───mTLS─────── │  (Server)    │
└─────────────┘                    └─────────────┘
     │                                    │
     │ CA Certificate                     │ CA Certificate
     │ Client Certificate                 │ Server Certificate
     │ Client Private Key                 │ Server Private Key
     └────────────────────────────────────┘
```

### Generating certificates

#### Linux/Mac
```bash
chmod +x scripts/generate_mtls_certs.sh
./scripts/generate_mtls_certs.sh
```

#### Windows (PowerShell)
```powershell
.\scripts\generate_mtls_certs.ps1
```

#### Manual
```bash
# Generate CA
openssl genrsa -out ca.key 4096
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=OGIM-CA"

# Generate Client Certificate
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr \
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=ogim-client"
openssl x509 -req -days 365 -in client.csr -CA ca.crt -CAkey ca.key \
    -CAcreateserial -out client.crt -extensions v3_req \
    -extfile <(echo "[v3_req]"; echo "extendedKeyUsage = clientAuth")

# Generate Server Certificate
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=ogim-server"
openssl x509 -req -days 365 -in server.csr -CA ca.crt -CAkey ca.key \
    -CAcreateserial -out server.crt -extensions v3_req \
    -extfile <(echo "[v3_req]"; echo "extendedKeyUsage = serverAuth")
```

### Configuration

#### Environment Variables
```bash
# Enable mTLS
MTLS_ENABLED=true

# Certificate paths
MTLS_CERT_DIR=./backend/certs
MTLS_CA_CERT_PATH=./backend/certs/ca.crt
MTLS_CLIENT_CERT_PATH=./backend/certs/client.crt
MTLS_CLIENT_KEY_PATH=./backend/certs/client.key

# Server verification
MTLS_VERIFY_SERVER=true
```

#### In code
```python
from mtls_manager import get_mtls_manager

mtls_manager = get_mtls_manager(
    cert_dir=settings.MTLS_CERT_DIR,
    ca_cert_path=settings.MTLS_CA_CERT_PATH,
    client_cert_path=settings.MTLS_CLIENT_CERT_PATH,
    client_key_path=settings.MTLS_CLIENT_KEY_PATH
)

# Get httpx client kwargs
client_kwargs = mtls_manager.get_httpx_client_kwargs(
    verify=settings.MTLS_VERIFY_SERVER
)

# Use in httpx client
async with httpx.AsyncClient(**client_kwargs) as client:
    response = await client.get("https://service:port/endpoint")
```

### Certificate structure

```
backend/certs/
├── ca.crt          # CA Certificate
├── ca.key          # CA Private Key
├── client.crt      # Client Certificate
├── client.key      # Client Private Key
├── server.crt      # Server Certificate
└── server.key      # Server Private Key
```

## ⚙️ Complete configuration

### Rate Limiting
```python
# config.py
RATE_LIMIT_ENABLED: bool = True
RATE_LIMIT_REDIS_URL: Optional[str] = "redis://localhost:6379"
RATE_LIMIT_STRATEGY: str = "sliding_window"  # or "token_bucket"
```

### mTLS
```python
# config.py
MTLS_ENABLED: bool = False  # Enable in production
MTLS_CERT_DIR: Optional[str] = "./backend/certs"
MTLS_CA_CERT_PATH: Optional[str] = None
MTLS_CLIENT_CERT_PATH: Optional[str] = None
MTLS_CLIENT_KEY_PATH: Optional[str] = None
MTLS_VERIFY_SERVER: bool = True
```

## 🚀 Setup

### 1. Generating certificates
```bash
# Linux/Mac
./scripts/generate_mtls_certs.sh

# Windows
.\scripts\generate_mtls_certs.ps1
```

### 2. Set Environment Variables
```bash
export MTLS_ENABLED=true
export MTLS_CERT_DIR=./backend/certs
export MTLS_CA_CERT_PATH=./backend/certs/ca.crt
export MTLS_CLIENT_CERT_PATH=./backend/certs/client.crt
export MTLS_CLIENT_KEY_PATH=./backend/certs/client.key

export RATE_LIMIT_ENABLED=true
export RATE_LIMIT_REDIS_URL=redis://localhost:6379
export RATE_LIMIT_STRATEGY=sliding_window
```

### 3. Setting up Redis (for Rate Limiting)
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Setting up the API Gateway
```bash
cd backend/api-gateway
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📊 Monitoring

### Rate Limit Metrics
- Total requests
- Rate limit violations
- Per-endpoint statistics
- Per-user statistics

### mTLS Metrics
- Certificate validation failures
- mTLS connection attempts
- Certificate expiry warnings

## ✅ Best Practices

### Rate Limiting
1. **Stricter limits for auth endpoints**: 10 requests/minute
2. **Higher limits for admins**: 500 requests/minute
3. **Use Redis for distributed systems**: Shared state
4. **Monitor violations**: Alert on suspicious patterns

### mTLS
1. **Rotate certificates regularly**: Every 90 days
2. **Use strong keys**: 2048+ bits
3. **Verify server certificates**: Always verify
4. **Store keys securely**: Use secrets management
5. **Monitor certificate expiry**: Alert before expiry

## 🔍 Troubleshooting

### Rate Limit Issues
- **429 errors**: Check rate limit configuration
- **Redis connection**: Verify Redis is running
- **Memory fallback**: Check logs for Redis errors

### mTLS Issues
- **Certificate not found**: Check file paths
- **Verification failed**: Check CA certificate
- **Connection refused**: Verify server has mTLS enabled

## 📝 Notes

- Rate limiting in production must use Redis
- mTLS can be disabled in development
- Certificates must be stored in secrets management
- Regular certificate rotation is essential

