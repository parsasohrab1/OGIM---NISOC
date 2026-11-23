import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import apiClient from '../api/client'
import { FIELD, MARUN_WELLS } from '../data/marunField'
import {
  buildMarunDvrQuality,
  buildMarunValidation,
  buildMarunOutliers,
  buildMarunReconciliation,
  dvrFieldSummary,
  type DvrQualityScore,
} from '../data/marunDvr'
import './DVR.css'

export default function DVR() {
  const [tick, setTick] = useState(Date.now())
  const [wellFilter, setWellFilter] = useState<string>('ALL')
  const [selectedSensor, setSelectedSensor] = useState<string>('')

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 15000)
    return () => window.clearInterval(id)
  }, [])

  const localQuality = useMemo(() => buildMarunDvrQuality(tick), [tick])

  const { data: qualityScores = localQuality, isLoading } = useQuery({
    queryKey: ['dvr-quality-marun', tick],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/dvr/quality')
        const remote = response.data as DvrQualityScore[]
        if (Array.isArray(remote) && remote.length >= 8) return remote
      } catch {
        /* use Marun synthetic DVR */
      }
      return buildMarunDvrQuality(tick)
    },
    initialData: localQuality,
    refetchInterval: 30000,
    retry: 0,
  })

  const filtered = useMemo(() => {
    if (wellFilter === 'ALL') return qualityScores
    return qualityScores.filter((s) => s.well_id === wellFilter || s.sensor_id.startsWith(wellFilter))
  }, [qualityScores, wellFilter])

  useEffect(() => {
    if (!selectedSensor && filtered.length > 0) {
      setSelectedSensor(filtered[0].sensor_id)
    }
  }, [filtered, selectedSensor])

  const summary = useMemo(() => dvrFieldSummary(qualityScores), [qualityScores])
  const reconciliation = useMemo(() => buildMarunReconciliation(tick), [tick])

  const validation = useMemo(
    () => (selectedSensor ? buildMarunValidation(selectedSensor, tick) : null),
    [selectedSensor, tick]
  )

  const outliers = useMemo(
    () => (selectedSensor ? buildMarunOutliers(selectedSensor, tick) : []),
    [selectedSensor, tick]
  )

  const chartData = useMemo(() => {
    const byWell = new Map<string, number[]>()
    for (const s of qualityScores) {
      const wid = s.well_id || s.sensor_id.split('.')[0]
      if (!byWell.has(wid)) byWell.set(wid, [])
      byWell.get(wid)!.push(s.quality_score)
    }
    return Array.from(byWell.entries())
      .map(([well, scores]) => ({
        well,
        quality: Number(((scores.reduce((a, b) => a + b, 0) / scores.length) * 100).toFixed(1)),
      }))
      .sort((a, b) => a.well.localeCompare(b.well))
  }, [qualityScores])

  if (isLoading && !qualityScores.length) {
    return <div className="loading">Loading Maroun data validation and reconciliation…</div>
  }

  return (
    <div className="dvr-page deh-dvr" dir="rtl">
      <header className="deh-dvr-hero">
        <div>
          <p className="deh-dvr-client">{FIELD.clientFa}</p>
          <h2>Data validation and reconciliation — {FIELD.nameFa}</h2>
          <p className="deh-dvr-meta">
            Sensor quality control of 24 wells · consistency with the virtual flow meter · mass balance of sour light-to-medium crude production, API gravity{' '}
            {FIELD.apiGravity}°
          </p>
        </div>
      </header>

      <div className="deh-dvr-kpis">
        <div className="deh-dvr-kpi">
          <span>Average data quality</span>
          <strong>{summary.avgQuality}%</strong>
        </div>
        <div className="deh-dvr-kpi">
          <span>Monitored sensors</span>
          <strong>{summary.sensors}</strong>
          <small>{summary.wells} wells</small>
        </div>
        <div className="deh-dvr-kpi warn">
          <span>Quality &lt; 90%</span>
          <strong>{summary.below90}</strong>
        </div>
        <div className="deh-dvr-kpi bad">
          <span>Quality &lt; 70%</span>
          <strong>{summary.below70}</strong>
        </div>
        <div className="deh-dvr-kpi">
          <span>Field imbalance (oil)</span>
          <strong>{reconciliation.field.field_imbalance_pct}%</strong>
          <small>{reconciliation.field.material_wells} wells with material imbalance</small>
        </div>
      </div>

      <div className="dvr-grid">
        <div className="dvr-card deh-dvr-card span-2">
          <h3>Data quality per well (sensor average)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="well" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ccc', color: '#111' }} />
              <Legend />
              <Bar dataKey="quality" name="Quality %" fill="#42a5f5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dvr-card deh-dvr-card span-2">
          <div className="deh-dvr-toolbar">
            <h3>Maroun sensor quality table</h3>
            <select value={wellFilter} onChange={(e) => setWellFilter(e.target.value)}>
              <option value="ALL">All 24 wells</option>
              {MARUN_WELLS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nameFa} ({w.id})
                </option>
              ))}
            </select>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th>Well</th>
                  <th>Variable</th>
                  <th>Quality</th>
                  <th>Completeness</th>
                  <th>Accuracy</th>
                  <th>Freshness</th>
                  <th>Consistency</th>
                  <th>Validity</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 64).map((score) => (
                  <tr
                    key={score.sensor_id}
                    className={selectedSensor === score.sensor_id ? 'selected-row' : ''}
                    onClick={() => setSelectedSensor(score.sensor_id)}
                  >
                    <td>{score.sensor_id}</td>
                    <td>{score.well_id}</td>
                    <td>{score.variable_fa || '—'}</td>
                    <td
                      className={
                        score.quality_score > 0.9
                          ? 'good'
                          : score.quality_score > 0.7
                            ? 'warning'
                            : 'bad'
                      }
                    >
                      {(score.quality_score * 100).toFixed(1)}%
                    </td>
                    <td>{(score.completeness * 100).toFixed(0)}%</td>
                    <td>{(score.accuracy * 100).toFixed(0)}%</td>
                    <td>{(score.timeliness * 100).toFixed(0)}%</td>
                    <td>{(score.consistency * 100).toFixed(0)}%</td>
                    <td>{(score.validity * 100).toFixed(0)}%</td>
                    <td className="issues-cell">
                      {score.issues?.length ? score.issues.join('; ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dvr-card deh-dvr-card">
          <h3>Data point validation</h3>
          <select
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value)}
            className="sensor-select"
          >
            {filtered.map((s) => (
              <option key={s.sensor_id} value={s.sensor_id}>
                {s.sensor_id} — {s.variable_fa}
              </option>
            ))}
          </select>
          {validation && (
            <div className="validation-info">
              <div className={`validation-status ${validation.is_valid ? 'valid' : 'invalid'}`}>
                Status: {validation.is_valid ? 'Valid' : 'Invalid'}
              </div>
              <div>
                Value: <b>{validation.value}</b> {validation.unit}
              </div>
              <div>Validation score: {(validation.validation_score * 100).toFixed(1)}%</div>
              <ul className="rule-list">
                {validation.rule_checks.map((r, i) => (
                  <li key={i} className={r.passed ? 'ok' : 'fail'}>
                    <strong>{r.rule}</strong> — {r.detail}
                  </li>
                ))}
              </ul>
              {validation.violations.length > 0 && (
                <div className="violations">
                  <strong>Violations:</strong>
                  <ul>
                    {validation.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dvr-card deh-dvr-card">
          <h3>Outlier detection</h3>
          {outliers.length === 0 ? (
            <p className="deh-dvr-muted">No significant outlier has been recorded for this sensor.</p>
          ) : (
            <div className="outliers-list">
              {outliers.slice(0, 8).map((o, i) => (
                <div key={i} className={`outlier-item sev-${o.severity}`}>
                  <div>
                    <b>{o.value}</b> · Z={o.outlier_score} · {severityFaDvr(o.severity)}
                  </div>
                  <div>Expected range: {o.expected_range}</div>
                  <div>{o.reason_fa}</div>
                  <div className="ts">{new Date(o.timestamp).toLocaleString('fa-IR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dvr-card deh-dvr-card span-2">
          <h3>Production reconciliation — measurement versus virtual flow meter</h3>
          <p className="deh-dvr-muted">
            Field measured oil:{' '}
            <b>{reconciliation.field.measured_oil_total.toLocaleString()} bbl/d</b> · virtual flow meter:{' '}
            <b>{reconciliation.field.vfm_oil_total.toLocaleString()} bbl/d</b> · reconciled:{' '}
            <b>{reconciliation.field.reconciled_oil_total.toLocaleString()} bbl/d</b>
          </p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Well</th>
                  <th>Measured oil</th>
                  <th>Virtual flow meter</th>
                  <th>Reconciled</th>
                  <th>Imbalance %</th>
                  <th>Measured water cut</th>
                  <th>Reconciled water cut</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.wells.map((w) => (
                  <tr key={w.well_id}>
                    <td>{w.well_id}</td>
                    <td>{w.measured_oil}</td>
                    <td>{w.vfm_oil}</td>
                    <td>{w.reconciled_oil}</td>
                    <td
                      className={
                        w.status === 'material' ? 'bad' : w.status === 'minor' ? 'warning' : 'good'
                      }
                    >
                      {w.imbalance_pct}%
                    </td>
                    <td>{w.water_cut_measured}%</td>
                    <td>{w.water_cut_reconciled}%</td>
                    <td>{statusFa(w.status)}</td>
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

function statusFa(s: string) {
  if (s === 'balanced') return 'Balanced'
  if (s === 'minor') return 'Minor'
  return 'Material'
}

function severityFaDvr(s: string) {
  if (s === 'critical') return 'Critical'
  if (s === 'warning') return 'Warning'
  if (s === 'info') return 'Info'
  return s
}