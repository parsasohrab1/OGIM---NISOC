import { useQuery } from '@tanstack/react-query'
import { operationsAPI } from '../api/services'
import {
  ROLE_CATALOG,
  ROLE_PERMISSIONS,
  PERMISSION_LABEL_FA,
  HQ_EXPECTED_REPORTS,
} from '../data/operationsData'
import './Operations.css'

interface RoleDef {
  role: string
  level: number
  title_fa: string
  description_fa: string
}

interface AccessLevelsResponse {
  roles: RoleDef[]
  permissions: Record<string, string[]>
  hq_expected_reports: typeof HQ_EXPECTED_REPORTS
}

export default function AccessControl() {
  const { data, isLoading } = useQuery<AccessLevelsResponse>({
    queryKey: ['operations-access-levels'],
    queryFn: async () => {
      try {
        return await operationsAPI.getAccessLevels()
      } catch {
        return {
          roles: ROLE_CATALOG,
          permissions: ROLE_PERMISSIONS,
          hq_expected_reports: HQ_EXPECTED_REPORTS,
        }
      }
    },
  })

  if (isLoading) return <div className="loading">در حال بارگذاری سطوح دسترسی...</div>

  const roles = [...(data?.roles || [])].sort((a, b) => b.level - a.level)
  const permissions = data?.permissions || {}
  const reports = data?.hq_expected_reports || []

  return (
    <div className="ops-page">
      <h2>تعریف سطوح دسترسی</h2>
      <p className="ops-subtitle">
        سلسله‌مراتب نقش‌ها تا سطح «رئیس مهندسی بهره‌برداری ستاد» و گزارش‌های تصمیم‌یار مرتبط با این سمت.
      </p>

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>سلسله‌مراتب نقش‌ها و دسترسی‌ها</h3>
          <div className="ops-role-list">
            {roles.map((r) => (
              <div key={r.role} className={`ops-role-item ${r.role === 'hq_operations_chief' ? 'hq' : ''}`}>
                <h4>
                  {r.title_fa} {r.role === 'hq_operations_chief' && <span className="ops-badge ahead">سمت کلیدی</span>}
                </h4>
                <p>{r.description_fa}</p>
                <div>
                  {(permissions[r.role] || []).map((p) => (
                    <span key={p} className="ops-perm-chip">
                      {PERMISSION_LABEL_FA[p] || p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-card full">
          <h3>گزارش‌های تصمیم‌یار برای رئیس مهندسی بهره‌برداری ستاد</h3>
          <div className="ops-report-list">
            {reports.map((rep) => (
              <div key={rep.id} className="ops-report-item">
                <h4>{rep.title_fa}</h4>
                <p>{rep.description_fa}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
