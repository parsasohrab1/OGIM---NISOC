import { useMemo, useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  FIELD,
  MARUN_WELLS,
  STATUS_COLOR,
  STATUS_LABEL_FA,
  getMarunLiveState,
  fieldTotals,
  type WellLiveState,
  type WellHealthStatus,
} from '../data/marunField'
import './Wells.css'

const TOOLTIP_STYLE = { background: '#ffffff', border: '1px solid #ccc', borderRadius: 8, color: '#111' }

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Synthetic 24-hour time series for the selected well */
function buildWellHistory(well: WellLiveState, hours = 24) {
  const idx = Math.max(0, MARUN_WELLS.findIndex((w) => w.id === well.id))
  const r = seeded(idx + 3)
  return Array.from({ length: hours }, (_, i) => {
    const wave = Math.sin((i / hours) * Math.PI * 2 + r * 6) * 0.06
    const oil = Math.max(40, well.oilRate * (1 + wave - i * 0.0015))
    const wc = Math.min(90, well.waterCut * (1 + Math.abs(wave) * 0.08 + i * 0.0008))
    const thp = Math.round(well.thp * (1 + wave * 0.04))
    const tht = Math.round((well.tht * (1 + wave * 0.02)) * 10) / 10
    const gas = Math.round(well.gasRate * (1 + wave * 0.05))
    const water = Math.round((oil * wc) / Math.max(1, 100 - wc))
    return {
      t: `${String(i).padStart(2, '0')}:00`,
      oil: Math.round(oil),
      gas,
      water,
      waterCut: Math.round(wc * 10) / 10,
      thp,
      tht,
    }
  })
}

export default function Wells() {
  const [tick, setTick] = useState(Date.now())
  const [selectedId, setSelectedId] = useState(MARUN_WELLS[0].id)
  const [view, setView] = useState<'field' | 'detail'>('field')

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 12000)
    return () => window.clearInterval(id)
  }, [])

  const wells = useMemo(() => getMarunLiveState(tick), [tick])
  const totals = useMemo(() => fieldTotals(wells), [wells])
  const selected = wells.find((w) => w.id === selectedId) || wells[0]

  const compareOil = useMemo(
    () =>
      wells.map((w) => ({
        well: w.id.replace('MN-', ''),
        id: w.id,
        oil: w.oilRate,
        vfm: w.vfmOilRate,
        status: w.status,
      })),
    [wells]
  )

  const compareWc = useMemo(
    () =>
      wells.map((w) => ({
        well: w.id.replace('MN-', ''),
        waterCut: w.waterCut,
        status: w.status,
      })),
    [wells]
  )

  const compareHealth = useMemo(
    () =>
      wells.map((w) => ({
        well: w.id.replace('MN-', ''),
        health: w.healthScore,
        risk: w.equipmentRisk,
        status: w.status,
      })),
    [wells]
  )

  const statusPie = useMemo(() => {
    const counts: Record<WellHealthStatus, number> = {
      healthy: 0,
      warning: 0,
      critical: 0,
      offline: 0,
    }
    wells.forEach((w) => {
      counts[w.status] += 1
    })
    return (Object.keys(counts) as WellHealthStatus[]).map((k) => ({
      name: STATUS_LABEL_FA[k],
      value: counts[k],
      key: k,
    }))
  }, [wells])

  const history = useMemo(() => buildWellHistory(selected), [selected])

  const radarData = useMemo(() => {
    const maxOil = Math.max(...wells.map((w) => w.oilRate), 1)
    return [
      { metric: 'Oil', value: Math.round((selected.oilRate / maxOil) * 100) },
      { metric: 'Health', value: selected.healthScore },
      { metric: 'Pressure', value: Math.min(100, Math.round((selected.thp / 2000) * 100)) },
      {
        metric: 'Produced water cut stability',
        value: Math.max(0, Math.round(100 - selected.waterCut)),
      },
      { metric: 'Equipment', value: Math.max(0, 100 - selected.equipmentRisk) },
      {
        metric: 'Inverse decline',
        value: Math.max(0, Math.round(100 - selected.declinePct30d * 8)),
      },
    ]
  }, [selected, wells])

  const phases = useMemo(
    () => [
      { name: 'Oil', value: selected.oilRate, fill: '#42a5f5' },
      { name: 'Water', value: selected.waterRate, fill: '#26c6da' },
      { name: 'Gas×10', value: Math.round(selected.gasRate / 10), fill: '#ab47bc' },
    ],
    [selected]
  )

  const selectWell = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  return (
    <div className="wells-page deh-wells" dir="rtl">
      <header className="wells-hero">
        <div>
          <p className="wells-client">{FIELD.clientFa}</p>
          <h2>Wells of {FIELD.nameFa}</h2>
          <p className="wells-meta">
            Chart view of {FIELD.wellCount} wells · {FIELD.oilTypeFa}, API gravity {FIELD.apiGravity}° · online {totals.online}/
            {FIELD.wellCount}
          </p>
        </div>
        <div className="wells-view-tabs">
          <button type="button" className={view === 'field' ? 'active' : ''} onClick={() => setView('field')}>
            Field view
          </button>
          <button type="button" className={view === 'detail' ? 'active' : ''} onClick={() => setView('detail')}>
            Well details
          </button>
        </div>
      </header>

      <div className="wells-kpi-strip">
        <div className="wkpi">
          <span>Field oil rate</span>
          <strong>{totals.oil.toLocaleString()}</strong>
          <small>bbl/d</small>
        </div>
        <div className="wkpi">
          <span>Average produced water cut</span>
          <strong>{totals.avgWc.toFixed(1)}%</strong>
        </div>
        <div className="wkpi">
          <span>Healthy / warning / problem</span>
          <strong>
            {totals.healthy} · {totals.warning} · {totals.critical}
          </strong>
        </div>
        <div className="wkpi">
          <span>Selected well</span>
          <strong>{selected.id}</strong>
          <small style={{ color: STATUS_COLOR[selected.status] }}>{STATUS_LABEL_FA[selected.status]}</small>
        </div>
      </div>

      {view === 'field' && (
        <>
          <section className="wells-charts-grid">
            <div className="wpanel chart">
              <h3>Oil rate comparison of wells</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={compareOil}
                  onClick={(state: any) => {
                    const id = state?.activePayload?.[0]?.payload?.id
                    if (id) selectWell(id)
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="well" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="oil" name="Oil (bbl/d)" radius={[4, 4, 0, 0]}>
                    {compareOil.map((d) => (
                      <Cell key={d.id} fill={STATUS_COLOR[d.status as WellHealthStatus]} />
                    ))}
                  </Bar>
                  <Bar dataKey="vfm" name="Virtual flow meter" fill="#5c6bc0" radius={[4, 4, 0, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart">
              <h3>Produced water cut per well</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={compareWc}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="well" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="waterCut" name="Produced water cut" radius={[4, 4, 0, 0]}>
                    {compareWc.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.waterCut >= 65 ? '#c62828' : d.waterCut >= 45 ? '#f9a825' : '#00897b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart">
              <h3>Equipment health and risk</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={compareHealth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="well" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Area type="monotone" dataKey="health" name="Health" stroke="#66bb6a" fill="#2e7d32" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="risk" name="Equipment risk" stroke="#ef5350" fill="#c62828" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart pie">
              <h3>Well status distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {statusPie.map((d) => (
                      <Cell key={d.key} fill={STATUS_COLOR[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="wells-cards">
            <h3 className="section-title">Live well cards</h3>
            <div className="wells-card-grid">
              {wells.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`well-viz-card ${w.status} ${selectedId === w.id ? 'selected' : ''}`}
                  onClick={() => selectWell(w.id)}
                >
                  <div className="wvc-top">
                    <div>
                      <strong>{w.id}</strong>
                      <span>{w.nameFa}</span>
                    </div>
                    <i className="wvc-light" style={{ background: STATUS_COLOR[w.status] }} />
                  </div>
                  <div className="wvc-gauge">
                    <div className="wvc-ring" style={{ ['--p' as string]: `${w.healthScore}%`, ['--c' as string]: STATUS_COLOR[w.status] }}>
                      <em>{w.healthScore}</em>
                    </div>
                    <div className="wvc-metrics">
                      <div>
                        <small>Oil</small>
                        <b>{w.oilRate}</b>
                      </div>
                      <div>
                        <small>Water cut</small>
                        <b>{w.waterCut}%</b>
                      </div>
                      <div>
                        <small>Wellhead pressure</small>
                        <b>{w.thp}</b>
                      </div>
                      <div>
                        <small>30d decline</small>
                        <b>{w.declinePct30d}%</b>
                      </div>
                    </div>
                  </div>
                  <div className="wvc-bar">
                    <i style={{ width: `${Math.min(100, (w.oilRate / 1200) * 100)}%` }} />
                  </div>
                  <div className="wvc-foot">
                    <span style={{ color: STATUS_COLOR[w.status] }}>{STATUS_LABEL_FA[w.status]}</span>
                    <span>Electric submersible pump {w.pumpOnline ? 'online' : 'offline'}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {view === 'detail' && selected && (
        <section className="well-detail-view">
          <div className="well-picker-row">
            {wells.map((w) => (
              <button
                key={w.id}
                type="button"
                className={selectedId === w.id ? 'active' : ''}
                style={{ borderColor: STATUS_COLOR[w.status] }}
                onClick={() => setSelectedId(w.id)}
              >
                {w.id.replace('MN-', '')}
              </button>
            ))}
          </div>

          <div className="detail-hero">
            <div>
              <h3>
                {selected.nameFa}{' '}
                <span style={{ color: STATUS_COLOR[selected.status] }}>
                  ({STATUS_LABEL_FA[selected.status]})
                </span>
              </h3>
              <p>
                Virtual flow meter {selected.vfmOilRate} bbl/d · equipment risk {selected.equipmentRisk}% · last seen{' '}
                {selected.lastSeenMin} minutes ago
              </p>
            </div>
            <div className="detail-stats">
              <DetailStat label="Oil" value={`${selected.oilRate}`} unit="bbl/d" />
              <DetailStat label="Gas" value={`${selected.gasRate}`} unit="Mscf/d" />
              <DetailStat label="Water" value={`${selected.waterRate}`} unit="bbl/d" />
              <DetailStat label="Produced water cut" value={`${selected.waterCut}`} unit="%" />
              <DetailStat label="Wellhead pressure" value={`${selected.thp}`} unit="psi" />
              <DetailStat label="Wellhead temperature" value={`${selected.tht}`} unit="°C" />
            </div>
          </div>

          <div className="detail-charts">
            <div className="wpanel chart">
              <h3>24-hour trend — oil / water / gas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="t" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Area type="monotone" dataKey="oil" name="Oil" stroke="#42a5f5" fill="#1565c0" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="water" name="Water" stroke="#26c6da" fill="#00838f" fillOpacity={0.25} />
                  <Line type="monotone" dataKey="gas" name="Gas" stroke="#ce93d8" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart">
              <h3>Wellhead pressure and temperature</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="t" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" stroke="#888" />
                  <YAxis yAxisId="r" orientation="left" stroke="#888" hide />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line yAxisId="l" type="monotone" dataKey="thp" name="Wellhead pressure (psi)" stroke="#ffa726" strokeWidth={2} dot={false} />
                  <Line yAxisId="l" type="monotone" dataKey="tht" name="Wellhead temperature (°C)" stroke="#66bb6a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart">
              <h3>Well performance profile</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#444" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#555', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#666', fontSize: 10 }} />
                  <Radar name={selected.id} dataKey="value" stroke="#8bc34a" fill="#8bc34a" fillOpacity={0.4} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart">
              <h3>Produced phase composition</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={phases} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {phases.map((p) => (
                      <Cell key={p.name} fill={p.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="wpanel chart wide">
              <h3>Produced water cut trend (24 hours)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="t" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="waterCut" name="Produced water cut %" stroke="#ab47bc" fill="#6a1b9a" fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function DetailStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="detail-stat">
      <span>{label}</span>
      <strong>
        {value} <small>{unit}</small>
      </strong>
    </div>
  )
}
