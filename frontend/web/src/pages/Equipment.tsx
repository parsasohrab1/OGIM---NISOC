import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { operationsAPI } from '../api/services'
import {
  SUBSIDIARIES,
  EQUIPMENT,
  EQUIPMENT_TYPE_LABEL_FA,
  EQUIPMENT_STATUS_LABEL_FA,
  EquipmentType,
  EquipmentRow,
  generateMockManualReadings,
} from '../data/operationsData'
import './Operations.css'

type TabKey = EquipmentType | 'wells_flowrate'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'mot', label: EQUIPMENT_TYPE_LABEL_FA.mot },
  { key: 'rig', label: EQUIPMENT_TYPE_LABEL_FA.rig },
  { key: 'pipeline', label: EQUIPMENT_TYPE_LABEL_FA.pipeline },
  { key: 'wells_flowrate', label: 'دبی چاه‌های تولیدی' },
  { key: 'truck', label: EQUIPMENT_TYPE_LABEL_FA.truck },
  { key: 'vfm', label: EQUIPMENT_TYPE_LABEL_FA.vfm },
  { key: 'coiled_tubing', label: EQUIPMENT_TYPE_LABEL_FA.coiled_tubing },
  { key: 'massive_acidizing', label: EQUIPMENT_TYPE_LABEL_FA.massive_acidizing },
  { key: 'injectivity', label: EQUIPMENT_TYPE_LABEL_FA.injectivity },
  { key: 'fluid_injection', label: EQUIPMENT_TYPE_LABEL_FA.fluid_injection },
  { key: 'logging', label: EQUIPMENT_TYPE_LABEL_FA.logging },
  { key: 'perforating', label: EQUIPMENT_TYPE_LABEL_FA.perforating },
  { key: 'shutoff_isolation', label: EQUIPMENT_TYPE_LABEL_FA.shutoff_isolation },
  { key: 'mobile_processing_unit', label: EQUIPMENT_TYPE_LABEL_FA.mobile_processing_unit },
  { key: 'slickline', label: EQUIPMENT_TYPE_LABEL_FA.slickline },
  { key: 'workover_rig', label: EQUIPMENT_TYPE_LABEL_FA.workover_rig },
  { key: 'development_rig', label: EQUIPMENT_TYPE_LABEL_FA.development_rig },
]

function subsidiaryName(id: number) {
  return SUBSIDIARIES.find((s) => s.id === id)?.name_fa || '-'
}

export default function Equipment() {
  const [tab, setTab] = useState<TabKey>('mot')

  const { data: equipment } = useQuery<EquipmentRow[]>({
    queryKey: ['operations-equipment'],
    queryFn: async () => {
      try {
        const rows = await operationsAPI.getEquipment()
        return (rows && rows.length ? rows : EQUIPMENT) as EquipmentRow[]
      } catch {
        return EQUIPMENT
      }
    },
  })

  const { data: flowrates } = useQuery({
    queryKey: ['operations-well-flowrates'],
    queryFn: async () => {
      try {
        const rows = await operationsAPI.getManualReadings({ limit: 200 })
        return rows && rows.length ? rows : generateMockManualReadings()
      } catch {
        return generateMockManualReadings()
      }
    },
    enabled: tab === 'wells_flowrate',
  })

  const rows = equipment || EQUIPMENT

  const filtered = useMemo(() => {
    if (tab === 'wells_flowrate') return []
    return rows.filter((e) => e.equipment_type === tab)
  }, [rows, tab])

  const countsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    rows.forEach((e) => {
      counts[e.equipment_type] = (counts[e.equipment_type] || 0) + 1
    })
    return counts
  }, [rows])

  return (
    <div className="ops-page">
      <h2>مدیریت تجهیزات</h2>
      <p className="ops-subtitle">
        تجهیزات MOT، دکل‌های حفاری/تعمیر، خطوط لوله، دبی چاه‌های تولیدی، تراک‌ها، دبی‌سنج مجازی و کویل تیوبینگ.
      </p>

      <div className="ops-overview">
        {TABS.filter((t) => t.key !== 'wells_flowrate').map((t) => (
          <div className="ops-stat-card" key={t.key}>
            <h3>{t.label}</h3>
            <div className="ops-stat-value">{countsByType[t.key] || 0}</div>
          </div>
        ))}
      </div>

      <div className="ops-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ops-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'wells_flowrate' ? (
        <div className="ops-card full">
          <h3>وضعیت دبی چاه‌های تولیدی (بر مبنای آخرین ثبت دستی)</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>چاه</th>
                  <th>شرکت تابعه</th>
                  <th>تاریخ ثبت</th>
                  <th>دبی تولید (bopd)</th>
                  <th>درصد آب</th>
                  <th>دبی گاز (Mscf/d)</th>
                </tr>
              </thead>
              <tbody>
                {(flowrates || []).map((r: any) => (
                  <tr key={r.id}>
                    <td>{r.well_name}</td>
                    <td>{subsidiaryName(r.subsidiary_id)}</td>
                    <td>{new Date(r.reading_date).toLocaleDateString('fa-IR')}</td>
                    <td>{r.production_flow_rate_bopd}</td>
                    <td>{r.water_cut_pct}%</td>
                    <td>{r.gas_rate_mscfd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="ops-card full">
          <h3>
            {TABS.find((t) => t.key === tab)?.label} ({filtered.length})
          </h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>شناسه تجهیز</th>
                  <th>نام</th>
                  <th>شرکت تابعه</th>
                  <th>چاه مرتبط</th>
                  <th>وضعیت</th>
                  <th>فاز</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>{e.equipment_id}</td>
                    <td>{e.name}</td>
                    <td>{subsidiaryName(e.subsidiary_id)}</td>
                    <td>{e.well_name || '-'}</td>
                    <td>{EQUIPMENT_STATUS_LABEL_FA[e.status] || e.status}</td>
                    <td>
                      <span className={`ops-badge ${e.phase === 2 ? 'phase2' : 'phase1'}`}>
                        {e.phase === 2 ? 'فاز ۲ (سنسور)' : 'فاز ۱ (دستی)'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6}>موردی ثبت نشده است.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
