# OGIM User Guide (Updated)

This guide is prepared for the end user (operator/engineer).

## 1) Quick start

1. Log in to the portal (`Dashboard`).
2. Check the Stream connection status:
   - `WebSocket`
   - `SSE (fallback)`
   - `Polling fallback`
3. Go to the `Alerts` page for alerts.

## 2) Alert management

- View open/resolved alerts
- Acknowledge an alert (`Acknowledge`)
- Correlation analysis:
  - Grouping alerts in Correlation
- RCA:
  - Run root cause analysis on a selected alert

## 3) Data quality and Lineage

The `Data Quality` page:
- Indicators:
  - `overall_score`, `completeness`, `validity`, `timeliness`, `consistency`
- Displaying lineage:
  - Number of nodes/edges and the components of the data path
- Automatic report:
  - `Generate Auto Report`

## 4) Advanced reporting and BI

- The `Report Builder` page (`/report-builder`):
  - Select dimensions/measures
  - Chart and CSV export
  - Power BI / Tableau connection
- The `Reports` page: Standard daily/weekly/monthly reports

## 5) Workflow Automation

The `Workflow` page:
- Build a step-by-step workflow
- Define dependencies between steps
- Manual run (`Run Now`)
- View the run history

## 6) Digital Twin / 3D / AR

- The `3D Visualization` page:
  - View the well, equipment, Risk Zone
- The `AR Integration` page:
  - Real AR overlay payload
  - Run a What-if scenario and view the predicted KPIs

## 7) Mobile app

`mobile/app`:
- Login with JWT
- Push Notification for critical alerts
- Offline mode (Alerts + Wells)
- Operation queue and sync after the connection is restored

## 8) Security and executive KPIs

- The `Security` page (`/security`): SIEM events, Zero Trust, threat detection
- The `APM` page (`/performance`): Performance dashboard + executive KPIs
- KPIs: Latency P95, Uptime, Adoption, False Positive Rate
- API: `GET /kpi/summary`

