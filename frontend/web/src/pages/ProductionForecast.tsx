import { useMemo, useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  FIELD,
  STATUS_COLOR,
  STATUS_LABEL_FA,
  buildWellProductionForecasts,
  type WellProductionForecast,
} from '../data/marunField'
import './ProductionForecast.css'

type TabKey = 'decline' | 'watercut' | 'table'

export default function ProductionForecast() {
  const [tick, setTick] = useState(Date.now())
  const [tab, setTab] = useState<TabKey>('decline')
  const [selectedWell, setSelectedWell] = useState('MN-01')

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 20000)
    return () => window.clearInterval(id)
  }, [])

  const forecasts = useMemo(() => buildWellProductionForecasts(tick), [tick])
  const selected = forecasts.find((f) => f.wellId === selectedWell) || forecasts[0]

  const summary = useMemo(() => {
    const avgDecline =
      forecasts.reduce((s, f) => s + f.declineAnnualPct, 0) / Math.max(1, forecasts.length)
    const avgWcRise =
      forecasts.reduce((s, f) => s + f.waterCutRise90d, 0) / Math.max(1, forecasts.length)
    const highDecline = forecasts.filter((f) => f.declineAnnualPct > 25).length
    const highWc = forecasts.filter((f) => f.waterCutIn90d > 60).length
    return {
      avgDecline: Math.round(avgDecline * 10) / 10,
      avgWcRise: Math.round(avgWcRise * 10) / 10,
      highDecline,
      highWc,
    }
  }, [forecasts])

  const compareOil = forecasts.map((f) => ({
    well: f.wellId.replace('MN-', ''),
    now: f.currentOil,
    m3: f.oilIn90d,
    m12: f.series[12]?.oil ?? f.oilIn90d,
  }))

  const compareWc = forecasts.map((f) => ({
    well: f.wellId.replace('MN-', ''),
    now: f.currentWaterCut,
    m3: f.waterCutIn90d,
    m12: f.series[12]?.waterCut ?? f.waterCutIn90d,
  }))

  return (
    <div className="pf-page" dir="rtl">
      <header className="pf-hero">
        <div>
          <p className="pf-client">{FIELD.clientFa}</p>
          <h2>Production forecast — {FIELD.nameFa}</h2>
          <p className="pf-meta">
            Production decline curve and produced water cut for each of the 24 wells · 12-month horizon · sour light-to-medium crude with API gravity {FIELD.apiGravity}°
          </p>
        </div>
      </header>

      <div className="pf-kpis">
        <div className="pf-kpi">
          <span>Average annual decline</span>
          <strong>{summary.avgDecline}%</strong>
        </div>
        <div className="pf-kpi">
          <span>Average 90-day produced water cut growth</span>
          <strong>+{summary.avgWcRise}%</strong>
        </div>
        <div className="pf-kpi warn">
          <span>Wells with high decline (&gt;25%/year)</span>
          <strong>{summary.highDecline}</strong>
        </div>
        <div className="pf-kpi warn">
          <span>Wells with forecast produced water cut &gt;60%</span>
          <strong>{summary.highWc}</strong>
        </div>
      </div>

      <div className="pf-tabs">
        <button
          type="button"
          className={tab === 'decline' ? 'active' : ''}
          onClick={() => setTab('decline')}
        >
          Production decline
        </button>
        <button
          type="button"
          className={tab === 'watercut' ? 'active' : ''}
          onClick={() => setTab('watercut')}
        >
          Produced water
        </button>
        <button
          type="button"
          className={tab === 'table' ? 'active' : ''}
          onClick={() => setTab('table')}
        >
          Table of all wells
        </button>
      </div>

      <div className="pf-well-picker">
        <label>Select well:</label>
        <div className="pf-well-chips">
          {forecasts.map((f) => (
            <button
              key={f.wellId}
              type="button"
              className={selectedWell === f.wellId ? 'active' : ''}
              style={{ borderColor: STATUS_COLOR[f.status] }}
              onClick={() => setSelectedWell(f.wellId)}
            >
              {f.wellId.replace('MN-', '')}
            </button>
          ))}
        </div>
      </div>

      {selected && (tab === 'decline' || tab === 'watercut') && (
        <section className="pf-detail">
          <div className="pf-detail-head">
            <h3>
              {selected.nameFa} ({selected.wellId})
              <em style={{ color: STATUS_COLOR[selected.status] }}>
                {STATUS_LABEL_FA[selected.status]}
              </em>
            </h3>
            <div className="pf-detail-stats">
              <span>
                Current oil: <b>{selected.currentOil} bbl/d</b>
              </span>
              <span>
                Current produced water cut: <b>{selected.currentWaterCut}%</b>
              </span>
              <span>
                30-day decline: <b>{selected.declinePct30d}%</b>
              </span>
              <span>
                Forecast annual decline: <b>{selected.declineAnnualPct}%</b>
              </span>
              <span>
                Produced water cut in 90 days: <b>{selected.waterCutIn90d}%</b> (+{selected.waterCutRise90d})
              </span>
            </div>
          </div>

          {tab === 'decline' && (
            <>
              <div className="pf-chart-card">
                <h4>Oil production decline curve — 12 months</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selected.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ccc', color: '#111' }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="oil"
                      name="Oil rate (bbl/d)"
                      stroke="#42a5f5"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="pf-chart-card">
                <h4>Production decline comparison of all wells (now / 90 days / 12 months)</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={compareOil}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="well" stroke="#888" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ccc', color: '#111' }} />
                    <Legend />
                    <Bar dataKey="now" name="Now" fill="#66bb6a" />
                    <Bar dataKey="m3" name="90 days" fill="#42a5f5" />
                    <Bar dataKey="m12" name="12 months" fill="#ffa726" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {tab === 'watercut' && (
            <>
              <div className="pf-chart-card">
                <h4>Produced water cut forecast — 12 months</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selected.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ccc', color: '#111' }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="waterCut"
                      name="Produced water cut %"
                      stroke="#ab47bc"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="water"
                      name="Water rate (bbl/d)"
                      stroke="#26c6da"
                      strokeDasharray="4 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="pf-chart-card">
                <h4>Produced water cut comparison of all wells (now / 90 days / 12 months)</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={compareWc}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="well" stroke="#888" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#888" domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ccc', color: '#111' }} />
                    <Legend />
                    <Bar dataKey="now" name="Now %" fill="#7e57c2" />
                    <Bar dataKey="m3" name="90 days %" fill="#ab47bc" />
                    <Bar dataKey="m12" name="12 months %" fill="#ec407a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'table' && <ForecastTable forecasts={forecasts} onSelect={setSelectedWell} />}
    </div>
  )
}

function ForecastTable({
  forecasts,
  onSelect,
}: {
  forecasts: WellProductionForecast[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="pf-table-card">
      <h3>Forecast summary of each well</h3>
      <div className="pf-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Well</th>
              <th>Status</th>
              <th>Current oil</th>
              <th>Oil 90 days</th>
              <th>Oil 12 months</th>
              <th>Annual decline</th>
              <th>Current water cut</th>
              <th>Water cut 90 days</th>
              <th>Water cut 12 months</th>
              <th>Δ water cut 90 days</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((f) => (
              <tr key={f.wellId} onClick={() => onSelect(f.wellId)}>
                <td>
                  <strong>{f.wellId}</strong>
                  <div className="sub">{f.nameFa}</div>
                </td>
                <td style={{ color: STATUS_COLOR[f.status] }}>{STATUS_LABEL_FA[f.status]}</td>
                <td>{f.currentOil}</td>
                <td>{f.oilIn90d}</td>
                <td>{f.series[12]?.oil}</td>
                <td className={f.declineAnnualPct > 25 ? 'warn' : ''}>{f.declineAnnualPct}%</td>
                <td>{f.currentWaterCut}%</td>
                <td>{f.waterCutIn90d}%</td>
                <td>{f.series[12]?.waterCut}%</td>
                <td className={f.waterCutRise90d > 4 ? 'warn' : ''}>+{f.waterCutRise90d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
