"""
Direct Work Order creation script (without alert)
"""
import sys
import os
import requests
import json
from datetime import datetime

# Configuration
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
ERP_SERVICE_URL = os.getenv("ERP_SERVICE_URL", "http://localhost:8010")

# Test credentials
TEST_USERNAME = os.getenv("TEST_USERNAME", "admin")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "admin123")


def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/api/auth/token",
            data={
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Authentication failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None


def create_work_order_direct(token: str, erp_type: str = "sap"):
    """Create work order directly"""
    work_order_data = {
        "equipment_id": "PUMP-001",
        "well_name": "PROD-001",
        "issue_description": "High pressure detected - requires immediate maintenance",
        "priority": "critical",
        "work_type": "repair",
        "estimated_duration": 120,
        "required_skills": ["mechanical", "electrical"],
        "parts_required": ["seal-kit", "bearing-set"]
    }
    
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/api/erp-integration/work-orders",
            params={"erp_type": erp_type},
            json=work_order_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Work Order created successfully!")
            print(json.dumps(data, indent=2, default=str))
            return data
        else:
            print(f"❌ Failed to create work order: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating work order: {e}")
        return None


def main():
    """Main function"""
    print("=" * 60)
    print("OGIM - Direct Work Order Creation Script")
    print("=" * 60)
    print()
    
    # Get authentication token
    print("Authenticating...")
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed. Exiting.")
        return
    print("✅ Authentication successful")
    print()
    
    # Create work order
    print("Creating Work Order...")
    work_order = create_work_order_direct(token, "sap")
    
    if work_order:
        print()
        print("=" * 60)
        print("✅ SUCCESS!")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("❌ FAILED")
        print("=" * 60)


if __name__ == "__main__":
    main()

