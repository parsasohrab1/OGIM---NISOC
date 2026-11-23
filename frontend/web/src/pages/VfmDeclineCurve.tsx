import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import { operationsAPI } from '../api/services'
import { SUBSIDIARIES, generateMockVfmDecline, VfmDeclinePoint } from '../data/operationsData'
import './Operations.css'

const WELLS = SUBSIDIARIES.flatMap((s) =>
  Array.from({ length: Math.min(s.active_well_count, 6) }, (_, i) => `${s.code}-${String(i + 1).padStart(2, '0')}`)
)

export default function VfmDeclineCurve() {
  const [well, setWell] = useState(WELLS[0])

  const { data, isLoading } = useQuery<VfmDeclinePoint[]>({
    queryKey: ['operations-vfm-decline', well],
    queryFn: async () => {
      try {
        const rows = await operationsAPI.getVfmDecline(well)
        return (rows && rows.length ? rows : generateMockVfmDecline(well)) as VfmDeclinePoint[]
      } catch {
        return generateMockVfmDecline(well)
      }
    },
  })

  const points = data || []
  const chartData = points.map((p) => ({
    time: new Date(p.timestamp).toLocaleDateString('fa-IR'),
    vfm: p.vfm_oil_rate_bopd,
    decline: p.decline_predicted_rate_bopd,
    alert: p.alert_flag,
  }))
  const latest = points[points.length - 1]
  const alertPoints = points.filter((p) => p.alert_flag)

  return (
    <div className="ops-page">
      <h2>Virtual flow meter and production decline curve</h2>
      <p className="ops-subtitle">
        Combining virtual flow meter (VFM) data with the production decline curve (Decline Curve) to track the rate of change of each well's flow rate.
      </p>

      <div className="ops-combo-row">
        <label style={{ fontSize: 13 }}>Select well:</label>
        <select value={well} onChange={(e) => setWell(e.target.value)} style={{ padding: 8, borderRadius: 4 }}>
          {WELLS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div className="ops-overview">
        <div className="ops-stat-card">
          <h3>Current VFM rate (bopd)</h3>
          <div className="ops-stat-value">{latest?.vfm_oil_rate_bopd ?? '-'}</div>
        </div>
        <div className="ops-stat-card">
          <h3>Decline curve forecast rate (bopd)</h3>
          <div className="ops-stat-value">{latest?.decline_predicted_rate_bopd ?? '-'}</div>
        </div>
        <div className="ops-stat-card">
          <h3>Deviation percentage from the decline curve</h3>
          <div className="ops-stat-value">{latest?.rate_change_pct ?? 0}%</div>
        </div>
        <div className="ops-stat-card">
          <h3>Alert status</h3>
          <div>
            <span className={`ops-badge ${latest?.alert_flag ? 'alert' : 'ahead'}`}>
              {latest?.alert_flag ? 'Unexpected decline/jump alert' : 'Within normal range'}
            </span>
          </div>
        </div>
      </div>

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>Virtual rate trend versus decline curve — {well}</h3>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vfm" name="Virtual flow meter (VFM)" stroke="#007bff" dot={false} />
                <Line
                  type="monotone"
                  dataKey="decline"
                  name="Production decline curve (Decline)"
                  stroke="#f9a825"
                  strokeDasharray="5 5"
                  dot={false}
                />
                {alertPoints.map((p) => (
                  <ReferenceDot
                    key={p.timestamp}
                    x={new Date(p.timestamp).toLocaleDateString('fa-IR')}
                    y={p.vfm_oil_rate_bopd}
                    r={5}
                    fill="#c62828"
                    stroke="none"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ops-card full">
          <h3>Rate-of-change alert cases (deviation ≥ 10% from the decline curve)</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>VFM rate</th>
                  <th>Forecast rate</th>
                  <th>Deviation percentage</th>
                </tr>
              </thead>
              <tbody>
                {alertPoints.length === 0 && (
                  <tr>
                    <td colSpan={4}>No alert has been recorded.</td>
                  </tr>
                )}
                {alertPoints.map((p) => (
                  <tr key={p.timestamp}>
                    <td>{new Date(p.timestamp).toLocaleDateString('fa-IR')}</td>
                    <td>{p.vfm_oil_rate_bopd}</td>
                    <td>{p.decline_predicted_rate_bopd}</td>
                    <td>{p.rate_change_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
