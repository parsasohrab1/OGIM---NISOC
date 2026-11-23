import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { operationsAPI } from '../api/services'
import { generateMockProductionStatus, SubsidiaryProductionStatus } from '../data/operationsData'
import './Operations.css'

const STATUS_LABEL_FA: Record<string, string> = {
  ahead: 'Ahead of target',
  behind: 'Behind target',
  on_target: 'On target',
  unknown: 'Unknown',
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
    Target: r.target_bopd,
    Actual: r.actual_bopd,
  }))

  const aheadCount = rows.filter((r) => r.status === 'ahead').length
  const behindCount = rows.filter((r) => r.status === 'behind').length

  return (
    <div className="ops-page">
      <h2>Subsidiary production status</h2>
      <p className="ops-subtitle">
        Production well flow rate, equipment utilization (coiled tubing, truck, rig) and the amount ahead/behind the defined target for
        each of the 5 subsidiary companies.
      </p>

      <div className="ops-overview">
        <div className="ops-stat-card">
          <h3>Companies ahead of target</h3>
          <div className="ops-stat-value" style={{ color: '#1e7e34' }}>
            {aheadCount}
          </div>
        </div>
        <div className="ops-stat-card">
          <h3>Companies behind target</h3>
          <div className="ops-stat-value" style={{ color: '#c62828' }}>
            {behindCount}
          </div>
        </div>
        <div className="ops-stat-card">
          <h3>Total actual production (bopd)</h3>
          <div className="ops-stat-value">{rows.reduce((sum, r) => sum + (r.actual_bopd || 0), 0).toLocaleString('fa-IR')}</div>
        </div>
        <div className="ops-stat-card">
          <h3>Total production target (bopd)</h3>
          <div className="ops-stat-value">{rows.reduce((sum, r) => sum + (r.target_bopd || 0), 0).toLocaleString('fa-IR')}</div>
        </div>
      </div>

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>Target versus actual production by subsidiary</h3>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Target" fill="#f9a825" />
                <Bar dataKey="Actual" fill="#007bff" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ops-card full">
          <h3>Status details of each subsidiary</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subsidiary</th>
                  <th>Active wells</th>
                  <th>Target (bopd)</th>
                  <th>Actual (bopd)</th>
                  <th>Deviation</th>
                  <th>Status</th>
                  <th>Coiled tubing</th>
                  <th>Truck</th>
                  <th>Rig</th>
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
