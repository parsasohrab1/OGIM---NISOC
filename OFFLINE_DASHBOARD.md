# Live Dashboard Without Internet

Run the Maroun field interface fully and live **without internet** and **without backend services**.

## Prerequisite (once, with internet)

```powershell
cd frontend\web
npm install
```

After installing `node_modules`, internet is no longer needed.

## Running

From the project root:

```powershell
.\start_offline_dashboard.ps1
```

Or:

```powershell
cd frontend\web
npm run dev:offline
```

Then open: [http://127.0.0.1:3000](http://127.0.0.1:3000)

## What is live?

| Section | Data source |
|-----|-----------|
| Dashboard / wells / SCADA | Local `marunField` simulation (periodic updates) |
| Live stream | `localRealtimeStream` every 4 seconds |
| Alerts + SMS | `marunAlerts` + local browser queue |
| Equipment remaining useful life | `marunRul` |
| Smart operator | Local logic in the dashboard |

An "Offline live" badge is shown in the top bar.

## Building a portable version (optional)

```powershell
cd frontend\web
npm run build:offline
npm run preview:offline
```

After opening it once in the browser, the Service Worker caches the static assets.

## Note

- Offline mode is enabled with `VITE_OFFLINE_LIVE=true` (the `.env.offline` file).
- If a local backend is reachable but the internet is down, it automatically switches to the local simulation after a few seconds.
