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
      setFeedback('The data was recorded successfully.')
    } catch {
      setFeedback('The service was unavailable; the data is displayed locally (offline mode).')
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
      <h2>Manual well data entry</h2>
      <p className="ops-subtitle">
        Manual entry of production data by the operating companies' personnel for each well.
      </p>

      <div className="ops-banner">
        Production pressure, production rate, water cut, gas rate, and choke size are entered manually by the operating company's personnel.
      </div>

      {!canEnter && (
        <div className="ops-banner">Your user role is not allowed to enter manual data; viewing only.</div>
      )}

      <div className="ops-grid">
        <div className="ops-card full">
          <h3>Record a new entry</h3>
          <form onSubmit={handleSubmit}>
            <div className="ops-form-grid">
              <div className="ops-field">
                <label>Well name</label>
                <input name="well_name" required disabled={!canEnter} placeholder="Example: MN-05" />
              </div>
              <div className="ops-field">
                <label>Subsidiary</label>
                <select name="subsidiary_id" required disabled={!canEnter} defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {SUBSIDIARIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_fa}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ops-field">
                <label>Entry date</label>
                <input type="date" name="reading_date" required disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>Production pressure (psi)</label>
                <input type="number" step="any" name="production_pressure_psi" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>Production rate (bopd)</label>
                <input type="number" step="any" name="production_flow_rate_bopd" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>Produced water cut (%)</label>
                <input type="number" step="any" name="water_cut_pct" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>Gas rate (Mscf/d)</label>
                <input type="number" step="any" name="gas_rate_mscfd" disabled={!canEnter} />
              </div>
              <div className="ops-field">
                <label>Choke size (1/64 inch)</label>
                <input type="number" step="any" name="choke_size_64th" disabled={!canEnter} />
              </div>
            </div>
            <div className="ops-field" style={{ marginBottom: 14 }}>
              <label>Notes</label>
              <textarea name="notes" rows={2} disabled={!canEnter} />
            </div>
            <button type="submit" className="ops-btn" disabled={!canEnter || submitting}>
              {submitting ? 'Recording...' : 'Record data'}
            </button>
            {feedback && <p style={{ marginTop: 10, fontSize: 13, color: '#555' }}>{feedback}</p>}
          </form>
        </div>

        <div className="ops-card full">
          <h3>Latest recorded entries</h3>
          <div className="ops-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Well</th>
                  <th>Date</th>
                  <th>Pressure (psi)</th>
                  <th>Rate (bopd)</th>
                  <th>Water (%)</th>
                  <th>Gas (Mscf/d)</th>
                  <th>Choke</th>
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
