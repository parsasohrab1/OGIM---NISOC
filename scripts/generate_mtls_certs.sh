#!/bin/bash
# Generate mTLS certificates for inter-service communication
# تولید گواهینامه‌های mTLS برای ارتباطات بین میکروسرویس‌ها

set -e

CERT_DIR="${CERT_DIR:-./backend/certs}"
CA_KEY="${CERT_DIR}/ca.key"
CA_CERT="${CERT_DIR}/ca.crt"
CLIENT_KEY="${CERT_DIR}/client.key"
CLIENT_CERT="${CERT_DIR}/client.crt"
SERVER_KEY="${CERT_DIR}/server.key"
SERVER_CERT="${CERT_DIR}/server.crt"

# Create cert directory
mkdir -p "$CERT_DIR"

echo "Generating mTLS certificates..."
echo "Certificate directory: $CERT_DIR"

# Generate CA private key
echo "1. Generating CA private key..."
openssl genrsa -out "$CA_KEY" 4096

# Generate CA certificate
echo "2. Generating CA certificate..."
openssl req -new -x509 -days 3650 -key "$CA_KEY" -out "$CA_CERT" \
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=OGIM-CA"

# Generate client private key
echo "3. Generating client private key..."
openssl genrsa -out "$CLIENT_KEY" 2048

# Generate client certificate signing request
echo "4. Generating client certificate signing request..."
openssl req -new -key "$CLIENT_KEY" -out "${CERT_DIR}/client.csr" \
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=ogim-client"

# Sign client certificate with CA
echo "5. Signing client certificate..."
openssl x509 -req -days 365 -in "${CERT_DIR}/client.csr" \
    -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$CLIENT_CERT" -extensions v3_req -extfile <(
        echo "[v3_req]"
        echo "keyUsage = keyEncipherment, dataEncipherment"
        echo "extendedKeyUsage = clientAuth"
    )

# Generate server private key
echo "6. Generating server private key..."
openssl genrsa -out "$SERVER_KEY" 2048

# Generate server certificate signing request
echo "7. Generating server certificate signing request..."
openssl req -new -key "$SERVER_KEY" -out "${CERT_DIR}/server.csr" \
    -subj "/C=US/ST=State/L=City/O=OGIM/CN=ogim-server"

# Sign server certificate with CA
echo "8. Signing server certificate..."
openssl x509 -req -days 365 -in "${CERT_DIR}/server.csr" \
    -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$SERVER_CERT" -extensions v3_req -extfile <(
        echo "[v3_req]"
        echo "keyUsage = keyEncipherment, dataEncipherment"
        echo "extendedKeyUsage = serverAuth"
        echo "subjectAltName = @alt_names"
        echo "[alt_names]"
        echo "DNS.1 = localhost"
        echo "DNS.2 = *.ogim.local"
        echo "IP.1 = 127.0.0.1"
    )

# Clean up CSR files
rm -f "${CERT_DIR}"/*.csr

# Set permissions
chmod 600 "$CA_KEY" "$CLIENT_KEY" "$SERVER_KEY"
chmod 644 "$CA_CERT" "$CLIENT_CERT" "$SERVER_CERT"

echo ""
echo "✓ mTLS certificates generated successfully!"
echo ""
echo "Certificate files:"
echo "  CA Certificate: $CA_CERT"
echo "  CA Private Key: $CA_KEY"
echo "  Client Certificate: $CLIENT_CERT"
echo "  Client Private Key: $CLIENT_KEY"
echo "  Server Certificate: $SERVER_CERT"
echo "  Server Private Key: $SERVER_KEY"
echo ""
echo "To enable mTLS, set these environment variables:"
echo "  MTLS_ENABLED=true"
echo "  MTLS_CERT_DIR=$CERT_DIR"
echo "  MTLS_CA_CERT_PATH=$CA_CERT"
echo "  MTLS_CLIENT_CERT_PATH=$CLIENT_CERT"
echo "  MTLS_CLIENT_KEY_PATH=$CLIENT_KEY"
echo ""

