#!/bin/bash

echo "================================"
echo "OGIM Production Deployment"
echo "================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl not found. Please install kubectl.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ kubectl found${NC}"

# Check kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}✗ Cannot connect to Kubernetes cluster.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"

echo ""
echo "================================"
echo "Step 1: Create Namespace"
echo "================================"

kubectl create namespace ogim-prod --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace created/verified${NC}"

echo ""
echo "================================"
echo "Step 2: Create Secrets"
echo "================================"

# PostgreSQL Secret
kubectl create secret generic postgres-secret \
  --from-literal=username=ogim_user \
  --from-literal=password=$(openssl rand -base64 32) \
  --namespace=ogim-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# TimescaleDB Secret
kubectl create secret generic timescale-secret \
  --from-literal=username=ogim_user \
  --from-literal=password=$(openssl rand -base64 32) \
  --namespace=ogim-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# Application Secret
kubectl create secret generic app-secret \
  --from-literal=secret-key=$(openssl rand -base64 48) \
  --namespace=ogim-prod \
  --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✓ Secrets created${NC}"

echo ""
echo "================================"
echo "Step 3: Deploy Infrastructure"
echo "================================"

# Deploy databases
kubectl apply -f infrastructure/kubernetes/postgres-deployment.yaml -n ogim-prod
kubectl apply -f infrastructure/kubernetes/timescaledb-deployment.yaml -n ogim-prod
kubectl apply -f infrastructure/kubernetes/redis-deployment.yaml -n ogim-prod
kubectl apply -f infrastructure/kubernetes/kafka-deployment.yaml -n ogim-prod

echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ogim-prod --timeout=300s
kubectl wait --for=condition=ready pod -l app=timescaledb -n ogim-prod --timeout=300s

echo -e "${GREEN}✓ Infrastructure deployed${NC}"

echo ""
echo "================================"
echo "Step 4: Initialize Database"
echo "================================"

# Run database initialization job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-init
  namespace: ogim-prod
spec:
  template:
    spec:
      containers:
      - name: db-init
        image: python:3.11-slim
        command: ["sh", "-c"]
        args:
          - |
            pip install sqlalchemy psycopg2-binary
            # Copy init script and run
            python init_db.py
      restartPolicy: OnFailure
  backoffLimit: 3
EOF

kubectl wait --for=condition=complete job/db-init -n ogim-prod --timeout=300s
echo -e "${GREEN}✓ Database initialized${NC}"

echo ""
echo "================================"
echo "Step 5: Deploy Backend Services"
echo "================================"

kubectl apply -f infrastructure/kubernetes/api-gateway-deployment.yaml -n ogim-prod

# Wait for API Gateway
kubectl wait --for=condition=ready pod -l app=api-gateway -n ogim-prod --timeout=300s

echo -e "${GREEN}✓ Backend services deployed${NC}"

echo ""
echo "================================"
echo "Step 6: Verify Deployment"
echo "================================"

echo "Checking pod status..."
kubectl get pods -n ogim-prod

echo ""
echo "Checking services..."
kubectl get svc -n ogim-prod

echo ""
echo "================================"
echo "✓ Production Deployment Complete!"
echo "================================"
echo ""
echo "To access the API Gateway:"
echo "  kubectl port-forward svc/api-gateway 8000:8000 -n ogim-prod"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/api-gateway -n ogim-prod"
echo ""
echo "To scale services:"
echo "  kubectl scale deployment api-gateway --replicas=3 -n ogim-prod"
echo ""
echo "================================"

