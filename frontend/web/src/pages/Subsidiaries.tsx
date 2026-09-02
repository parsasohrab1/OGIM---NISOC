import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { operationsAPI } from '../api/services'
import {
  SUBSIDIARIES,
  FLUID_TYPE_LABEL_FA,
  FluidType,
  SubsidiaryRow,
  ReservoirRow,
} from '../data/operationsData'
import './Operations.css'

export default function Subsidiaries() {
  const queryClient = useQueryClient()

  const { data } = useQuery<SubsidiaryRow[]>({
    queryKey: ['operations-subsidiaries'],
    queryFn: async () => {
      try {
        const rows = await operationsAPI.getSubsidiaries()
        return (rows && rows.length ? rows : SUBSIDIARIES) as SubsidiaryRow[]
      } catch {
        return SUBSIDIARIES
      }
    },
  })

  const subsidiaries = data || SUBSIDIARIES
  const [selectedId, setSelectedId] = useState<number>(subsidiaries[0]?.id ?? 1)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selected = useMemo(
    () => subsidiaries.find((s) => s.id === selectedId) || subsidiaries[0],
    [subsidiaries, selectedId]
  )

  function updateReservoirCount(reservoirId: string, wellCount: number) {
    queryClient.setQueryData<SubsidiaryRow[]>(['operations-subsidiaries'], (prev) =>
      (prev || subsidiaries).map((s) =>
        s.id !== selectedId
          ? s
          : {
              ...s,
              reservoirs: s.reservoirs.map((r) => (r.id === reservoirId ? { ...r, well_count: wellCount } : r)),
            }
      )
    )
  }

  function updateActiveWellCount(count: number) {
    queryClient.setQueryData<SubsidiaryRow[]>(['operations-subsidiaries'], (prev) =>
      (prev || subsidiaries).map((s) => (s.id !== selectedId ? s : { ...s, active_well_count: count }))
    )
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setFeedback(null)
    try {
      await operationsAPI.upsertSubsidiary(selected.id, {
        active_well_count: selected.active_well_count,
      })
      await operationsAPI.replaceReservoirs(
        selected.id,
        selected.reservoirs.map((r: ReservoirRow) => ({
          name: r.name,
          fluid_type: r.fluid_type,
          well_count: r.well_count,
        }))
      )
      setFeedback('تغییرات با موفقیت ذخیره شد.')
    } catch {
      setFeedback('سرویس در دسترس نبود؛ تغییرات فقط به‌صورت محلی اعمال شد (حالت آفلاین).')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ops-page">
      <h2>شرکت‌های تابعه شرکت ملی مناطق نفت‌خیز جنوب</h2>
      <p className="ops-subtitle">
        بخش‌بندی کمبویی ۵ شرکت بهره‌برداری تابعه NISOC؛ تعداد مخازن به تفکیک ماهیت سیال و تعداد چاه‌های فعال هر
        شرکت به‌صورت دستی قابل انتخاب و ویرایش است.
      </p>

      <div className="ops-overview">
        {subsidiaries.map((s) => (
          <div
            className="ops-stat-card"
            key={s.id}
            style={{ cursor: 'pointer', outline: s.id === selectedId ? '2px solid #007bff' : 'none' }}
            onClick={() => setSelectedId(s.id)}
          >
            <h3>{s.name_fa}</h3>
            <div className="ops-stat-value">{s.active_well_count}</div>
            <div style={{ fontSize: 11, color: '#888' }}>چاه فعال</div>
          </div>
        ))}
      </div>

      <div className="ops-combo-row">
        <label style={{ fontSize: 13 }}>انتخاب شرکت تابعه:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          style={{ padding: 8, borderRadius: 4, minWidth: 260 }}
        >
          {subsidiaries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name_fa}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="ops-grid">
          <div className="ops-card full">
            <h3>{selected.name_fa}</h3>
            <div className="ops-form-grid">
              <div className="ops-field">
                <label>تعداد چاه فعال</label>
                <input
                  type="number"
                  value={selected.active_well_count}
                  onChange={(e) => updateActiveWellCount(Number(e.target.value))}
                />
              </div>
              <div className="ops-field">
                <label>هدف تولید (bopd)</label>
                <input type="number" value={selected.target_production_bopd} readOnly />
              </div>
            </div>

            <h3 style={{ marginTop: 20 }}>مخازن به تفکیک ماهیت سیال</h3>
            <div className="ops-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>نام مخزن</th>
                    <th>ماهیت سیال</th>
                    <th>تعداد چاه</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.reservoirs.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{FLUID_TYPE_LABEL_FA[r.fluid_type as FluidType] || r.fluid_type}</td>
                      <td>
                        <input
                          type="number"
                          style={{ width: 90 }}
                          value={r.well_count}
                          onChange={(e) => updateReservoirCount(r.id, Number(e.target.value))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="ops-btn" style={{ marginTop: 16 }} onClick={handleSave} disabled={saving}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
            {feedback && <p style={{ marginTop: 10, fontSize: 13, color: '#555' }}>{feedback}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
