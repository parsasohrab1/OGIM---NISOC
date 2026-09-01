import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import './EdgeComputing.css'

interface EdgeDevice {
  deviceId: string
  location: string
  deviceType: 'sensor' | 'gateway' | 'controller'
  powerConsumption: number // watts
  cpuUsage: number // percentage
  memoryUsage: number // percentage
  tinymlModel: string
  inferenceLatency: number // milliseconds
  energySavings: number // percentage
  status: 'active' | 'idle' | 'error'
}

interface TinyMLModel {
  modelId: string
  name: string
  task: 'anomaly_detection' | 'predictive_maintenance' | 'optimization'
  size: number // KB
  accuracy: number // percentage
  powerEfficiency: number // percentage improvement
  inferenceTime: number // milliseconds
  memoryFootprint: number // KB
}

export default function EdgeComputing() {
  const [selectedDevice, setSelectedDevice] = useState<string>('EDGE-001')

  // Mock data for edge devices
  const { data: edgeDevices = [] } = useQuery({
    queryKey: ['edge-devices'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return [
        {
          deviceId: 'EDGE-001',
          location: 'Well PROD-001',
          deviceType: 'gateway',
          powerConsumption: 2.5,
          cpuUsage: 35,
          memoryUsage: 42,
          tinymlModel: 'Anomaly Detection v2.1',
          inferenceLatency: 12,
          energySavings: 68,
          status: 'active' as const
        },
        {
          deviceId: 'EDGE-002',
          location: 'Well PROD-002',
          deviceType: 'sensor',
          powerConsumption: 0.8,
          cpuUsage: 22,
          memoryUsage: 28,
          tinymlModel: 'Predictive Maintenance v1.5',
          inferenceLatency: 8,
          energySavings: 72,
          status: 'active' as const
        },
        {
          deviceId: 'EDGE-003',
          location: 'Well DEV-001',
          deviceType: 'controller',
          powerConsumption: 3.2,
          cpuUsage: 45,
          memoryUsage: 55,
          tinymlModel: 'Optimization v3.0',
          inferenceLatency: 15,
          energySavings: 65,
          status: 'active' as const
        },
        {
          deviceId: 'EDGE-004',
          location: 'Well OBS-001',
          deviceType: 'gateway',
          powerConsumption: 2.1,
          cpuUsage: 28,
          memoryUsage: 35,
          tinymlModel: 'Anomaly Detection v2.1',
          inferenceLatency: 10,
          energySavings: 70,
          status: 'idle' as const
        }
      ] as EdgeDevice[]
    },
    refetchInterval: 5000
  })

  // Mock data for TinyML models
  const { data: tinymlModels = [] } = useQuery({
    queryKey: ['tinyml-models'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return [
        {
          modelId: 'TML-001',
          name: 'Anomaly Detection v2.1',
          task: 'anomaly_detection' as const,
          size: 45,
          accuracy: 94.5,
          powerEfficiency: 68,
          inferenceTime: 12,
          memoryFootprint: 38
        },
        {
          modelId: 'TML-002',
          name: 'Predictive Maintenance v1.5',
          task: 'predictive_maintenance' as const,
          size: 62,
          accuracy: 91.2,
          powerEfficiency: 72,
          inferenceTime: 8,
          memoryFootprint: 52
        },
        {
          modelId: 'TML-003',
          name: 'Optimization v3.0',
          task: 'optimization' as const,
          size: 78,
          accuracy: 89.8,
          powerEfficiency: 65,
          inferenceTime: 15,
          memoryFootprint: 65
        }
      ] as TinyMLModel[]
    }
  })

  // Mock power consumption history
  const powerHistory = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    consumption: 2.5 + Math.random() * 1.5,
    savings: 65 + Math.random() * 10
  }))

  const selectedDeviceData = edgeDevices.find(d => d.deviceId === selectedDevice)

  return (
    <div className="edge-computing-page">
      <div className="page-header">
        <h1>Edge Computing & TinyML Optimization</h1>
        <p>Green AI implementation for remote oil fields with minimal power consumption</p>
      </div>

      <div className="edge-stats-grid">
        <div className="stat-card">
          <h3>Total Edge Devices</h3>
          <div className="stat-value">{edgeDevices.length}</div>
          <div className="stat-label">Active: {edgeDevices.filter(d => d.status === 'active').length}</div>
        </div>
        <div className="stat-card">
          <h3>Average Power Consumption</h3>
          <div className="stat-value">
            {(edgeDevices.reduce((sum, d) => sum + d.powerConsumption, 0) / edgeDevices.length || 0).toFixed(2)}W
          </div>
          <div className="stat-label">Per Device</div>
        </div>
        <div className="stat-card">
          <h3>Energy Savings</h3>
          <div className="stat-value">
            {Math.round(edgeDevices.reduce((sum, d) => sum + d.energySavings, 0) / edgeDevices.length || 0)}%
          </div>
          <div className="stat-label">vs Cloud Processing</div>
        </div>
        <div className="stat-card">
          <h3>Total Power Saved</h3>
          <div className="stat-value">
            {(edgeDevices.reduce((sum, d) => sum + d.powerConsumption * (d.energySavings / 100), 0)).toFixed(2)}W
          </div>
          <div className="stat-label">Per Hour</div>
        </div>
      </div>

      <div className="edge-content-grid">
        <div className="devices-section">
          <h2>Edge Devices</h2>
          <div className="devices-list">
            {edgeDevices.map(device => (
              <div
                key={device.deviceId}
                className={`device-card ${device.status} ${selectedDevice === device.deviceId ? 'selected' : ''}`}
                onClick={() => setSelectedDevice(device.deviceId)}
              >
                <div className="device-header">
                  <span className="device-id">{device.deviceId}</span>
                  <span className={`device-status ${device.status}`}>{device.status}</span>
                </div>
                <div className="device-info">
                  <p><strong>Location:</strong> {device.location}</p>
                  <p><strong>Type:</strong> {device.deviceType}</p>
                  <p><strong>Power:</strong> {device.powerConsumption}W</p>
                  <p><strong>Energy Savings:</strong> {device.energySavings}%</p>
                  <p><strong>TinyML Model:</strong> {device.tinymlModel}</p>
                </div>
                <div className="device-metrics">
                  <div className="metric">
                    <span>CPU</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${device.cpuUsage}%` }}></div>
                    </div>
                    <span>{device.cpuUsage}%</span>
                  </div>
                  <div className="metric">
                    <span>Memory</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${device.memoryUsage}%` }}></div>
                    </div>
                    <span>{device.memoryUsage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="details-section">
          <h2>Device Details</h2>
          {selectedDeviceData && (
            <div className="device-details">
              <div className="detail-group">
                <h3>Performance Metrics</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={[
                    { metric: 'CPU', value: selectedDeviceData.cpuUsage },
                    { metric: 'Memory', value: selectedDeviceData.memoryUsage },
                    { metric: 'Power', value: selectedDeviceData.powerConsumption * 10 }
                  ]}>
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="detail-group">
                <h3>Power Consumption History (24h)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={powerHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="consumption" stroke="#82ca9d" name="Power (W)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="detail-group">
                <h3>TinyML Model Information</h3>
                <div className="model-info">
                  <p><strong>Model:</strong> {selectedDeviceData.tinymlModel}</p>
                  <p><strong>Inference Latency:</strong> {selectedDeviceData.inferenceLatency}ms</p>
                  <p><strong>Energy Savings:</strong> {selectedDeviceData.energySavings}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tinyml-models-section">
        <h2>TinyML Models</h2>
        <div className="models-grid">
          {tinymlModels.map(model => (
            <div key={model.modelId} className="model-card">
              <div className="model-header">
                <h3>{model.name}</h3>
                <span className="model-task">{model.task.replace('_', ' ')}</span>
              </div>
              <div className="model-metrics">
                <div className="metric-item">
                  <span className="metric-label">Size</span>
                  <span className="metric-value">{model.size} KB</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{model.accuracy}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Power Efficiency</span>
                  <span className="metric-value">{model.powerEfficiency}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Inference Time</span>
                  <span className="metric-value">{model.inferenceTime}ms</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Memory</span>
                  <span className="metric-value">{model.memoryFootprint} KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="energy-comparison-section">
        <h2>Energy Consumption Comparison</h2>
        <div className="comparison-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { approach: 'Cloud Processing', power: 15.5, savings: 0 },
              { approach: 'Edge Computing', power: 2.3, savings: 85 },
              { approach: 'TinyML Optimized', power: 0.8, savings: 95 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="approach" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="power" fill="#8884d8" name="Power Consumption (W)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

