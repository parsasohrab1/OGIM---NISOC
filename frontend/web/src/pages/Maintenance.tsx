import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import apiClient from '../api/client'
import {
  getMarunMaintenanceSchedule,
  getMarunRulPredictions,
  type MarunRulPrediction,
} from '../data/marunRul'
import './Maintenance.css'

type RULPrediction = MarunRulPrediction

interface MaintenanceSchedule {
  equipment_id: string
  equipment_type: string
  equipment_type_fa: string
  maintenance_type: string
  maintenance_type_fa: string
  scheduled_date: string
  estimated_duration: number
  priority: string
  status: string
  status_fa: string
}

interface PreventiveMaintenanceRecommendation {
  id: string
  category: 'pressure_maintenance' | 'production_optimization' | 'well_integrity' | 'equipment_health' | 'cost_reduction'
  title: string
  description: string
  well_name?: string
  equipment_id?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: string
  estimated_benefit: string
  action_required: string
  timeframe: string
  cost_estimate?: number
  roi?: number
}

const URGENCY_FA: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const PRIORITY_FA: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function Maintenance() {
  const [selectedEquipment, setSelectedEquipment] = useState<string>('')

  const { data: rulPredictions, isLoading: rulLoading } = useQuery({
    queryKey: ['rul-predictions'],
    queryFn: async () => getMarunRulPredictions() as RULPrediction[],
    refetchInterval: 15000,
  })

  const { data: maintenanceSchedule } = useQuery({
    queryKey: ['maintenance-schedule', rulPredictions?.length],
    queryFn: async () =>
      getMarunMaintenanceSchedule(rulPredictions ?? getMarunRulPredictions()) as MaintenanceSchedule[],
    enabled: !!rulPredictions?.length,
  })

  const { data: spareParts } = useQuery({
    queryKey: ['spare-parts'],
    queryFn: async () => {
      return [
        { part: 'Bearing', current_stock: 5, required: 8, cost: 500 },
        { part: 'Seal', current_stock: 12, required: 15, cost: 200 },
        { part: 'Gasket', current_stock: 20, required: 25, cost: 50 },
      ]
    },
  })

  const { data: preventiveRecommendations, isLoading: recLoading } = useQuery({
    queryKey: ['preventive-maintenance-recommendations'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/ml-inference/maintenance/recommendations')
        return response.data
      } catch {
        return [
          {
            id: 'PM-001',
            category: 'pressure_maintenance',
            title: 'Prevent pressure decline at well MN-01',
            description: 'The well pressure is decreasing. Inspection of the check valve and the pressure control system is recommended.',
            well_name: 'MN-01',
            priority: 'high',
            impact: 'Prevent a 15% production decline',
            estimated_benefit: 'Production increase of 200 bbl/day',
            action_required: 'Inspect and repair the check valves, calibrate the pressure gauge, test the blowout preventer system',
            timeframe: 'Urgent — within 48 hours',
            cost_estimate: 15000,
            roi: 350,
          },
          {
            id: 'PM-002',
            category: 'production_optimization',
            title: 'Production optimization of well MN-02',
            description: 'The well is producing below capacity. Adjusting the choke valve and optimizing the rate is recommended.',
            well_name: 'MN-02',
            priority: 'medium',
            impact: 'Production increase of 10%',
            estimated_benefit: 'Production increase of 150 bbl/day',
            action_required: 'Nodal analysis, adjust the choke valve position, optimize artificial lift',
            timeframe: 'Within 1 week',
            cost_estimate: 8000,
            roi: 280,
          },
          {
            id: 'PM-003',
            category: 'well_integrity',
            title: 'Annulus integrity inspection of well MN-03',
            description: 'Signs of corrosion were observed in the casing. Integrity inspection and cement bond evaluation are recommended.',
            well_name: 'MN-03',
            priority: 'critical',
            impact: 'Prevent leaks and contamination',
            estimated_benefit: 'Avoid an emergency repair cost of $500,000',
            action_required: 'Casing inspection, cement bond log, corrosion monitoring',
            timeframe: 'Urgent — within 24 hours',
            cost_estimate: 25000,
            roi: 2000,
          },
          {
            id: 'PM-004',
            category: 'pressure_maintenance',
            title: 'Preventive maintenance of the gas lift system',
            description: 'The gas lift system needs service. Reduced efficiency can cause a pressure decline.',
            equipment_id: 'GASLIFT-MN-04',
            well_name: 'MN-04',
            priority: 'high',
            impact: 'Prevent a 20% production decline',
            estimated_benefit: 'Production increase of 300 bbl/day',
            action_required: 'Compressor service, gas line inspection, control valve testing',
            timeframe: 'Within 3 days',
            cost_estimate: 12000,
            roi: 400,
          },
          {
            id: 'PM-005',
            category: 'production_optimization',
            title: 'Artificial lift system optimization',
            description: 'The electric submersible pump needs tuning. Optimization can increase production by 12%.',
            equipment_id: 'ESP-MN-05',
            well_name: 'MN-05',
            priority: 'medium',
            impact: 'Increased pump efficiency',
            estimated_benefit: 'Production increase of 180 bbl/day, 8% reduction in power consumption',
            action_required: 'Adjust the frequency, check the motor temperature, optimize pump tuning',
            timeframe: 'Within 1 week',
            cost_estimate: 6000,
            roi: 450,
          },
          {
            id: 'PM-006',
            category: 'equipment_health',
            title: 'Preventive maintenance of the separator',
            description: 'The separator needs cleaning and inspection. Sediments can reduce efficiency.',
            equipment_id: 'SEP-MN-06',
            well_name: 'MN-06',
            priority: 'medium',
            impact: 'Improved separation quality',
            estimated_benefit: '5% reduction of water in oil, improved product quality',
            action_required: 'Internal cleaning, plate inspection, control system testing',
            timeframe: 'Within 2 weeks',
            cost_estimate: 10000,
            roi: 180,
          },
          {
            id: 'PM-007',
            category: 'pressure_maintenance',
            title: 'Prevent pressure decline in the pipeline',
            description: 'Signs of pressure decline were observed in the main line. Leak inspection and scale evaluation are essential.',
            equipment_id: 'PIPELINE-MN-07',
            well_name: 'MN-07',
            priority: 'high',
            impact: 'Prevent production shutdown',
            estimated_benefit: 'Avoid a production shutdown cost of $1,000,000',
            action_required: 'Pipeline inspection, pigging, leak detection, pressure test',
            timeframe: 'Urgent — within 72 hours',
            cost_estimate: 35000,
            roi: 2857,
          },
          {
            id: 'PM-008',
            category: 'production_optimization',
            title: 'Choke valve management optimization',
            description: 'Several wells need choke valve adjustment. Optimization can increase total field production by 8%.',
            well_name: 'MN-01…MN-24',
            priority: 'medium',
            impact: 'Increase total field production',
            estimated_benefit: 'Production increase of 500 bbl/day across the field',
            action_required: 'Production profile analysis, adjust each well\'s choke valve, continuous monitoring',
            timeframe: 'Within 2 weeks',
            cost_estimate: 15000,
            roi: 520,
          },
          {
            id: 'PM-009',
            category: 'well_integrity',
            title: 'Inspection and maintenance of the blowout preventer assembly',
            description: 'The blowout preventer needs testing and inspection. Ensuring correct operation is essential for safety.',
            equipment_id: 'BOP-MN-08',
            well_name: 'MN-08',
            priority: 'critical',
            impact: 'Safety and blowout prevention',
            estimated_benefit: 'Prevent an incident costing millions of dollars',
            action_required: 'Blowout preventer function test, pressure test, visual inspection, review of maintenance records',
            timeframe: 'Urgent — within 24 hours',
            cost_estimate: 20000,
            roi: 10000,
          },
          {
            id: 'PM-010',
            category: 'cost_reduction',
            title: 'Energy consumption optimization',
            description: 'Electrical systems and compressors can operate more efficiently. A 15% energy reduction is achievable.',
            equipment_id: 'POWER-MN-09',
            well_name: 'MN-09',
            priority: 'low',
            impact: 'Reduced operating costs',
            estimated_benefit: 'Electricity cost reduction of $25,000 per month',
            action_required: 'Review load balancing, optimize compressor operation, install a variable frequency drive',
            timeframe: 'Within 1 month',
            cost_estimate: 50000,
            roi: 600,
          },
        ] as PreventiveMaintenanceRecommendation[]
      }
    },
    refetchInterval: 300000,
  })

  const urgencyColors: Record<string, string> = {
    critical: '#c62828',
    high: '#f9a825',
    medium: '#0288d1',
    low: '#2e7d32',
  }

  if (rulLoading) {
    return <div className="loading">Loading maintenance data…</div>
  }

  const rulChartData = (rulPredictions ?? []).slice(0, 12).map((pred) => ({
    equipment: pred.equipment_id.replace('ESP-', ''),
    fullId: pred.equipment_id,
    rul_days: pred.rul_days,
    urgency: pred.urgency,
    confidence: (pred.confidence * 100).toFixed(0),
  }))

  const categoryLabels: Record<string, string> = {
    pressure_maintenance: 'Pressure maintenance',
    production_optimization: 'Production optimization',
    well_integrity: 'Well integrity',
    equipment_health: 'Equipment health',
    cost_reduction: 'Cost reduction',
  }

  return (
    <div className="maintenance-page" dir="rtl">
      <h2>Predictive maintenance</h2>

      <div className="maintenance-grid">
        <div className="maintenance-card">
          <h3>Remaining useful life forecast</h3>
          <p className="section-description">The 12 equipment items with the lowest remaining useful life in the Maroun field</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rulChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="equipment" tick={{ fill: '#555', fontSize: 11 }} />
              <YAxis tick={{ fill: '#555', fontSize: 11 }} unit=" days" />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #ccc', borderRadius: 8, color: '#111' }}
                labelStyle={{ color: '#111' }}
                formatter={(value: number) => [`${value} days`, 'Useful life']}
              />
              <Legend wrapperStyle={{ color: '#333' }} />
              <Bar dataKey="rul_days" name="Remaining useful life (days)" radius={[4, 4, 0, 0]}>
                {rulChartData.map((row) => (
                  <Cell key={row.fullId} fill={urgencyColors[row.urgency] || '#5c6bc0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="maintenance-card full-width">
          <h3>Remaining useful life forecast per equipment</h3>
          <p className="section-description">
            Electric submersible pumps of the 24 Maroun wells along with shared facility equipment — sorted from critical to stable
          </p>
          <div className="table-container">
            {!rulPredictions?.length ? (
              <p className="empty-state">No data to display.</p>
            ) : (
              <table className="rul-table">
                <thead>
                  <tr>
                    <th>Equipment ID</th>
                    <th>Well / location</th>
                    <th>Type</th>
                    <th>Useful life (days)</th>
                    <th>Useful life (hours)</th>
                    <th>Confidence</th>
                    <th>Urgency</th>
                    <th>Maintenance window</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {rulPredictions.map((pred) => (
                    <tr key={pred.equipment_id} className={`urgency-row-${pred.urgency}`}>
                      <td className="mono">{pred.equipment_id}</td>
                      <td>{pred.well_name || 'Field facilities'}</td>
                      <td>{pred.equipment_type_fa || pred.equipment_type}</td>
                      <td>
                        <strong>{pred.rul_days.toFixed(0)}</strong>
                      </td>
                      <td>{pred.rul_hours.toLocaleString('fa-IR')}</td>
                      <td>{(pred.confidence * 100).toFixed(0)}%</td>
                      <td>
                        <span
                          className="urgency-badge"
                          style={{ backgroundColor: urgencyColors[pred.urgency] }}
                        >
                          {URGENCY_FA[pred.urgency] || pred.urgency}
                        </span>
                      </td>
                      <td>{pred.maintenance_window_days} days</td>
                      <td className="rec-cell">{pred.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="maintenance-card">
          <h3>Maintenance schedule</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Maintenance type</th>
                  <th>Scheduled date</th>
                  <th>Duration (hours)</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceSchedule?.map((schedule, idx) => (
                  <tr key={idx}>
                    <td>{schedule.equipment_id}</td>
                    <td>{schedule.equipment_type_fa || schedule.equipment_type}</td>
                    <td>{schedule.maintenance_type_fa || schedule.maintenance_type}</td>
                    <td>{new Date(schedule.scheduled_date).toLocaleDateString('fa-IR')}</td>
                    <td>{schedule.estimated_duration}</td>
                    <td>
                      <span className={`priority-${schedule.priority}`}>
                        {PRIORITY_FA[schedule.priority] || schedule.priority}
                      </span>
                    </td>
                    <td>{schedule.status_fa || schedule.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="maintenance-card">
          <h3>Spare parts optimization</h3>
          <div className="spare-parts">
            {spareParts?.map((part, idx) => (
              <div key={idx} className="spare-part-item">
                <div className="part-name">{part.part}</div>
                <div className="part-stock">
                  Stock: {part.current_stock} / required: {part.required}
                </div>
                <div className="part-status">
                  {part.current_stock >= part.required ? (
                    <span className="status-ok">✓ Sufficient</span>
                  ) : (
                    <span className="status-low">⚠ Low stock</span>
                  )}
                </div>
                <div className="part-cost">Cost: ${part.cost}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="maintenance-card">
          <h3>Maintenance cost forecast</h3>
          <div className="cost-forecast">
            <div className="cost-item">
              <div className="cost-label">This month</div>
              <div className="cost-value">$45,000</div>
            </div>
            <div className="cost-item">
              <div className="cost-label">Next month</div>
              <div className="cost-value">$52,000</div>
            </div>
            <div className="cost-item">
              <div className="cost-label">This quarter</div>
              <div className="cost-value">$150,000</div>
            </div>
          </div>
        </div>

        <div className="maintenance-card">
          <h3>Predictive maintenance recommendations</h3>
          <div className="recommendations">
            {rulPredictions
              ?.filter((p) => p.urgency === 'high' || p.urgency === 'critical')
              .map((pred) => (
                <div key={pred.equipment_id} className="recommendation-item">
                  <div className="rec-equipment">{pred.equipment_id}</div>
                  <div className="rec-message">{pred.recommendation}</div>
                  <div className="rec-urgency">
                    Urgency:{' '}
                    <span style={{ color: urgencyColors[pred.urgency] }}>
                      {URGENCY_FA[pred.urgency] || pred.urgency}
                    </span>
                  </div>
                  <div className="rec-window">Maintenance window: {pred.maintenance_window_days} days</div>
                </div>
              ))}
          </div>
        </div>

        <div className="maintenance-card full-width">
          <h3>Preventive maintenance recommendations for the oil and gas field</h3>
          <p className="section-description">
            Smart recommendations to prevent pressure decline, optimize production and perform preventive equipment maintenance
          </p>

          {recLoading ? (
            <div className="loading">Loading recommendations…</div>
          ) : (
            <div className="preventive-recommendations">
              <div className="recommendation-filters">
                <button className="filter-btn active" onClick={() => setSelectedEquipment('all')}>
                  All
                </button>
                <button
                  className="filter-btn"
                  onClick={() => setSelectedEquipment('pressure_maintenance')}
                >
                  Pressure maintenance
                </button>
                <button
                  className="filter-btn"
                  onClick={() => setSelectedEquipment('production_optimization')}
                >
                  Production optimization
                </button>
                <button className="filter-btn" onClick={() => setSelectedEquipment('well_integrity')}>
                  Well integrity
                </button>
                <button
                  className="filter-btn"
                  onClick={() => setSelectedEquipment('equipment_health')}
                >
                  Equipment health
                </button>
              </div>

              <div className="preventive-recommendations-list">
                {preventiveRecommendations
                  ?.filter(
                    (rec: PreventiveMaintenanceRecommendation) =>
                      selectedEquipment === '' ||
                      selectedEquipment === 'all' ||
                      rec.category === selectedEquipment
                  )
                  .sort(
                    (
                      a: PreventiveMaintenanceRecommendation,
                      b: PreventiveMaintenanceRecommendation
                    ) => {
                      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                      return priorityOrder[a.priority] - priorityOrder[b.priority]
                    }
                  )
                  .map((rec: PreventiveMaintenanceRecommendation) => (
                    <div
                      key={rec.id}
                      className={`preventive-rec-item priority-${rec.priority}`}
                    >
                      <div className="rec-header">
                        <div className="rec-title-section">
                          <h4>{rec.title}</h4>
                          <span className="rec-category">
                            {categoryLabels[rec.category] || rec.category}
                          </span>
                        </div>
                        <div
                          className="rec-priority-badge"
                          style={{ backgroundColor: urgencyColors[rec.priority] }}
                        >
                          {PRIORITY_FA[rec.priority] || rec.priority}
                        </div>
                      </div>

                      <div className="rec-body">
                        <p className="rec-description">{rec.description}</p>

                        <div className="rec-details-grid">
                          <div className="rec-detail-item">
                            <span className="detail-label">Well/equipment:</span>
                            <span className="detail-value">
                              {rec.well_name || rec.equipment_id || 'General'}
                            </span>
                          </div>
                          <div className="rec-detail-item">
                            <span className="detail-label">Impact:</span>
                            <span className="detail-value">{rec.impact}</span>
                          </div>
                          <div className="rec-detail-item">
                            <span className="detail-label">Estimated benefit:</span>
                            <span className="detail-value highlight">{rec.estimated_benefit}</span>
                          </div>
                          <div className="rec-detail-item">
                            <span className="detail-label">Time frame:</span>
                            <span className="detail-value">{rec.timeframe}</span>
                          </div>
                          {rec.cost_estimate && (
                            <div className="rec-detail-item">
                              <span className="detail-label">Estimated cost:</span>
                              <span className="detail-value">
                                ${rec.cost_estimate.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {rec.roi && (
                            <div className="rec-detail-item">
                              <span className="detail-label">Return on investment (ROI):</span>
                              <span className="detail-value highlight">{rec.roi}x</span>
                            </div>
                          )}
                        </div>

                        <div className="rec-actions">
                          <div className="action-required">
                            <strong>Required actions:</strong>
                            <p>{rec.action_required}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {preventiveRecommendations && preventiveRecommendations.length === 0 && (
                <div className="no-recommendations">
                  <p>No recommendations are currently available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
