// Main Application Logic
let productionChart = null;
let pressureTempChart = null;
let refreshInterval = null;
let isConnected = false;
let useMockData = false;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('OGIM Demo App Started');
    
    // Load settings
    loadSettings();
    
    // Update datetime
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Check backend connection
    await checkConnection();
    
    // Initialize charts
    initCharts();
    
    // Load initial data
    await loadDashboardData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    console.log('Initialization complete');
});

// Check backend connection
async function checkConnection() {
    const statusEl = document.getElementById('connectionStatus');
    
    try {
        isConnected = await api.healthCheck();
        
        if (isConnected) {
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '<i class="fas fa-circle"></i><span>متصل به سرور</span>';
            useMockData = false;
            console.log('Connected to backend');
        } else {
            throw new Error('Backend not available');
        }
    } catch (error) {
        isConnected = false;
        useMockData = true;
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = '<i class="fas fa-circle"></i><span>حالت آفلاین (داده نمونه)</span>';
        console.warn('Using mock data');
    }
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    const dateTimeStr = now.toLocaleDateString('fa-IR', options);
    document.getElementById('datetime').textContent = dateTimeStr;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStatistics(),
            loadWellsData(),
            loadAlertsData(),
            updateCharts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load statistics
async function loadStatistics() {
    try {
        let stats;
        
        if (useMockData) {
            stats = mockData.getStatistics();
        } else {
            stats = await api.getStatistics();
        }
        
        document.getElementById('totalWells').textContent = stats.active_wells || stats.total_wells || 4;
        document.getElementById('activeAlerts').textContent = stats.active_alerts || 5;
        document.getElementById('productionRate').textContent = formatNumber(stats.production_rate || 4500);
        document.getElementById('systemHealth').textContent = `${(stats.system_health || 98.5).toFixed(1)}%`;
        
        // Update badge
        document.getElementById('alertBadge').textContent = stats.active_alerts || 5;
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Fallback to mock data
        const stats = mockData.getStatistics();
        document.getElementById('totalWells').textContent = stats.total_wells;
        document.getElementById('activeAlerts').textContent = stats.active_alerts;
        document.getElementById('productionRate').textContent = formatNumber(stats.production_rate);
        document.getElementById('systemHealth').textContent = `${stats.system_health.toFixed(1)}%`;
    }
}

// Load wells data
async function loadWellsData() {
    const tbody = document.getElementById('wellsTableBody');
    
    try {
        let wellsData;
        
        if (useMockData) {
            wellsData = mockData.wells.map(well => {
                const data = mockData.generateSensorData(well, 1)[0];
                return {
                    well_name: well,
                    well_type: mockData.wellTypes[well],
                    well_status: data.well_status,
                    oil_flow_rate: data.oil_flow_rate,
                    wellhead_pressure: data.wellhead_pressure,
                    wellhead_temperature: data.wellhead_temperature,
                    timestamp: data.timestamp
                };
            });
        } else {
            const response = await api.getSensorData({ limit: 4 });
            wellsData = response.records || [];
        }
        
        tbody.innerHTML = '';
        
        wellsData.forEach(well => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${well.well_name}</strong></td>
                <td>${translateWellType(well.well_type)}</td>
                <td><span class="status-badge ${well.well_status}">${translateStatus(well.well_status)}</span></td>
                <td>${formatNumber(well.oil_flow_rate)}</td>
                <td>${formatNumber(well.wellhead_pressure)}</td>
                <td>${formatNumber(well.wellhead_temperature)}</td>
                <td>${formatTime(well.timestamp)}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading wells data:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">خطا در بارگذاری داده‌ها</td></tr>';
    }
}

// Load alerts data
async function loadAlertsData() {
    const alertsContainer = document.getElementById('recentAlerts');
    
    try {
        let alerts;
        
        if (useMockData) {
            alerts = mockData.generateAlerts(5);
        } else {
            const response = await api.getAlerts({ status: 'open', limit: 5 });
            alerts = response.alerts || [];
        }
        
        alertsContainer.innerHTML = '';
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<div class="alert-item"><div class="loading">هشداری وجود ندارد</div></div>';
            return;
        }
        
        alerts.forEach(alert => {
            const alertEl = document.createElement('div');
            alertEl.className = `alert-item ${alert.severity}`;
            alertEl.innerHTML = `
                <div class="alert-header-row">
                    <span class="alert-severity">${translateSeverity(alert.severity)}</span>
                    <span class="alert-time">${formatTime(alert.timestamp)}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
            `;
            alertsContainer.appendChild(alertEl);
        });
    } catch (error) {
        console.error('Error loading alerts:', error);
        alertsContainer.innerHTML = '<div class="alert-item"><div class="loading">خطا در بارگذاری هشدارها</div></div>';
    }
}

// Initialize charts
function initCharts() {
    const ctx1 = document.getElementById('productionChart');
    const ctx2 = document.getElementById('pressureTempChart');
    
    if (ctx1) {
        productionChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'PROD-001',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'PROD-002',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'تولید (bbl/day)'
                        }
                    }
                }
            }
        });
    }
    
    if (ctx2) {
        pressureTempChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'فشار (psi)',
                    data: [],
                    backgroundColor: '#f59e0b',
                    yAxisID: 'y'
                }, {
                    label: 'دما (°C)',
                    data: [],
                    backgroundColor: '#ef4444',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'فشار (psi)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'دما (°C)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
}

// Update charts
async function updateCharts() {
    try {
        const wells = useMockData ? mockData.wells : ['PROD-001', 'PROD-002', 'DEV-001', 'OBS-001'];
        
        // Production chart
        if (productionChart) {
            const labels = [];
            const prod1Data = [];
            const prod2Data = [];
            
            for (let i = 19; i >= 0; i--) {
                const time = new Date(Date.now() - i * 60000);
                labels.push(time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
                
                if (useMockData) {
                    prod1Data.push(mockData.randomValue(800, 1500));
                    prod2Data.push(mockData.randomValue(800, 1500));
                } else {
                    prod1Data.push(Math.random() * 700 + 800);
                    prod2Data.push(Math.random() * 700 + 800);
                }
            }
            
            productionChart.data.labels = labels;
            productionChart.data.datasets[0].data = prod1Data;
            productionChart.data.datasets[1].data = prod2Data;
            productionChart.update('none');
        }
        
        // Pressure/Temperature chart
        if (pressureTempChart) {
            const labels = wells.slice(0, 4);
            const pressureData = [];
            const tempData = [];
            
            labels.forEach(() => {
                if (useMockData) {
                    pressureData.push(mockData.randomValue(2000, 3500));
                    tempData.push(mockData.randomValue(60, 90));
                } else {
                    pressureData.push(Math.random() * 1500 + 2000);
                    tempData.push(Math.random() * 30 + 60);
                }
            });
            
            pressureTempChart.data.labels = labels;
            pressureTempChart.data.datasets[0].data = pressureData;
            pressureTempChart.data.datasets[1].data = tempData;
            pressureTempChart.update('none');
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Auto-refresh
function startAutoRefresh() {
    const interval = parseInt(localStorage.getItem('refreshInterval') || '10') * 1000;
    
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(async () => {
        console.log('Auto-refreshing data...');
        await loadDashboardData();
    }, interval);
}

// Manual refresh
async function refreshData() {
    console.log('Manual refresh triggered');
    await checkConnection();
    await loadDashboardData();
}

// Utility functions
function formatNumber(num) {
    if (typeof num !== 'number') return '-';
    return num.toFixed(1);
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('fa-IR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function translateStatus(status) {
    const translations = {
        'running': 'در حال کار',
        'stopped': 'متوقف',
        'maintenance': 'تعمیرات'
    };
    return translations[status] || status;
}

function translateWellType(type) {
    const translations = {
        'production': 'تولیدی',
        'development': 'توسعه‌ای',
        'observation': 'مشاهده‌ای',
        'injection': 'تزریقی'
    };
    return translations[type] || type;
}

function translateSeverity(severity) {
    const translations = {
        'critical': 'بحرانی',
        'warning': 'هشدار',
        'info': 'اطلاع'
    };
    return translations[severity] || severity;
}

// Settings functions
function showSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function saveSettings() {
    const apiUrl = document.getElementById('apiUrl').value;
    const refreshInterval = document.getElementById('refreshInterval').value;
    const showCharts = document.getElementById('showCharts').checked;
    
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('refreshInterval', refreshInterval);
    localStorage.setItem('showCharts', showCharts);
    
    api.baseUrl = apiUrl;
    startAutoRefresh();
    
    closeSettings();
    
    alert('تنظیمات ذخیره شد');
    refreshData();
}

function loadSettings() {
    const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:8000';
    const refreshInterval = localStorage.getItem('refreshInterval') || '10';
    const showCharts = localStorage.getItem('showCharts') !== 'false';
    
    document.getElementById('apiUrl').value = apiUrl;
    document.getElementById('refreshInterval').value = refreshInterval;
    document.getElementById('showCharts').checked = showCharts;
    
    api.baseUrl = apiUrl;
}

