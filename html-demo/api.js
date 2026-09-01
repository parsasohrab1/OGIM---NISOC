// API Client for OGIM Backend
class OGIMApi {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('ogim_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('ogim_token', token);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${this.baseUrl}/api/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        this.setToken(data.access_token);
        return data;
    }

    async getMe() {
        return this.request('/api/auth/users/me');
    }

    // Wells/Tags endpoints
    async getTags(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/tag-catalog/tags${queryString ? '?' + queryString : ''}`);
    }

    async getTag(tagId) {
        return this.request(`/api/tag-catalog/tags/${tagId}`);
    }

    // Sensor data endpoints
    async getSensorData(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/data-ingestion/sensor-data${queryString ? '?' + queryString : ''}`);
    }

    // Alerts endpoints
    async getAlerts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/alert/alerts${queryString ? '?' + queryString : ''}`);
    }

    async acknowledgeAlert(alertId, username) {
        return this.request(`/api/alert/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            body: JSON.stringify({ acknowledged_by: username })
        });
    }

    async resolveAlert(alertId) {
        return this.request(`/api/alert/alerts/${alertId}/resolve`, {
            method: 'POST'
        });
    }

    async getAlertRules() {
        return this.request('/api/alert/rules');
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Get statistics
    async getStatistics() {
        return this.request('/api/statistics');
    }
}

// Mock data generator (fallback when backend is not available)
class MockDataGenerator {
    constructor() {
        this.wells = ['PROD-001', 'PROD-002', 'DEV-001', 'OBS-001'];
        this.wellTypes = {
            'PROD-001': 'production',
            'PROD-002': 'production',
            'DEV-001': 'development',
            'OBS-001': 'observation'
        };
    }

    generateSensorData(wellName, count = 20) {
        const data = [];
        const now = Date.now();
        
        for (let i = 0; i < count; i++) {
            const timestamp = new Date(now - (count - i) * 60000);
            data.push({
                timestamp: timestamp.toISOString(),
                well_name: wellName,
                well_type: this.wellTypes[wellName],
                oil_flow_rate: this.randomValue(800, 1500),
                gas_flow_rate: this.randomValue(1, 3),
                water_flow_rate: this.randomValue(100, 500),
                wellhead_pressure: this.randomValue(2000, 3500),
                wellhead_temperature: this.randomValue(60, 90),
                pump_speed: this.randomValue(1500, 3000),
                vibration_overall: this.randomValue(1, 5),
                well_status: Math.random() > 0.1 ? 'running' : 'stopped'
            });
        }
        
        return data;
    }

    generateAlerts(count = 5) {
        const severities = ['critical', 'warning', 'info'];
        const messages = [
            'High pressure detected',
            'Temperature exceeding limit',
            'Vibration anomaly',
            'Low production rate',
            'Equipment maintenance required'
        ];
        
        const alerts = [];
        const now = Date.now();
        
        for (let i = 0; i < count; i++) {
            const well = this.wells[Math.floor(Math.random() * this.wells.length)];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            alerts.push({
                alert_id: `ALERT-${Date.now()}-${i}`,
                timestamp: new Date(now - i * 3600000).toISOString(),
                severity: severity,
                status: 'open',
                well_name: well,
                sensor_id: `${well}-SENSOR-${i}`,
                message: `${well}: ${message}`,
                rule_name: 'threshold_rule'
            });
        }
        
        return alerts;
    }

    generateTags() {
        const tags = [];
        
        this.wells.forEach(well => {
            tags.push({
                tag_id: `${well}-PRESSURE`,
                well_name: well,
                equipment_type: 'wellhead',
                sensor_type: 'pressure',
                unit: 'psi',
                valid_range_min: 0,
                valid_range_max: 5000,
                status: 'active'
            });
            
            tags.push({
                tag_id: `${well}-TEMP`,
                well_name: well,
                equipment_type: 'wellhead',
                sensor_type: 'temperature',
                unit: '°C',
                valid_range_min: 0,
                valid_range_max: 150,
                status: 'active'
            });
        });
        
        return tags;
    }

    randomValue(min, max) {
        return Math.random() * (max - min) + min;
    }

    getStatistics() {
        return {
            total_wells: this.wells.length,
            active_wells: 3,
            total_alerts: 12,
            active_alerts: 5,
            production_rate: 4500,
            system_health: 98.5
        };
    }
}

// Export instances
const api = new OGIMApi();
const mockData = new MockDataGenerator();

