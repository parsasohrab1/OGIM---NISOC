#!/bin/bash
# Startup script for frontend web portal

echo "======================================"
echo "Starting OGIM Frontend Web Portal"
echo "======================================"

cd "$(dirname "$0")/../frontend/web"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting development server..."
npm run dev

