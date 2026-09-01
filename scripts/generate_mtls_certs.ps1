# Generate mTLS certificates for inter-service communication (PowerShell)
# تولید گواهینامه‌های mTLS برای ارتباطات بین میکروسرویس‌ها

$ErrorActionPreference = "Stop"

$CERT_DIR = if ($env:CERT_DIR) { $env:CERT_DIR } else { ".\backend\certs" }
$CA_KEY = Join-Path $CERT_DIR "ca.key"
$CA_CERT = Join-Path $CERT_DIR "ca.crt"
$CLIENT_KEY = Join-Path $CERT_DIR "client.key"
$CLIENT_CERT = Join-Path $CERT_DIR "client.crt"
$SERVER_KEY = Join-Path $CERT_DIR "server.key"
$SERVER_CERT = Join-Path $CERT_DIR "server.crt"

# Create cert directory
New-Item -ItemType Directory -Force -Path $CERT_DIR | Out-Null

Write-Host "Generating mTLS certificates..." -ForegroundColor Green
Write-Host "Certificate directory: $CERT_DIR" -ForegroundColor Cyan

# Check if OpenSSL is available
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
    Write-Host "Error: OpenSSL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install OpenSSL or use WSL/Linux to generate certificates" -ForegroundColor Yellow
    exit 1
}

# Generate CA private key
Write-Host "1. Generating CA private key..." -ForegroundColor Yellow
& openssl genrsa -out $CA_KEY 4096

# Generate CA certificate
Write-Host "2. Generating CA certificate..." -ForegroundColor Yellow
& openssl req -new -x509 -days 3650 -key $CA_KEY -out $CA_CERT `
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=OGIM-CA"

# Generate client private key
Write-Host "3. Generating client private key..." -ForegroundColor Yellow
& openssl genrsa -out $CLIENT_KEY 2048

# Generate client certificate signing request
Write-Host "4. Generating client certificate signing request..." -ForegroundColor Yellow
& openssl req -new -key $CLIENT_KEY -out (Join-Path $CERT_DIR "client.csr") `
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=ogim-client"

# Create extension file for client cert
$clientExt = Join-Path $CERT_DIR "client_ext.conf"
@"
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = clientAuth
"@ | Out-File -FilePath $clientExt -Encoding ASCII

# Sign client certificate with CA
Write-Host "5. Signing client certificate..." -ForegroundColor Yellow
& openssl x509 -req -days 365 -in (Join-Path $CERT_DIR "client.csr") `
    -CA $CA_CERT -CAkey $CA_KEY -CAcreateserial `
    -out $CLIENT_CERT -extensions v3_req -extfile $clientExt

# Generate server private key
Write-Host "6. Generating server private key..." -ForegroundColor Yellow
& openssl genrsa -out $SERVER_KEY 2048

# Generate server certificate signing request
Write-Host "7. Generating server certificate signing request..." -ForegroundColor Yellow
& openssl req -new -key $SERVER_KEY -out (Join-Path $CERT_DIR "server.csr") `
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=ogim-server"

# Create extension file for server cert
$serverExt = Join-Path $CERT_DIR "server_ext.conf"
@"
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = *.ogim.local
IP.1 = 127.0.0.1
"@ | Out-File -FilePath $serverExt -Encoding ASCII

# Sign server certificate with CA
Write-Host "8. Signing server certificate..." -ForegroundColor Yellow
& openssl x509 -req -days 365 -in (Join-Path $CERT_DIR "server.csr") `
    -CA $CA_CERT -CAkey $CA_KEY -CAcreateserial `
    -out $SERVER_CERT -extensions v3_req -extfile $serverExt

# Clean up CSR and extension files
Remove-Item (Join-Path $CERT_DIR "*.csr") -ErrorAction SilentlyContinue
Remove-Item $clientExt, $serverExt -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✓ mTLS certificates generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Certificate files:" -ForegroundColor Cyan
Write-Host "  CA Certificate: $CA_CERT"
Write-Host "  CA Private Key: $CA_KEY"
Write-Host "  Client Certificate: $CLIENT_CERT"
Write-Host "  Client Private Key: $CLIENT_KEY"
Write-Host "  Server Certificate: $SERVER_CERT"
Write-Host "  Server Private Key: $SERVER_KEY"
Write-Host ""
Write-Host "To enable mTLS, set these environment variables:" -ForegroundColor Yellow
Write-Host "  `$env:MTLS_ENABLED='true'"
Write-Host "  `$env:MTLS_CERT_DIR='$CERT_DIR'"
Write-Host "  `$env:MTLS_CA_CERT_PATH='$CA_CERT'"
Write-Host "  `$env:MTLS_CLIENT_CERT_PATH='$CLIENT_CERT'"
Write-Host "  `$env:MTLS_CLIENT_KEY_PATH='$CLIENT_KEY'"
Write-Host ""

