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
      <h2>دبی‌سنج مجازی و منحنی افت تولید</h2>
      <p className="ops-subtitle">
        تلفیق داده دبی‌سنج مجازی (VFM) با منحنی افت تولید (Decline Curve) برای رصد نرخ تغییر دبی هر چاه.
      </p>

      <div className="ops-combo-row">
        <label style={{ fontSize: 13 }}>انتخاب چاه:</label>
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
          <h3>دبی فعلی VFM (bopd)</h3>
          <div className="ops-stat-value">{latest?.vfm_oil_rate_bopd ?? '-'}</div>
        </div>
        <div className="ops-stat-card">
          <h3>دبی پیش‌بینی منحنی افت (bopd)</h3>
          <div className="ops-stat-value">{latest?.decline_predicted_rate_bopd ?? '-'}</div>
        </div>
        <div className="ops-stat-card">
          <h3>درصد انحراف از منحنی افت</h3>
          <div className="ops-stat-value">{latest?.rate_change_pct ?? 0}%</div>
        </div>
        <div className="ops-stat-card">
          <h3>وضعیت هشدار</h3>
          <div>
            <span className={`ops-badge ${latest?.alert_flag ? 'alert' : 'ahead'}`}>
              {latest?.alert_flag ? 'هشدار افت/جهش غیرمنتظره' : 'در محدوده نرمال'}
            </span>
          </div>
        </div>
      </div>

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>روند دبی مجازی در برابر منحنی افت — {well}</h3>
          {isLoading ? (
            <div className="loading">در حال بارگذاری...</div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vfm" name="دبی‌سنج مجازی (VFM)" stroke="#007bff" dot={false} />
                <Line
                  type="monotone"
                  dataKey="decline"
                  name="منحنی افت تولید (Decline)"
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
          <h3>موارد هشدار نرخ تغییر (انحراف ≥ ۱۰٪ از منحنی افت)</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>تاریخ</th>
                  <th>دبی VFM</th>
                  <th>دبی پیش‌بینی‌شده</th>
                  <th>درصد انحراف</th>
                </tr>
              </thead>
              <tbody>
                {alertPoints.length === 0 && (
                  <tr>
                    <td colSpan={4}>هشداری ثبت نشده است.</td>
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
