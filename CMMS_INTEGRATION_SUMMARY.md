# ✅ Maintenance Systems (CMMS) Integration - Implementation Summary

## 📊 Summary

Integration with maintenance systems (CMMS) for automatic and manual Work Order issuance from Alerts was implemented successfully.

## 🎯 Implemented features

### 1. Automatic Work Order creation
- ✅ **Auto-create for Critical Alerts**: Automatic Work Order creation for critical Alerts
- ✅ **Configurable**: Configurable through an environment variable
- ✅ **Background Processing**: Background processing without affecting performance

### 2. Manual Work Order creation
- ✅ **Manual Creation**: "Create Work Order" button in the Alerts dashboard
- ✅ **One-click Creation**: Creation with one click
- ✅ **Status Display**: Display of the Work Order ID after creation
- ✅ **Duplicate Prevention**: Prevention of duplicate Work Order creation

### 3. Integration with ERP Systems
- ✅ **SAP Support**: SAP support
- ✅ **Oracle Support**: Oracle support
- ✅ **Extensible**: Extensible to other systems

### 4. UI/UX
- ✅ **Button in Dashboard**: Button on the Alerts page
- ✅ **Visual Feedback**: Display of the Work Order ID
- ✅ **Loading States**: Display of the creating state
- ✅ **Error Handling**: Error handling

## 📁 Files created/updated

### Backend
- `backend/alert-service/main.py` - updated (new endpoint)
- `backend/erp-integration-service/main.py` - existing (auto-create endpoint)

### Frontend
- `frontend/web/src/pages/Alerts.tsx` - updated (button and logic)
- `frontend/web/src/pages/Alerts.css` - updated (button style)
- `frontend/web/src/api/services.ts` - updated (API client)

## 🔌 API Endpoints

### Creating a Work Order from an Alert
```
POST /api/alert/alerts/{alert_id}/create-work-order?erp_type=sap
```

**Response:**
```json
{
  "message": "Work order created successfully",
  "work_order_id": "SAP-WO-20250115103045",
  "erp_system": "SAP",
  "status": "created",
  "alert_id": "ALERT-001"
}
```

### Automatic creation (from the Alert Service)
```
POST /api/erp-integration/work-orders/auto-create?alert_id={alert_id}&erp_type=sap
```

## 🎨 UI Components

### Create Work Order button
- **Location**: On the Alerts page, next to the Acknowledge and Resolve buttons
- **Style**: Gradient purple background
- **Behavior**: 
  - Shown only for Alerts that do not have a Work Order
  - Shows "Creating..." while creating
  - Shows the Work Order ID after successful creation

### Work Order Info Panel
- **Location**: In the Alert Card
- **Content**: Display of the Work Order ID
- **Style**: Purple border and background

## ⚙️ Configuration

### Environment Variables
```bash
# Enable ERP integration
ERP_INTEGRATION_ENABLED=true

# ERP service URL
ERP_SERVICE_URL=http://erp-integration-service:8010

# Default ERP system
ERP_DEFAULT_SYSTEM=sap  # sap, oracle, maximo

# Automatic creation for critical Alerts
ERP_AUTO_CREATE_WORK_ORDERS=false  # true to enable
```

### Connecting to an ERP System
```bash
POST /api/erp-integration/erp/connect
{
  "erp_type": "sap",
  "base_url": "https://sap.example.com",
  "username": "user",
  "password": "pass",
  "client_id": "client123",
  "client_secret": "secret123"
}
```

## 🔄 Workflow

### Automatic creation
```
Alert Created (Critical)
    │
    ▼
Check ERP_AUTO_CREATE_WORK_ORDERS
    │
    ▼
Call ERP Service
    │
    ▼
Create Work Order in SAP/Oracle
    │
    ▼
Link Work Order ID to Alert
    │
    ▼
Update Alert.erp_work_order_id
```

### Manual creation
```
User clicks "Create Work Order"
    │
    ▼
Check if Work Order exists
    │
    ▼
Call Alert Service endpoint
    │
    ▼
Alert Service calls ERP Service
    │
    ▼
Create Work Order
    │
    ▼
Update Alert and return Work Order ID
    │
    ▼
Display in UI
```

## 📊 Work Order data

### Work Order Request
```json
{
  "alert_id": "ALERT-001",
  "equipment_id": "PUMP-001",
  "well_name": "PROD-001",
  "issue_description": "High pressure detected",
  "priority": "critical",
  "work_type": "repair",
  "estimated_duration": 120
}
```

### Work Order Response
```json
{
  "work_order_id": "SAP-WO-20250115103045",
  "erp_system": "SAP",
  "status": "created",
  "created_at": "2025-01-15T10:30:45Z",
  "erp_reference": "WOSAP-WO-20250115103045",
  "message": "Work order created successfully in SAP"
}
```

## ✅ Status

- ✅ Work Order creation endpoint in the Alert Service
- ✅ Integration with the ERP Service
- ✅ Button in the Alerts dashboard
- ✅ API client in the frontend
- ✅ CSS styles
- ✅ Error handling
- ✅ Work Order ID display
- ✅ Duplicate creation prevention
- ✅ Automatic creation for critical Alerts (configurable)

## 🎯 Usage

### Manually creating a Work Order
1. Go to the Alerts page
2. Find the desired Alert
3. Click the "Create Work Order" button
4. The Work Order ID is displayed

### Enabling automatic creation
```bash
# In .env or environment variables
ERP_AUTO_CREATE_WORK_ORDERS=true
ERP_DEFAULT_SYSTEM=sap
```

### Connecting to an ERP System
```bash
# First you must connect to the ERP System
POST /api/erp-integration/erp/connect
{
  "erp_type": "sap",
  "base_url": "https://sap.example.com",
  ...
}
```

## 📝 Notes

- A Work Order is created only once for each Alert
- If a Work Order exists, the button is not displayed
- Automatic creation is enabled only for critical Alerts (if configured)
- You can choose the ERP system through a query parameter (sap, oracle)

## 🔍 Troubleshooting

### Work Order is not created
1. Check that the ERP Service is running
2. Check that you are connected to the ERP System
3. Check the Alert Service and ERP Service logs

### Button is not displayed
1. Check that the Alert does not have a Work Order
2. Check that the Alert is in the open or acknowledged state

### Timeout error
- Check that the ERP Service is reachable
- The default Timeout is 30 seconds

