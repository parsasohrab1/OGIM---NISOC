"""
Script to create a test Work Order from an Alert
"""
import sys
import os
import requests
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configuration
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
ERP_SERVICE_URL = os.getenv("ERP_SERVICE_URL", "http://localhost:8010")
ALERT_SERVICE_URL = os.getenv("ALERT_SERVICE_URL", "http://localhost:8004")

# Test credentials (adjust as needed)
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


def create_test_alert(token: str):
    """Create a test alert"""
    alert_id = f"TEST-ALERT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    alert_data = {
        "alert_id": alert_id,
        "timestamp": datetime.utcnow().isoformat(),
        "severity": "critical",
        "status": "open",
        "well_name": "PROD-001",
        "sensor_id": "SENSOR-001",
        "message": "High pressure detected - requires maintenance",
        "rule_name": "pressure_threshold_exceeded"
    }
    
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/api/alert/alerts",
            json=alert_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Test alert created: {alert_id}")
            return alert_id
        else:
            print(f"❌ Failed to create alert: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating alert: {e}")
        return None


def create_work_order_from_alert(token: str, alert_id: str, erp_type: str = "sap"):
    """Create work order from alert"""
    try:
        response = requests.post(
            f"{API_GATEWAY_URL}/api/alert/alerts/{alert_id}/create-work-order",
            params={"erp_type": erp_type},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Work Order created successfully!")
            print(f"   Work Order ID: {data.get('work_order_id')}")
            print(f"   ERP System: {data.get('erp_system')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Alert ID: {data.get('alert_id')}")
            return data
        else:
            print(f"❌ Failed to create work order: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating work order: {e}")
        return None


def connect_erp_system(token: str, erp_type: str = "sap"):
    """Connect to ERP system (mock connection for testing)"""
    try:
        # For testing, we'll use mock connection
        # In production, you would provide real credentials
        config = {
            "erp_type": erp_type,
            "base_url": f"https://mock-{erp_type}.example.com",
            "username": "test_user",
            "password": "test_pass",
            "client_id": "test_client",
            "client_secret": "test_secret"
        }
        
        response = requests.post(
            f"{API_GATEWAY_URL}/api/erp-integration/erp/connect",
            json=config,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            print(f"✅ Connected to {erp_type.upper()} ERP system (mock)")
            return True
        else:
            print(f"⚠️  ERP connection failed (this is OK for testing with mock): {response.status_code}")
            # For testing, we can continue even if connection fails
            # because the ERP service might use mock connectors
            return True
    except Exception as e:
        print(f"⚠️  ERP connection error (continuing with mock): {e}")
        return True  # Continue with mock


def main():
    """Main function"""
    print("=" * 60)
    print("OGIM - Test Work Order Creation Script")
    print("=" * 60)
    print()
    
    # Step 1: Get authentication token
    print("Step 1: Authenticating...")
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed. Exiting.")
        return
    print("✅ Authentication successful")
    print()
    
    # Step 2: Connect to ERP (optional for testing)
    print("Step 2: Connecting to ERP system...")
    connect_erp_system(token, "sap")
    print()
    
    # Step 3: Create test alert
    print("Step 3: Creating test alert...")
    alert_id = create_test_alert(token)
    if not alert_id:
        print("❌ Failed to create test alert. Exiting.")
        return
    print()
    
    # Step 4: Create work order from alert
    print("Step 4: Creating Work Order from alert...")
    work_order = create_work_order_from_alert(token, alert_id, "sap")
    print()
    
    if work_order:
        print("=" * 60)
        print("✅ SUCCESS: Work Order created successfully!")
        print("=" * 60)
        print(json.dumps(work_order, indent=2, default=str))
    else:
        print("=" * 60)
        print("❌ FAILED: Could not create Work Order")
        print("=" * 60)
        print("\nTroubleshooting:")
        print("1. Make sure ERP Integration Service is running")
        print("2. Check that ERP system is connected")
        print("3. Verify alert exists in database")


if __name__ == "__main__":
    main()

