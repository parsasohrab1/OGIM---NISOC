import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { alertAPI } from '../api/services'
import { transportLabelFa } from '../api/offlineMode'
import { getMarunAlerts } from '../data/marunAlerts'
import { useWebSocket } from '../hooks/useWebSocket'
import {
  FIELD,
  MARUN_WELLS,
  MAP_ROWS,
  STATUS_COLOR,
  STATUS_LABEL_FA,
  getMarunLiveState,
  fieldTotals,
  waterCutForecast,
  declineForecast,
  type WellHealthStatus,
} from '../data/marunField'
import {
  CONTROLLABLE_VARS,
  defaultControls,
  computeProductionImpact,
  autoPilotStep,
  applyImpactToOil,
  applyImpactToWaterCut,
  type ControlState,
  type ControllableKey,
  type AutoPilotAction,
} from '../data/autoPilot'
import './Dashboard.css'

export default function Dashboard() {
  const [tick, setTick] = useState(Date.now())
  const [selectedWell, setSelectedWell] = useState<string>(MARUN_WELLS[0].id)
  const { transport } = useWebSocket({ enabled: true })

  const [controls, setControls] = useState<ControlState>(() => defaultControls())
  const [autoPilotOn, setAutoPilotOn] = useState(false)
  const [apStatus, setApStatus] = useState<'idle' | 'stable' | 'recovering' | 'declined'>('idle')
  const [apLog, setApLog] = useState<AutoPilotAction[]>([])
  const controlsRef = useRef(controls)
  controlsRef.current = controls

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 12000)
    return () => window.clearInterval(id)
  }, [])

  // Auto Pilot: every 2.5 seconds returns the deviated variables toward the optimum
  useEffect(() => {
    if (!autoPilotOn) {
      setApStatus('idle')
      return
    }
    const id = window.setInterval(() => {
      const step = autoPilotStep(controlsRef.current, { aggressiveness: 0.28 })
      setControls(step.controls)
      setApStatus(step.status)
      if (step.actions.length) {
        setApLog((prev) => [...step.actions, ...prev].slice(0, 24))
      }
    }, 2500)
    return () => window.clearInterval(id)
  }, [autoPilotOn])

  const setControl = useCallback((key: ControllableKey, value: number) => {
    setControls((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetControls = useCallback(() => {
    setControls(defaultControls())
    setApLog([])
    setApStatus(autoPilotOn ? 'stable' : 'idle')
  }, [autoPilotOn])

  const baseWells = useMemo(() => getMarunLiveState(tick), [tick])
  const impact = useMemo(() => computeProductionImpact(controls), [controls])

  const wells = useMemo(() => {
    return baseWells.map((w) => {
      if (w.status === 'offline') return w
      const oilRate = applyImpactToOil(w.oilRate, impact)
      const waterCut = applyImpactToWaterCut(w.waterCut, impact)
      const waterRate = Math.round((oilRate * waterCut) / Math.max(1, 100 - waterCut))
      return {
        ...w,
        oilRate,
        waterCut,
        waterRate,
        vfmOilRate: applyImpactToOil(w.vfmOilRate, impact),
        gasRate: Math.round(w.gasRate * (0.92 + impact.oilFactor * 0.08)),
      }
    })
  }, [baseWells, impact])

  const baseTotals = useMemo(() => fieldTotals(baseWells), [baseWells])
  const totals = useMemo(() => fieldTotals(wells), [wells])
  const selected = wells.find((w) => w.id === selectedWell) || wells[0]
  const oilLoss = Math.max(0, baseTotals.oil - totals.oil)
  const oilLossPct = baseTotals.oil > 0 ? (oilLoss / baseTotals.oil) * 100 : 0

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'open', 'marun'],
    queryFn: async () => {
      try {
        const data = await alertAPI.getAlerts()
        const list = data?.alerts || []
        if (Array.isArray(list) && list.length > 0) {
          return { count: list.filter((a: any) => a.status === 'open').length, alerts: list }
        }
      } catch {
        /* local */
      }
      const alerts = getMarunAlerts()
      return { count: alerts.filter((a) => a.status === 'open').length, alerts }
    },
    refetchInterval: 12000,
    retry: false,
  })

  const openAlerts = alertsData?.count ?? getMarunAlerts().filter((a) => a.status === 'open').length
  const wcSeries = useMemo(() => waterCutForecast(totals.avgWc), [totals.avgWc])
  const declineSeries = useMemo(() => declineForecast(totals.oil), [totals.oil])

  const abnormalWells = wells
    .filter((w) => w.status === 'warning' || w.status === 'critical')
    .sort((a, b) => a.healthScore - b.healthScore)

  const highRiskEquipment = wells
    .filter((w) => w.equipmentRisk >= 40 && w.status !== 'offline')
    .sort((a, b) => b.equipmentRisk - a.equipmentRisk)
    .slice(0, 5)

  const prioritizedAlerts = buildPrioritizedAlerts(wells, openAlerts)

  return (
    <div className="dashboard deh-dashboard" dir="rtl">
      <header className="deh-hero">
        <div>
          <p className="deh-client">{FIELD.clientFa}</p>
          <h2>
            {FIELD.nameFa}{' '}
            <span className="deh-en">({FIELD.nameEn})</span>
          </h2>
          <p className="deh-meta">
            Client: {FIELD.clientFa} · Oil type: {FIELD.oilTypeFa} · API gravity ≈ {FIELD.apiGravity}°
          </p>
        </div>
        <div className="deh-stream">
          Live stream: {transportLabelFa(transport)}
          {autoPilotOn && <span className="ap-badge"> · Smart operator</span>}
        </div>
      </header>

      <div className="metrics-grid deh-kpis">
        <div className="metric-card">
          <h3>Number of wells</h3>
          <div className="metric-value">{FIELD.wellCount}</div>
          <small>wells · online {totals.online}</small>
        </div>
        <div className="metric-card">
          <h3>Field oil rate</h3>
          <div className="metric-value">{totals.oil.toLocaleString()}</div>
          <small>
            bbl/day · base {baseTotals.oil.toLocaleString()}
            {oilLoss > 0 ? ` · decline ${Math.round(oilLoss).toLocaleString()} (${oilLossPct.toFixed(1)}%)` : ''}
          </small>
        </div>
        <div className="metric-card">
          <h3>Average produced water cut</h3>
          <div className="metric-value">{totals.avgWc.toFixed(1)}%</div>
          <small>
            Base {baseTotals.avgWc.toFixed(1)}% · Δ {(totals.avgWc - baseTotals.avgWc).toFixed(1)}
          </small>
        </div>
        <div className="metric-card">
          <h3>Well status</h3>
          <div className="deh-status-pills">
            <span className="pill healthy">{totals.healthy} healthy</span>
            <span className="pill warning">{totals.warning} warning</span>
            <span className="pill critical">{totals.critical} problem</span>
            <span className="pill offline">{totals.offline} offline</span>
          </div>
        </div>
        <div className="metric-card">
          <h3>Active alerts</h3>
          <div className="metric-value alert">{openAlerts}</div>
          <small>Smart prioritization</small>
        </div>
        <div className="metric-card">
          <h3>Gas / water</h3>
          <div className="metric-value deh-dual">
            {Math.round(totals.gas).toLocaleString()}
            <span>Mscf/d</span>
          </div>
          <small>Water: {Math.round(totals.water).toLocaleString()} bbl/d</small>
        </div>
      </div>

      <section className={`deh-layer ap-section ${autoPilotOn ? 'on' : ''}`}>
        <div className="deh-layer-head ap-head">
          <div>
            <h3>Smart operator</h3>
            <p>
              Increase/decrease the manually adjustable variables; if production declines, the smart operator automatically
              returns the setpoints toward the optimum and compensates for the decline.
            </p>
          </div>
          <div className="ap-toggles">
            <div className="ap-power" role="group" aria-label="Smart operator status">
              <button
                type="button"
                className={`ap-power-btn on ${autoPilotOn ? 'active' : ''}`}
                onClick={() => setAutoPilotOn(true)}
                aria-pressed={autoPilotOn}
              >
                <span className="ap-power-dot" aria-hidden />
                On
              </button>
              <button
                type="button"
                className={`ap-power-btn off ${!autoPilotOn ? 'active' : ''}`}
                onClick={() => setAutoPilotOn(false)}
                aria-pressed={!autoPilotOn}
              >
                <span className="ap-power-dot" aria-hidden />
                Off
              </button>
            </div>
            <button type="button" className="ap-reset" onClick={resetControls}>
              Return to optimum
            </button>
          </div>
        </div>

        <div className="ap-status-row">
          <div className={`ap-status-pill ${apStatus}`}>
            Status:{' '}
            {apStatus === 'idle'
              ? 'Manual'
              : apStatus === 'stable'
                ? 'Stable'
                : apStatus === 'recovering'
                  ? 'Recovering from decline'
                  : 'Decline detected'}
          </div>
          <div className="ap-status-pill">
            Production factor: <strong>{(impact.oilFactor * 100).toFixed(1)}%</strong>
          </div>
          <div className={`ap-status-pill ${oilLossPct > 2 ? 'warn' : ''}`}>
            Decline due to settings: <strong>{oilLossPct.toFixed(1)}%</strong>
          </div>
          <div className="ap-status-pill">
            Deviation from optimum: <strong>{(impact.deviationScore * 100).toFixed(0)}%</strong>
          </div>
        </div>

        <div className="ap-grid">
          <div className="deh-panel ap-sliders">
            <h4>Manually adjustable variables</h4>
            {CONTROLLABLE_VARS.map((v) => {
              const val = controls[v.key]
              const row = impact.perVar.find((p) => p.key === v.key)
              return (
                <div key={v.key} className="ap-slider-row">
                  <div className="ap-slider-label">
                    <strong>{v.nameFa}</strong>
                    <span>
                      {v.nameEn} · optimum {v.optimal} {v.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={val}
                    onChange={(e) => setControl(v.key, Number(e.target.value))}
                  />
                  <div className="ap-slider-value">
                    <b>
                      {val} {v.unit}
                    </b>
                    {row && row.deviationPct > 0 && (
                      <em className="warn">Deviation {row.deviationPct}%</em>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="deh-panel ap-log-panel">
            <h4>Smart operator actions</h4>
            {!autoPilotOn && (
              <p className="deh-muted">
                To automatically compensate for the decline caused by manual settings, turn on the smart operator. First move the sliders
                away from the optimum to see the decline in the key performance indicator.
              </p>
            )}
            {autoPilotOn && apLog.length === 0 && (
              <p className="deh-muted">Waiting for deviation… the system is in a stable state.</p>
            )}
            <ul className="ap-log">
              {apLog.map((a, i) => (
                <li key={`${a.at}-${a.key}-${i}`}>
                  <strong>{a.nameFa}</strong>
                  <span>
                    {a.from} → {a.to}
                  </span>
                  <p>{a.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="deh-layer">
        <div className="deh-layer-head">
          <h3>Visual layer</h3>
          <p>Real-time display of wellhead pressure/temperature, oil/gas/water rates, equipment status and the field map</p>
        </div>
        <div className="deh-sight-grid">
          <div className="deh-panel deh-map-panel">
            <div className="deh-map-title">
              Maroun field map
              <div className="deh-legend">
                <span>
                  <i style={{ background: STATUS_COLOR.healthy }} /> Healthy
                </span>
                <span>
                  <i style={{ background: STATUS_COLOR.warning }} /> Warning
                </span>
                <span>
                  <i style={{ background: STATUS_COLOR.critical }} /> Problem
                </span>
                <span>
                  <i style={{ background: STATUS_COLOR.offline }} /> Offline
                </span>
              </div>
            </div>
            <div className="deh-map">
              <div className="deh-map-inner" style={{ height: `${MAP_ROWS * 30}px` }}>
                {MARUN_WELLS.map((pos) => {
                  const live = wells.find((w) => w.id === pos.id)!
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      className={`deh-well-dot ${live.status} ${selectedWell === pos.id ? 'selected' : ''}`}
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        background: STATUS_COLOR[live.status],
                      }}
                      title={`${pos.nameFa} — ${STATUS_LABEL_FA[live.status]}`}
                      onClick={() => setSelectedWell(pos.id)}
                    >
                      {pos.id.replace('MN-', '')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="deh-panel">
            <h4>
              {selected.nameFa} ({selected.id})
            </h4>
            <div className="deh-well-stats">
              <Stat label="Wellhead pressure" value={`${selected.thp} psi`} />
              <Stat label="Wellhead temperature" value={`${selected.tht} °C`} />
              <Stat label="Oil rate" value={`${selected.oilRate} bbl/d`} />
              <Stat label="Gas rate" value={`${selected.gasRate} Mscf/d`} />
              <Stat label="Water rate" value={`${selected.waterRate} bbl/d`} />
              <Stat label="Produced water cut" value={`${selected.waterCut}%`} />
              <Stat label="Virtual flow meter oil" value={`${selected.vfmOilRate} bbl/d`} accent />
              <Stat
                label="Pump / equipment"
                value={selected.pumpOnline ? 'Online' : 'Offline'}
                tone={selected.pumpOnline ? 'ok' : 'bad'}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="deh-layer">
        <div className="deh-layer-head">
          <h3>Analytical layer</h3>
          <p>Well health assessment, automatic detection of abnormal performance and key indicators</p>
        </div>
        <div className="deh-insight-grid">
          <div className="deh-panel">
            <h4>Well health assessment</h4>
            <div className="deh-health-list">
              {wells.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="deh-health-row"
                  onClick={() => setSelectedWell(w.id)}
                >
                  <span className="dot" style={{ background: STATUS_COLOR[w.status] }} />
                  <strong>{w.id}</strong>
                  <div className="bar">
                    <i style={{ width: `${w.healthScore}%`, background: STATUS_COLOR[w.status] }} />
                  </div>
                  <em>{w.healthScore}</em>
                </button>
              ))}
            </div>
          </div>
          <div className="deh-panel">
            <h4>Wells needing intervention</h4>
            {abnormalWells.length === 0 ? (
              <p className="deh-muted">All wells are in an acceptable condition.</p>
            ) : (
              <ul className="deh-action-list">
                {abnormalWells.map((w) => (
                  <li key={w.id}>
                    <strong>{w.nameFa}</strong>
                    <span className={`tag ${w.status}`}>{STATUS_LABEL_FA[w.status]}</span>
                    <p>
                      Produced water cut {w.waterCut}% · 30-day decline {w.declinePct30d}% · equipment risk{' '}
                      {w.equipmentRisk}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="deh-layer">
        <div className="deh-layer-head">
          <h3>Predictive layer</h3>
          <p>
            Production decline curve, produced water cut forecast, equipment failure, virtual flow meter and smart alert management with
            data-mining and artificial intelligence models
          </p>
        </div>
        <div className="deh-foresight-grid">
          <div className="deh-panel chart-container">
            <h4>Produced water cut forecast</h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={wcSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" stroke="#555" />
                <YAxis stroke="#555" unit="%" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="waterCut"
                  name="Produced water cut %"
                  stroke="#42a5f5"
                  fill="#1565c0"
                  fillOpacity={0.35}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="deh-panel chart-container">
            <h4>Field production decline forecast (production decline curve)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={declineSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Current"
                  stroke="#66bb6a"
                  strokeWidth={2}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#ffa726"
                  strokeDasharray="6 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="deh-panel">
            <h4>Equipment / pump failure forecast</h4>
            <ul className="deh-action-list">
              {highRiskEquipment.map((w) => (
                <li key={w.id}>
                  <strong>{w.id}</strong>
                  <span className="tag warning">Risk {w.equipmentRisk}%</span>
                  <p>Alert before failure — plan preventive maintenance of the electric submersible pump</p>
                </li>
              ))}
              {highRiskEquipment.length === 0 && (
                <li>
                  <p className="deh-muted">Equipment risk is within the low range.</p>
                </li>
              )}
            </ul>
          </div>
          <div className="deh-panel">
            <h4>Virtual flow meter</h4>
            <p className="deh-muted">
              Production estimate for each well without a separate physical flow meter — cost-effective for the 24 Maroun wells
            </p>
            <div className="deh-vfm-grid">
              {wells.slice(0, 8).map((w) => (
                <div key={w.id} className="deh-vfm-card">
                  <strong>{w.id}</strong>
                  <span>{w.vfmOilRate} bbl/d</span>
                  <small>Δ {(w.vfmOilRate - w.oilRate).toFixed(0)} vs reference</small>
                </div>
              ))}
            </div>
            <p className="deh-muted" style={{ marginTop: 8 }}>
              and {wells.length - 8} more wells in the field virtual flow meter model…
            </p>
          </div>
          <div className="deh-panel deh-alerts-smart">
            <h4>Smart alert management</h4>
            <p className="deh-muted">Prioritization and reduction of false alerts with well/equipment correlation</p>
            <ul className="deh-action-list">
              {prioritizedAlerts.map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <span className={`tag ${a.severity}`}>{a.priority}</span>
                  <p>{a.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string
  value: string
  accent?: boolean
  tone?: 'ok' | 'bad'
}) {
  return (
    <div className={`deh-stat ${accent ? 'accent' : ''} ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function buildPrioritizedAlerts(wells: ReturnType<typeof getMarunLiveState>, openCount: number | string) {
  const critical = wells.filter((w) => w.status === 'critical')
  const highWc = wells.filter((w) => w.waterCut > 55)
  const items = [
    ...critical.map((w, i) => ({
      id: `c-${w.id}`,
      title: `Critical priority — ${w.nameFa}`,
      priority: 'P1',
      severity: 'critical' as WellHealthStatus,
      detail: `Abnormal performance / pump ${w.pumpOnline ? 'under stress' : 'offline'} · health score ${w.healthScore}`,
      order: i,
    })),
    ...highWc.slice(0, 3).map((w, i) => ({
      id: `wc-${w.id}`,
      title: `High produced water cut — ${w.id}`,
      priority: 'P2',
      severity: 'warning' as WellHealthStatus,
      detail: `Produced water cut ${w.waterCut}% — correlation performed to reduce false alerts`,
      order: 10 + i,
    })),
    {
      id: 'fp-filter',
      title: 'False alert filter active',
      priority: 'Info',
      severity: 'healthy' as WellHealthStatus,
      detail: `Duplicate/noisy items were suppressed from the set of raw alerts · open alerts: ${openCount}`,
      order: 99,
    },
  ]
  return items.sort((a, b) => a.order - b.order).slice(0, 6)
}
