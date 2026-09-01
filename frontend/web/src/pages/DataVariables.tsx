import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { dataVariablesAPI } from '../api/services'
import './DataVariables.css'

interface DataVariable {
  name: string
  category: string
  unit: string
  sampling_rate_ms: number
  valid_range_min: number
  valid_range_max: number
  description: string
  equipment_location: string
}

// Generate mock data variables (65+ parameters)
function generateMockDataVariables(): DataVariable[] {
  const variables: DataVariable[] = []
  
  // Pressure variables (10)
  for (let i = 1; i <= 10; i++) {
    variables.push({
      name: `wellhead_pressure_${i}`,
      category: 'Pressure',
      unit: 'psi',
      sampling_rate_ms: 1000,
      valid_range_min: 0,
      valid_range_max: 5000,
      description: `Wellhead pressure sensor ${i}`,
      equipment_location: `Well PROD-${String(i).padStart(3, '0')}`
    })
  }
  
  // Temperature variables (10)
  for (let i = 1; i <= 10; i++) {
    variables.push({
      name: `wellhead_temperature_${i}`,
      category: 'Temperature',
      unit: '°C',
      sampling_rate_ms: 2000,
      valid_range_min: -20,
      valid_range_max: 150,
      description: `Wellhead temperature sensor ${i}`,
      equipment_location: `Well PROD-${String(i).padStart(3, '0')}`
    })
  }
  
  // Flow variables (10)
  for (let i = 1; i <= 10; i++) {
    variables.push({
      name: `oil_flow_rate_${i}`,
      category: 'Flow',
      unit: 'bbl/day',
      sampling_rate_ms: 500,
      valid_range_min: 0,
      valid_range_max: 5000,
      description: `Oil flow rate sensor ${i}`,
      equipment_location: `Well PROD-${String(i).padStart(3, '0')}`
    })
  }
  
  // Level variables (8)
  for (let i = 1; i <= 8; i++) {
    variables.push({
      name: `tank_level_${i}`,
      category: 'Level',
      unit: 'm',
      sampling_rate_ms: 5000,
      valid_range_min: 0,
      valid_range_max: 20,
      description: `Storage tank level ${i}`,
      equipment_location: `Tank T-${String(i).padStart(3, '0')}`
    })
  }
  
  // Vibration variables (8)
  for (let i = 1; i <= 8; i++) {
    variables.push({
      name: `pump_vibration_${i}`,
      category: 'Vibration',
      unit: 'mm/s',
      sampling_rate_ms: 100,
      valid_range_min: 0,
      valid_range_max: 50,
      description: `Pump vibration sensor ${i}`,
      equipment_location: `Pump PUMP-${String(i).padStart(3, '0')}`
    })
  }
  
  // Power variables (7)
  for (let i = 1; i <= 7; i++) {
    variables.push({
      name: `motor_power_${i}`,
      category: 'Power',
      unit: 'kW',
      sampling_rate_ms: 1000,
      valid_range_min: 0,
      valid_range_max: 500,
      description: `Motor power consumption ${i}`,
      equipment_location: `Motor M-${String(i).padStart(3, '0')}`
    })
  }
  
  // Control variables (7)
  for (let i = 1; i <= 7; i++) {
    variables.push({
      name: `valve_position_${i}`,
      category: 'Control',
      unit: '%',
      sampling_rate_ms: 500,
      valid_range_min: 0,
      valid_range_max: 100,
      description: `Control valve position ${i}`,
      equipment_location: `Valve V-${String(i).padStart(3, '0')}`
    })
  }
  
  // Safety variables (5)
  for (let i = 1; i <= 5; i++) {
    variables.push({
      name: `safety_system_status_${i}`,
      category: 'Safety',
      unit: 'status',
      sampling_rate_ms: 10000,
      valid_range_min: 0,
      valid_range_max: 1,
      description: `Safety system status ${i}`,
      equipment_location: `Safety System SS-${String(i).padStart(3, '0')}`
    })
  }
  
  return variables
}

interface DataVariable {
  name: string
  category: string
  unit: string
  sampling_rate_ms: number
  valid_range_min: number
  valid_range_max: number
  description: string
  equipment_location: string
}

export default function DataVariables() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedVariable, setSelectedVariable] = useState<string>('')

  // Fetch all data variables
  const { data: variables, isLoading } = useQuery({
    queryKey: ['data-variables'],
    queryFn: async () => {
      try {
        const data = await dataVariablesAPI.getVariables()
        return (data || []) as DataVariable[]
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('Data variables service unavailable')
        }
        // Return mock data with 65+ variables
        return generateMockDataVariables()
      }
    },
  })

  // Fetch real-time data for selected variable
  const { data: variableData } = useQuery({
    queryKey: ['variable-data', selectedVariable],
    queryFn: async () => {
      if (!selectedVariable) return []
      try {
        const data = await dataVariablesAPI.getVariableData(selectedVariable, { limit: 100 })
        return data || []
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('Variable data service unavailable')
        }
        // Return mock time series data
        return generateMockTimeSeriesData(selectedVariable)
      }
    },
    enabled: !!selectedVariable,
    refetchInterval: 1000, // Refetch every second for real-time
  })

  // Generate mock time series data
  function generateMockTimeSeriesData(_variableName: string) {
    const data: Array<{ timestamp: string; value: number; data_quality: string }> = []
    const now = Date.now()
    const baseValue = Math.random() * 1000 + 500
    
    for (let i = 99; i >= 0; i--) {
      const timestamp = new Date(now - i * 1000)
      const value = baseValue + Math.sin(i / 10) * 50 + (Math.random() - 0.5) * 20
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.max(0, value),
        data_quality: 'good'
      })
    }
    return data
  }

  if (isLoading) {
    return <div className="loading">Loading data variables...</div>
  }

  const categories = ['all', ...new Set(variables?.map(v => v.category) || [])]
  const filteredVariables = selectedCategory === 'all' 
    ? variables 
    : variables?.filter(v => v.category === selectedCategory)

  const chartData = variableData?.map((point: any) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    value: point.value,
  })) || []

  const samplingRateStats = variables?.reduce((acc: any, v) => {
    const rate = v.sampling_rate_ms
    acc[rate] = (acc[rate] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="data-variables-page">
      <h2>Data Variables (65+ Parameters)</h2>

      <div className="variables-overview">
        <div className="stat-card">
          <h3>Total Variables</h3>
          <div className="stat-value">{variables?.length || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <div className="stat-value">{categories.length - 1}</div>
        </div>
        <div className="stat-card">
          <h3>Sampling Rates</h3>
          <div className="stat-value">{Object.keys(samplingRateStats).length}</div>
        </div>
      </div>

      <div className="variables-grid">
        {/* Category Filter */}
        <div className="variables-card">
          <h3>Filter by Category</h3>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Variables List */}
        <div className="variables-card variables-list">
          <h3>Variables ({filteredVariables?.length || 0})</h3>
          <div className="variables-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Sampling Rate</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariables?.map((variable, idx) => (
                  <tr key={idx}>
                    <td>{variable.name}</td>
                    <td><span className={`category-badge category-${variable.category}`}>{variable.category}</span></td>
                    <td>{variable.unit}</td>
                    <td>{variable.sampling_rate_ms}ms ({1000/variable.sampling_rate_ms}Hz)</td>
                    <td>{variable.equipment_location}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedVariable(variable.name)}
                        className="view-button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Chart */}
        {selectedVariable && (
          <div className="variables-card chart-card">
            <h3>Real-time Data: {selectedVariable}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  name={selectedVariable}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sampling Rate Distribution */}
        <div className="variables-card">
          <h3>Sampling Rate Distribution</h3>
          <div className="sampling-stats">
            {Object.entries(samplingRateStats).map(([rate, count]) => {
              const countNum = count as number
              return (
                <div key={rate} className="sampling-item">
                  <div className="sampling-rate">{rate}ms</div>
                  <div className="sampling-count">{countNum} variables</div>
                  <div className="sampling-bar">
                    <div 
                      className="sampling-fill" 
                      style={{ width: `${(countNum / (variables?.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="variables-card">
          <h3>Variables by Category</h3>
          <div className="category-breakdown">
            {categories.slice(1).map(cat => {
              const count = variables?.filter(v => v.category === cat).length || 0
              return (
                <div key={cat} className="category-item">
                  <div className="category-name">{cat}</div>
                  <div className="category-count">{count} variables</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

