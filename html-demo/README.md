# 🌐 OGIM Live Demo - HTML Edition

Live and interactive demo of the OGIM system with pure HTML/JavaScript

## 🎯 About

This is a fully operational demo of the OGIM system that:
- ✅ Connects to the Backend API (Real-time)
- ✅ Displays real data
- ✅ Runs without needing a Build or Compile
- ✅ Uses Mock data if the connection is unavailable
- ✅ Is Responsive and Mobile-friendly

## 📁 Files

```
html-demo/
├── index.html          # Main dashboard page
├── wells.html          # Wells page
├── alerts.html         # Alerts page
├── style.css           # CSS styles
├── api.js              # API client and Mock Data
├── app.js              # Main application logic
└── README.md           # This file
```

## 🚀 How to run

### Method 1: With a Python HTTP Server (recommended)

```bash
# Change into the folder
cd html-demo

# Run with Python 3
python -m http.server 8080

# Or with Python 2
python -m SimpleHTTPServer 8080

# Open the browser
# http://localhost:8080
```

### Method 2: With Node.js (http-server)

```bash
# Install http-server (once)
npm install -g http-server

# Run
cd html-demo
http-server -p 8080

# Open the browser
# http://localhost:8080
```

### Method 3: With Live Server (VS Code Extension)

1. Install the "Live Server" extension in VS Code
2. Right-click `index.html`
3. Choose "Open with Live Server"

### Method 4: Directly in the browser (limited)

Just open the `index.html` file in the browser (you may get a CORS error)

## ⚙️ Settings

### Connecting to the Backend

1. Click the settings icon (⚙️) in the menu
2. Enter the API Gateway address:
   ```
   http://localhost:8000
   ```
3. Set the refresh interval (default: 10 seconds)
4. Save the settings

### Modes

**Online mode (Connected):**
- The demo is connected to the backend
- Real data is displayed
- Automatic refresh is enabled

**Offline mode (Mock Data):**
- The demo is not connected to the backend
- Sample (Mock) data is displayed
- The main features still work

## 🎨 Features

### 📊 Dashboard (index.html)
- **Overall statistics:**
  - Number of active wells
  - Active alerts
  - Production rate
  - System health

- **Charts:**
  - Real-time production chart
  - Pressure and temperature chart
  - Time range selection

- **Wells table:**
  - Status of each well
  - Production rate
  - Pressure and temperature
  - Last update

- **Recent alerts:**
  - The 5 most recent alerts
  - Severity level
  - Time of occurrence

### 🛢️ Wells page (wells.html)
- Complete list of wells
- Details of each well
- Dedicated charts
- Performance history

### 🔔 Alerts page (alerts.html)
- Complete list of alerts
- Filter by level and status
- Acknowledge and Resolve actions
- Search within alerts

## 🔧 Technologies

- **HTML5** - Page structure
- **CSS3** - Styles and animations
- **JavaScript (Vanilla)** - Application logic
- **Chart.js** - Charts
- **Font Awesome** - Icons
- **Fetch API** - Communication with the Backend

## 📡 API Endpoints

The demo uses these API endpoints:

```javascript
// Health Check
GET /health

// Statistics
GET /api/statistics

// Tags/Wells
GET /api/tag-catalog/tags
GET /api/tag-catalog/tags/{id}

// Sensor Data
GET /api/data-ingestion/sensor-data?limit=20

// Alerts
GET /api/alert/alerts?status=open
POST /api/alert/alerts/{id}/acknowledge
POST /api/alert/alerts/{id}/resolve

// Auth (optional)
POST /api/auth/token
GET /api/auth/users/me
```

## 🔐 Authentication (optional)

If your backend requires authentication:

```javascript
// In the browser Console
api.login('admin', 'Admin@123')
  .then(() => {
    console.log('Logged in successfully');
    refreshData();
  });
```

The token is stored automatically in localStorage.

## 🐛 Troubleshooting

### Problem: CORS Error

**Solution:**
1. Your backend must enable CORS:
```python
CORS_ORIGINS = ["http://localhost:8080"]
```

2. Or run Chrome with the flag:
```bash
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome"
```

### Problem: Cannot connect to backend

**Solution:**
1. Make sure the backend is running:
```bash
curl http://localhost:8000/health
```

2. Check the settings (⚙️ Settings)

3. The demo automatically falls back to Mock mode

### Problem: Charts not showing

**Solution:**
1. Make sure Chart.js has loaded
2. Check the browser Console for errors
3. Refresh the page

## 📱 Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 (requires a Polyfill)

## 🎯 Notes

### Auto-Refresh
- Default: every 10 seconds
- Adjustable from 5 to 60 seconds
- Change it in the Settings tab

### Mock Data
- Activated when the backend is unavailable
- Random but realistic data
- Suitable for Demo and Testing

### Performance
- Charts with light Animation
- Update optimized with Chart.js
- Low memory usage

## 📊 Sample data

The demo includes 4 wells:

| Well | Type | Production (bbl/day) |
|-----|-----|-----------------|
| PROD-001 | Production | 800-1500 |
| PROD-002 | Production | 800-1500 |
| DEV-001 | Development | 500-1000 |
| OBS-001 | Observation | 0 |

## 🚀 Deployment

### GitHub Pages

```bash
# Deploy only the contents of html-demo
git subtree push --prefix html-demo origin gh-pages
```

### Netlify/Vercel

1. Select the `html-demo` folder as the root
2. Build command: (empty)
3. Publish directory: `.`

### Docker

```dockerfile
FROM nginx:alpine
COPY html-demo/ /usr/share/nginx/html/
EXPOSE 80
```

```bash
docker build -t ogim-demo .
docker run -p 8080:80 ogim-demo
```

## 🔗 Related links

- **Main project:** [OGIM Repository](../)
- **Backend documentation:** [docs/](../docs/)
- **API Docs:** http://localhost:8000/docs

## 📝 License

MIT License - same as the main project

---

## 🎉 Quick start

```bash
# 1. Clone the project
git clone https://github.com/parsasohrab1/OGIM---Oil-Gas-Intelligent-Monitoring.git

# 2. Enter the demo folder
cd OGIM---Oil-Gas-Intelligent-Monitoring/html-demo

# 3. Run the backend (another terminal)
cd ../
docker-compose -f docker-compose.dev.yml up -d

# 4. Run the demo
python -m http.server 8080

# 5. Open the browser
# http://localhost:8080
```

---

**Built with ❤️ for the oil and gas industry**

Version: 1.0.0 | Date: November 2025

