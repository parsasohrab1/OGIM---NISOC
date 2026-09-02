import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormEvent, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { operationsAPI } from '../api/services'
import { SUBSIDIARIES, generateMockManualReadings, ManualReadingRow } from '../data/operationsData'
import './Operations.css'

const CAN_ENTER_ROLES = new Set([
  'system_admin',
  'hq_operations_chief',
  'subsidiary_ops_manager',
  'field_supervisor',
  'field_operator',
  'data_entry_operator',
])

export default function ManualDataEntry() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: readings } = useQuery<ManualReadingRow[]>({
    queryKey: ['operations-manual-readings'],
    queryFn: async () => {
      try {
        const rows = await operationsAPI.getManualReadings({ limit: 50 })
        return (rows && rows.length ? rows : generateMockManualReadings()) as ManualReadingRow[]
      } catch {
        return generateMockManualReadings()
      }
    },
  })

  const canEnter = !user || CAN_ENTER_ROLES.has(user.role)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)
    const form = new FormData(e.currentTarget)
    const payload = {
      well_name: String(form.get('well_name') || ''),
      subsidiary_id: Number(form.get('subsidiary_id')),
      reading_date: new Date(String(form.get('reading_date'))).toISOString(),
      production_pressure_psi: Number(form.get('production_pressure_psi')) || undefined,
      production_flow_rate_bopd: Number(form.get('production_flow_rate_bopd')) || undefined,
      water_cut_pct: Number(form.get('water_cut_pct')) || undefined,
      gas_rate_mscfd: Number(form.get('gas_rate_mscfd')) || undefined,
      choke_size_64th: Number(form.get('choke_size_64th')) || undefined,
      notes: String(form.get('notes') || '') || undefined,
    }
    try {
      await operationsAPI.submitManualReading(payload)
      setFeedback('اطلاعات با موفقیت ثبت شد.')
    } catch {
      setFeedback('سرویس در دسترس نبود؛ اطلاعات به‌صورت محلی نمایش داده می‌شود (حالت آفلاین).')
    } finally {
      setSubmitting(false)
      e.currentTarget.reset()
      queryClient.setQueryData<ManualReadingRow[]>(['operations-manual-readings'], (prev) => {
        const next: ManualReadingRow = {
          id: Date.now(),
          well_name: payload.well_name,
          subsidiary_id: payload.subsidiary_id,
          reading_date: payload.reading_date,
          production_pressure_psi: payload.production_pressure_psi || 0,
          production_flow_rate_bopd: payload.production_flow_rate_bopd || 0,
          water_cut_pct: payload.water_cut_pct || 0,
          gas_rate_mscfd: payload.gas_rate_mscfd || 0,
          choke_size_64th: payload.choke_size_64th || 0,
        }
        return [next, ...(prev || [])]
      })
    }
  }

  return (
    <div className="ops-page">
      <h2>ثبت دستی اطلاعات چاه</h2>
      <p className="ops-subtitle">
        ورودی دستی داده‌های تولید توسط دست‌اندرکاران شرکت‌های بهره‌برداری برای هر چاه.
      </p>

      <div className="ops-banner">
        به‌دلیل عدم وجود سنسورهای فیزیکی نصب‌شده روی چاه‌ها، داده‌هایی مانند فشار تولید، دبی تولید، درصد آب به نفت
        تولیدی و سایر پارامترهای مرتبط با PLC، تا زمان خرید و نصب سنسورها به‌صورت دستی توسط پرسنل شرکت بهره‌برداری
        ثبت می‌شود. صفحات و ویجت‌های مبتنی بر سنسور به «فاز ۲» — پس از خرید و نصب تجهیزات — موکول شده‌اند.
      </div>

      {!canEnter && (
        <div className="ops-banner">نقش کاربری شما اجازه ثبت داده دستی را ندارد؛ فقط مشاهده امکان‌پذیر است.</div>
      )}

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>ثبت رکورد جدید</h3>
          <form onSubmit={handleSubmit}>
            <div className="ops-form-grid">
              <div className="ops-field">
                <label>نام چاه</label>
                <input name="well_name" required disabled={!canEnter} placeholder="مثال: MRN-05" />
              </div>
              <div className="ops-field">
                <label>شرکت تابعه</label>
                <select name="subsidiary_id" required disabled={!canEnter} defaultValue="">
                  <option value="" disabled>
                    انتخاب کنید
                  </option>
                  {SUBSIDIARIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_fa}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ops-field">
                <label>تاریخ ثبت</label>
                <input type="date" name="reading_date" required disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>فشار تولید (psi)</label>
                <input type="number" step="any" name="production_pressure_psi" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>دبی تولید (bopd)</label>
                <input type="number" step="any" name="production_flow_rate_bopd" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>درصد آب تولیدی (%)</label>
                <input type="number" step="any" name="water_cut_pct" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>دبی گاز (Mscf/d)</label>
                <input type="number" step="any" name="gas_rate_mscfd" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>سایز چوک (۱/۶۴ اینچ)</label>
                <input type="number" step="any" name="choke_size_64th" disabled={!canEnter} />
              </div>
            </div>
            <div className="ops-field" style={{ marginBottom: 14 }}>
              <label>توضیحات</label>
              <textarea name="notes" rows={2} disabled={!canEnter} />
            </div>
            <button type="submit" className="ops-btn" disabled={!canEnter || submitting}>
              {submitting ? 'در حال ثبت...' : 'ثبت اطلاعات'}
            </button>
            {feedback && <p style={{ marginTop: 10, fontSize: 13, color: '#555' }}>{feedback}</p>}
          </form>
        </div>

        <div className="ops-card full">
          <h3>آخرین رکوردهای ثبت‌شده</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>چاه</th>
                  <th>تاریخ</th>
                  <th>فشار (psi)</th>
                  <th>دبی (bopd)</th>
                  <th>آب (%)</th>
                  <th>گاز (Mscf/d)</th>
                  <th>چوک</th>
                </tr>
              </thead>
              <tbody>
                {(readings || []).map((r) => (
                  <tr key={r.id}>
                    <td>{r.well_name}</td>
                    <td>{new Date(r.reading_date).toLocaleDateString('fa-IR')}</td>
                    <td>{r.production_pressure_psi}</td>
                    <td>{r.production_flow_rate_bopd}</td>
                    <td>{r.water_cut_pct}</td>
                    <td>{r.gas_rate_mscfd}</td>
                    <td>{r.choke_size_64th}</td>
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
