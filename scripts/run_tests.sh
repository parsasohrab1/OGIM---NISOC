#!/bin/bash

echo "================================"
echo "OGIM Test Suite"
echo "================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install test dependencies
echo "Installing test dependencies..."
cd backend
pip install -r tests/requirements.txt
pip install -r shared/requirements.txt

echo ""
echo "================================"
echo "Running Unit Tests"
echo "================================"

pytest tests/ -v --cov --cov-report=html --cov-report=term-missing

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

echo ""
echo "Coverage report generated in: backend/htmlcov/index.html"
echo ""

# Deactivate virtual environment
deactivate

exit $TEST_EXIT_CODE

