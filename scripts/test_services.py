#!/usr/bin/env python3
"""
Test script to verify all backend services are running
"""
import requests
import sys
from typing import Dict, List

SERVICES = {
    "API Gateway": "http://localhost:8000/health",
    "Auth Service": "http://localhost:8001/health",
    "Data Ingestion Service": "http://localhost:8002/health",
    "ML Inference Service": "http://localhost:8003/health",
    "Alert Service": "http://localhost:8004/health",
    "Reporting Service": "http://localhost:8005/health",
    "Command Control Service": "http://localhost:8006/health",
    "Tag Catalog Service": "http://localhost:8007/health",
    "Digital Twin Service": "http://localhost:8008/health",
}


def test_service(name: str, url: str) -> bool:
    """Test if a service is responding"""
    try:
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            print(f"✓ {name}: OK")
            return True
        else:
            print(f"✗ {name}: HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"✗ {name}: Connection refused")
        return False
    except requests.exceptions.Timeout:
        print(f"✗ {name}: Timeout")
        return False
    except Exception as e:
        print(f"✗ {name}: Error - {e}")
        return False


def main():
    print("=" * 60)
    print("OGIM Service Health Check")
    print("=" * 60)
    print()
    
    results = []
    for name, url in SERVICES.items():
        results.append(test_service(name, url))
    
    print()
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} services healthy")
    print("=" * 60)
    
    if passed == total:
        print("All services are healthy! ✓")
        sys.exit(0)
    else:
        print("Some services are not responding. Please check Docker containers.")
        sys.exit(1)


if __name__ == "__main__":
    main()

