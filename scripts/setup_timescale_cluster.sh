#!/bin/bash
# Setup TimescaleDB Multi-node Cluster
# This script configures the cluster after all nodes are running

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ACCESS_NODE="${TIMESCALE_ACCESS_NODE:-timescaledb-access:5432}"
DATA_NODES="${TIMESCALE_DATA_NODES:-timescaledb-data1:5432,timescaledb-data2:5432,timescaledb-data3:5432}"
DB_NAME="${POSTGRES_DB:-ogim_tsdb}"
DB_USER="${POSTGRES_USER:-ogim_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-ogim_password}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TimescaleDB Multi-node Cluster Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Parse access node
ACCESS_HOST=$(echo $ACCESS_NODE | cut -d: -f1)
ACCESS_PORT=$(echo $ACCESS_NODE | cut -d: -f2)

echo -e "${YELLOW}Access Node:${NC} $ACCESS_HOST:$ACCESS_PORT"
echo -e "${YELLOW}Data Nodes:${NC} $DATA_NODES"
echo ""

# Wait for access node to be ready
echo -e "${YELLOW}Waiting for access node to be ready...${NC}"
until PGPASSWORD=$DB_PASSWORD psql -h $ACCESS_HOST -p $ACCESS_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
    echo "Waiting for access node..."
    sleep 2
done
echo -e "${GREEN}✓ Access node is ready${NC}"
echo ""

# Enable TimescaleDB extension on access node
echo -e "${YELLOW}Enabling TimescaleDB extension on access node...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $ACCESS_HOST -p $ACCESS_PORT -U $DB_USER -d $DB_NAME <<EOF
CREATE EXTENSION IF NOT EXISTS timescaledb;
EOF
echo -e "${GREEN}✓ TimescaleDB extension enabled${NC}"
echo ""

# Add data nodes
IFS=',' read -ra NODES <<< "$DATA_NODES"
for node in "${NODES[@]}"; do
    NODE_HOST=$(echo $node | cut -d: -f1)
    NODE_PORT=$(echo $node | cut -d: -f2)
    NODE_NAME=$(echo $NODE_HOST | sed 's/timescaledb-//')
    
    echo -e "${YELLOW}Waiting for data node $NODE_NAME to be ready...${NC}"
    until PGPASSWORD=$DB_PASSWORD psql -h $NODE_HOST -p $NODE_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
        echo "Waiting for $NODE_NAME..."
        sleep 2
    done
    echo -e "${GREEN}✓ Data node $NODE_NAME is ready${NC}"
    
    # Enable TimescaleDB extension on data node
    echo -e "${YELLOW}Enabling TimescaleDB extension on $NODE_NAME...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $NODE_HOST -p $NODE_PORT -U $DB_USER -d $DB_NAME <<EOF
CREATE EXTENSION IF NOT EXISTS timescaledb;
EOF
    
    # Add data node to cluster
    echo -e "${YELLOW}Adding $NODE_NAME to cluster...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $ACCESS_HOST -p $ACCESS_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT add_data_node(
    '$NODE_NAME',
    host => '$NODE_HOST',
    port => $NODE_PORT,
    database => '$DB_NAME',
    user => '$DB_USER',
    password => '$DB_PASSWORD'
);
EOF
    echo -e "${GREEN}✓ Data node $NODE_NAME added to cluster${NC}"
    echo ""
done

# List data nodes
echo -e "${YELLOW}Cluster Status:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $ACCESS_HOST -p $ACCESS_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT node_name, host, port, database 
FROM timescaledb_information.data_nodes;
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cluster setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

