import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { operationsAPI } from '../api/services'
import { generateMockProductionStatus, SubsidiaryProductionStatus } from '../data/operationsData'
import './Operations.css'

const STATUS_LABEL_FA: Record<string, string> = {
  ahead: 'جلوتر از هدف',
  behind: 'عقب‌تر از هدف',
  on_target: 'مطابق هدف',
  unknown: 'نامشخص',
}

export default function SubsidiaryProduction() {
  const { data, isLoading } = useQuery<SubsidiaryProductionStatus[]>({
    queryKey: ['operations-production-status'],
    queryFn: async () => {
      try {
        const rows = await operationsAPI.getProductionStatus()
        return (rows && rows.length ? rows : generateMockProductionStatus()) as SubsidiaryProductionStatus[]
      } catch {
        return generateMockProductionStatus()
      }
    },
  })

  const rows = data || []
  const chartData = rows.map((r) => ({
    name: r.code,
    هدف: r.target_bopd,
    واقعی: r.actual_bopd,
  }))

  const aheadCount = rows.filter((r) => r.status === 'ahead').length
  const behindCount = rows.filter((r) => r.status === 'behind').length

  return (
    <div className="ops-page">
      <h2>وضعیت تولید شرکت‌های تابعه</h2>
      <p className="ops-subtitle">
        دبی چاه‌های تولیدی، بکارگیری تجهیزات (کویل تیوبینگ، تراک، دکل) و میزان جلو/عقب بودن از هدف تعریف‌شده به
        تفکیک هر یک از ۵ شرکت تابعه.
      </p>

      <div className="ops-overview">
        <div className="ops-stat-card">
          <h3>شرکت‌های جلوتر از هدف</h3>
          <div className="ops-stat-value" style={{ color: '#1e7e34' }}>
            {aheadCount}
          </div>
        </div>
        <div className="ops-stat-card">
          <h3>شرکت‌های عقب‌تر از هدف</h3>
          <div className="ops-stat-value" style={{ color: '#c62828' }}>
            {behindCount}
          </div>
        </div>
        <div className="ops-stat-card">
          <h3>مجموع تولید واقعی (bopd)</h3>
          <div className="ops-stat-value">{rows.reduce((sum, r) => sum + (r.actual_bopd || 0), 0).toLocaleString('fa-IR')}</div>
        </div>
        <div className="ops-stat-card">
          <h3>مجموع هدف تولید (bopd)</h3>
          <div className="ops-stat-value">{rows.reduce((sum, r) => sum + (r.target_bopd || 0), 0).toLocaleString('fa-IR')}</div>
        </div>
      </div>

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>هدف در برابر تولید واقعی به تفکیک شرکت تابعه</h3>
          {isLoading ? (
            <div className="loading">در حال بارگذاری...</div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="هدف" fill="#f9a825" />
                <Bar dataKey="واقعی" fill="#007bff" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ops-card full">
          <h3>جزئیات وضعیت هر شرکت تابعه</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>شرکت تابعه</th>
                  <th>چاه فعال</th>
                  <th>هدف (bopd)</th>
                  <th>واقعی (bopd)</th>
                  <th>انحراف</th>
                  <th>وضعیت</th>
                  <th>کویل تیوبینگ</th>
                  <th>تراک</th>
                  <th>دکل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subsidiary_id}>
                    <td>{r.name_fa}</td>
                    <td>{r.active_well_count}</td>
                    <td>{r.target_bopd?.toLocaleString('fa-IR')}</td>
                    <td>{r.actual_bopd?.toLocaleString('fa-IR')}</td>
                    <td>{r.variance_pct}%</td>
                    <td>
                      <span className={`ops-badge ${r.status}`}>{STATUS_LABEL_FA[r.status] || r.status}</span>
                    </td>
                    <td>{r.equipment_in_use?.coiled_tubing ?? 0}</td>
                    <td>{r.equipment_in_use?.truck ?? 0}</td>
                    <td>{r.equipment_in_use?.rig ?? 0}</td>
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
