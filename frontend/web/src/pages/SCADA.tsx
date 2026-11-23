import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { FIELD, MARUN_WELLS, STATUS_COLOR, STATUS_LABEL_FA, getMarunLiveState } from '../data/marunField'
import {
  getScadaConnections,
  getScadaTags,
  getModbusMap,
  getDataPipeline,
  scadaSummary,
  tagHistory,
  lightFromQuality,
  getPadOverviews,
  getFacilityHmi,
  getScadaAlarms,
  getInterlocks,
  getOperatorTips,
  getControlSetpoints,
  PROTOCOL_LABEL_FA,
  type ScadaConnection,
  type ScadaTag,
  type ConnStatus,
  type ControlSetpoint,
} from '../data/marunScada'
import './SCADA.css'

type Tab = 'overview' | 'control' | 'alarms' | 'tags' | 'pipeline'

const STATUS_FA: Record<ConnStatus, string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Disconnected',
}

const STATUS_COLOR_CONN: Record<ConnStatus, string> = {
  online: '#2e7d32',
  degraded: '#f9a825',
  offline: '#c62828',
}

const QUALITY_FA = { good: 'Good', uncertain: 'Uncertain', bad: 'Bad' } as const
const SEV_FA = { critical: 'Critical', warning: 'Warning', info: 'Info' } as const
const IL_FA = { armed: 'Armed', tripped: 'Tripped', bypassed: 'Bypassed' } as const

const REG_TYPE_FA: Record<string, string> = {
  Holding: 'Writable setpoint',
  Input: 'Readable feedback',
  Coil: 'Boolean interlock',
}

const TOOLTIP = { background: '#ffffff', border: '1px solid #ccc', borderRadius: 8, color: '#111' }

export default function SCADA() {
  const [tick, setTick] = useState(Date.now())
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedConn, setSelectedConn] = useState('OPC-RTU-PAD-A')
  const [selectedWell, setSelectedWell] = useState('MN-01')
  const [selectedTagId, setSelectedTagId] = useState('MN-01.THP')
  const [connOverride, setConnOverride] = useState<Record<string, ConnStatus>>({})
  const [writeLog, setWriteLog] = useState<string[]>([])
  const [setpoints, setSetpoints] = useState<ControlSetpoint[]>([])

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 8000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    setSetpoints(getControlSetpoints(tick, selectedWell))
  }, [tick, selectedWell])

  const connections = useMemo(() => {
    return getScadaConnections(tick).map((c) =>
      connOverride[c.id] ? { ...c, status: connOverride[c.id] } : c
    )
  }, [tick, connOverride])

  const summary = useMemo(() => {
    const base = scadaSummary(tick)
    const online = connections.filter((c) => c.status === 'online').length
    const degraded = connections.filter((c) => c.status === 'degraded').length
    const offline = connections.filter((c) => c.status === 'offline').length
    return { ...base, online, degraded, offline }
  }, [tick, connections])

  const tags = useMemo(() => getScadaTags(tick), [tick])
  const wells = useMemo(() => getMarunLiveState(tick), [tick])
  const pads = useMemo(() => getPadOverviews(tick), [tick])
  const facility = useMemo(() => getFacilityHmi(tick), [tick])
  const alarms = useMemo(() => getScadaAlarms(tick), [tick])
  const interlocks = useMemo(() => getInterlocks(tick), [tick])
  const tips = useMemo(() => getOperatorTips(tick), [tick])
  const modbus = useMemo(() => getModbusMap(tick, selectedWell), [tick, selectedWell])
  const pipeline = useMemo(() => getDataPipeline(tick), [tick])

  const connTags = useMemo(
    () => tags.filter((t) => t.connectionId === selectedConn),
    [tags, selectedConn]
  )
  const wellTags = useMemo(
    () => tags.filter((t) => t.wellId === selectedWell || t.category === 'facility'),
    [tags, selectedWell]
  )

  const selectedTag: ScadaTag | undefined =
    tags.find((t) => t.id === selectedTagId) || tags[0]

  const history = useMemo(() => {
    if (!selectedTag || typeof selectedTag.value !== 'number') return []
    return tagHistory(selectedTag.id, selectedTag.value)
  }, [selectedTag])

  const padOilChart = useMemo(
    () => pads.map((p) => ({ pad: `Pad ${p.pad}`, oil: p.oil, alarms: p.alarms })),
    [pads]
  )

  const qualityBars = useMemo(() => {
    const g = tags.filter((t) => t.quality === 'good').length
    const u = tags.filter((t) => t.quality === 'uncertain').length
    const b = tags.filter((t) => t.quality === 'bad').length
    return [
      { name: 'Good', value: g, color: '#2e7d32' },
      { name: 'Uncertain', value: u, color: '#f9a825' },
      { name: 'Bad', value: b, color: '#c62828' },
    ]
  }, [tags])

  const selectedWellLive = wells.find((w) => w.id === selectedWell)

  const toggleConn = (c: ScadaConnection) => {
    const next: ConnStatus =
      c.status === 'online' ? 'offline' : c.status === 'offline' ? 'online' : 'online'
    setConnOverride((prev) => ({ ...prev, [c.id]: next }))
    setWriteLog((prev) =>
      [
        `${new Date().toLocaleTimeString('fa-IR')} — ${c.nameFa}: ${STATUS_FA[c.status]} → ${STATUS_FA[next]}`,
        ...prev,
      ].slice(0, 24)
    )
  }

  const applySetpoint = (sp: ControlSetpoint) => {
    setWriteLog((prev) =>
      [
        `${new Date().toLocaleTimeString('en-US')} — sent setpoint "${sp.nameFa}" = ${sp.value} ${sp.unit} → address ${sp.address} (command and control queue)`,
        ...prev,
      ].slice(0, 24)
    )
  }

  const ackAlarm = (title: string) => {
    setWriteLog((prev) =>
      [`${new Date().toLocaleTimeString('en-US')} — alarm acknowledged: ${title}`, ...prev].slice(0, 24)
    )
  }

  return (
    <div className="scada-page deh-scada" dir="rtl">
      <header className="scada-hero">
        <div>
          <p className="scada-client">{FIELD.clientFa}</p>
          <h2>SCADA and logic controller — {FIELD.nameFa}</h2>
          <p className="scada-meta">
            Live monitoring of 24 wells, surface facilities, industrial alarms, safety interlocks and sending control setpoints for sour light-to-medium crude
            API gravity {FIELD.apiGravity}
          </p>
        </div>
        <div className="scada-tabs">
          {(
            [
              ['overview', 'Operations view'],
              ['control', 'Control and setpoints'],
              ['alarms', 'Alarms and interlocks'],
              ['tags', 'Tags and registers'],
              ['pipeline', 'Data path'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="scada-kpis">
        <div className="skpi">
          <span>Field connections</span>
          <strong>
            {summary.online}/{summary.connections}
          </strong>
          <small>
            Degraded {summary.degraded} · disconnected {summary.offline}
          </small>
        </div>
        <div className="skpi">
          <span>Open alarms</span>
          <strong>{alarms.length}</strong>
          <small>
            Critical {alarms.filter((a) => a.severity === 'critical').length} · warning{' '}
            {alarms.filter((a) => a.severity === 'warning').length}
          </small>
        </div>
        <div className="skpi">
          <span>Facility export oil</span>
          <strong>{facility.exportOil.toLocaleString()}</strong>
          <small>barrels per day</small>
        </div>
        <div className="skpi">
          <span>Scan points / second</span>
          <strong>{summary.pointsPerSec.toLocaleString()}</strong>
          <small>Writable tags {summary.writable}</small>
        </div>
      </div>

      {tab === 'overview' && (
        <div className="scada-grid">
          <section className="scada-card wide">
            <h3>Production pads view</h3>
            <div className="pad-grid">
              {pads.map((p) => (
                <button
                  key={p.pad}
                  type="button"
                  className={`pad-card ${p.status}`}
                  onClick={() => {
                    setSelectedWell(p.wellIds[0])
                    setSelectedConn(`OPC-RTU-PAD-${p.pad}`)
                    setTab('control')
                  }}
                >
                  <div className="pad-top">
                    <strong>{p.nameFa}</strong>
                    <em style={{ color: STATUS_COLOR_CONN[p.status] }}>{STATUS_FA[p.status]}</em>
                  </div>
                  <div className="pad-metrics">
                    <div>
                      <small>Oil</small>
                      <b>{p.oil.toLocaleString()}</b>
                    </div>
                    <div>
                      <small>Produced water</small>
                      <b>{p.avgWc}%</b>
                    </div>
                    <div>
                      <small>Wellhead pressure</small>
                      <b>{p.avgThp}</b>
                    </div>
                    <div>
                      <small>Online / alarms</small>
                      <b>
                        {p.online}/4 · {p.alarms}
                      </b>
                    </div>
                  </div>
                  <div className="pad-wells">
                    {p.wellIds.map((id) => {
                      const w = wells.find((x) => x.id === id)!
                      return (
                        <span key={id} style={{ background: STATUS_COLOR[w.status] }}>
                          {id.replace('MN-', '')}
                        </span>
                      )
                    })}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="scada-card">
            <h3>Pad oil rate comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={padOilChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="pad" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="oil" name="Oil (barrels/day)" fill="#42a5f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="scada-card">
            <h3>Live tag quality</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={qualityBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {qualityBars.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="scada-card wide">
            <h3>Surface facilities panel</h3>
            <div className="facility-grid">
              <FacilityStat label="Manifold pressure" value={facility.manifoldPsi} unit="psi" />
              <FacilityStat label="Separator pressure" value={facility.separatorPsi} unit="psi" />
              <FacilityStat label="Separator level" value={facility.separatorLevel} unit="%" warn={facility.separatorLevel > 78 || facility.separatorLevel < 28} />
              <FacilityStat label="Export oil" value={facility.exportOil} unit="bbl/d" />
              <FacilityStat label="Pipeline pressure" value={facility.pipelinePsi} unit="psi" />
              <FacilityStat label="Gas lift header" value={facility.gasLiftHeader} unit="psi" />
              <FacilityStat label="Water injection pressure" value={facility.waterInjectionPsi} unit="psi" />
            </div>
            <ul className="advice-list">
              {facility.advice.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="scada-card">
            <h3>Operator guide</h3>
            <ul className="tip-list">
              {tips.map((t, i) => (
                <li key={i} className={t.priority}>
                  <strong>{t.title}</strong>
                  <p>{t.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="scada-card">
            <h3>Connections (summary)</h3>
            <div className="conn-mini">
              {connections.map((c) => (
                <div key={c.id} className={`conn-mini-row ${c.status}`}>
                  <span>{c.nameFa}</span>
                  <em style={{ color: STATUS_COLOR_CONN[c.status] }}>{STATUS_FA[c.status]}</em>
                  <button type="button" onClick={() => toggleConn(c)}>
                    {c.status === 'online' ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'control' && (
        <div className="scada-grid">
          <section className="scada-card">
            <h3>Select a well for control</h3>
            <div className="well-chips">
              {MARUN_WELLS.map((w) => {
                const live = wells.find((x) => x.id === w.id)!
                return (
                  <button
                    key={w.id}
                    type="button"
                    className={selectedWell === w.id ? 'active' : ''}
                    style={{ borderColor: STATUS_COLOR[live.status] }}
                    onClick={() => setSelectedWell(w.id)}
                  >
                    {w.id.replace('MN-', '')}
                  </button>
                )
              })}
            </div>
            {selectedWellLive && (
              <div className="well-control-summary">
                <p>
                  <strong>{selectedWellLive.nameFa}</strong> — {STATUS_LABEL_FA[selectedWellLive.status]}
                </p>
                <p>
                  Oil {selectedWellLive.oilRate} · produced water {selectedWellLive.waterCut}% · wellhead pressure{' '}
                  {selectedWellLive.thp} psi · pump{' '}
                  {selectedWellLive.pumpOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            )}
          </section>

          <section className="scada-card wide-2">
            <h3>
              Sendable setpoints
              <small>Change the value and send to the command and control queue — real safety requires two-person approval</small>
            </h3>
            <div className="sp-list">
              {setpoints.map((sp) => (
                <div key={sp.key} className="sp-row">
                  <div className="sp-label">
                    <strong>{sp.nameFa}</strong>
                    <span>{sp.purpose}</span>
                    <small dir="ltr">Address {sp.address}</small>
                  </div>
                  <input
                    type="range"
                    min={sp.min}
                    max={sp.max}
                    step={1}
                    value={sp.value}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setSetpoints((prev) =>
                        prev.map((x) => (x.key === sp.key ? { ...x, value: v } : x))
                      )
                    }}
                  />
                  <div className="sp-val">
                    <b>
                      {sp.value} {sp.unit}
                    </b>
                    <button type="button" className="primary" onClick={() => applySetpoint(sp)}>
                      Send
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="scada-card">
            <h3>Related tag trend</h3>
            <div className="tag-pick">
              <select value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)}>
                {wellTags
                  .filter((t) => typeof t.value === 'number')
                  .slice(0, 30)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameFa}
                    </option>
                  ))}
              </select>
            </div>
            {selectedTag && typeof selectedTag.value === 'number' && (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="t" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Line type="monotone" dataKey="value" stroke="#66bb6a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="scada-card">
            <h3>Command log</h3>
            {writeLog.length === 0 ? (
              <p className="muted">No command has been sent yet.</p>
            ) : (
              <ul className="write-log">
                {writeLog.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'alarms' && (
        <div className="scada-grid">
          <section className="scada-card wide-2">
            <h3>
              Live industrial alarms
              <small>Based on well status, tag quality and surface facilities</small>
            </h3>
            <div className="alarm-list">
              {alarms.length === 0 && <p className="muted">There are no open alarms.</p>}
              {alarms.map((a) => (
                <div key={a.id} className={`alarm-card ${a.severity}`}>
                  <div className="alarm-head">
                    <strong>{a.title}</strong>
                    <em>{SEV_FA[a.severity]}</em>
                  </div>
                  <p>{a.detail}</p>
                  <p className="alarm-action">Suggested action: {a.action}</p>
                  <div className="alarm-foot">
                    <span>{a.source}</span>
                    <span>{a.at}</span>
                    {a.wellId && <span>{a.wellId}</span>}
                    <button type="button" onClick={() => ackAlarm(a.title)}>
                      Acknowledge
                    </button>
                    {a.tagId && (
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setSelectedTagId(a.tagId!)
                          if (a.wellId) setSelectedWell(a.wellId)
                          setTab('tags')
                        }}
                      >
                        View tag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="scada-card">
            <h3>Safety interlocks</h3>
            <ul className="interlock-list">
              {interlocks.map((il) => (
                <li key={il.id} className={il.state}>
                  <div>
                    <strong>{il.nameFa}</strong>
                    <em>{IL_FA[il.state]}</em>
                  </div>
                  <p>Condition: {il.condition}</p>
                  <p>Effect: {il.effect}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'tags' && (
        <div className="scada-grid">
          <section className="scada-card">
            <h3>Connection and well</h3>
            <div className="mini-conn-list">
              {connections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={selectedConn === c.id ? 'active' : ''}
                  onClick={() => setSelectedConn(c.id)}
                >
                  <strong>{c.nameFa}</strong>
                  <span style={{ color: STATUS_COLOR_CONN[c.status] }}>{STATUS_FA[c.status]}</span>
                </button>
              ))}
            </div>
            <div className="well-chips">
              {MARUN_WELLS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={selectedWell === w.id ? 'active' : ''}
                  onClick={() => {
                    setSelectedWell(w.id)
                    setSelectedTagId(`${w.id}.THP`)
                  }}
                >
                  {w.id.replace('MN-', '')}
                </button>
              ))}
            </div>
          </section>

          <section className="scada-card wide-2">
            <h3>
              Live tags — {connections.find((c) => c.id === selectedConn)?.nameFa || selectedConn}
              <small>
                {PROTOCOL_LABEL_FA[connections.find((c) => c.id === selectedConn)?.protocol || 'OPC-UA']}
              </small>
            </h3>
            <div className="tag-table-wrap">
              <table className="tag-table">
                <thead>
                  <tr>
                    <th>Quality</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Value</th>
                    <th>Operational purpose</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedConn.startsWith('OPC-FACILITY')
                    ? tags.filter((t) => t.category === 'facility')
                    : selectedConn.startsWith('MB-')
                      ? tags.filter((t) => t.connectionId === selectedConn && (!t.wellId || t.wellId === selectedWell))
                      : connTags.length
                        ? connTags
                        : wellTags.filter((t) => t.protocol === 'OPC-UA' && t.wellId === selectedWell)
                  ).map((t) => (
                    <tr key={t.id} className={selectedTagId === t.id ? 'sel' : ''}>
                      <td>
                        <i className={`qlight ${lightFromQuality(t.quality)}`} title={QUALITY_FA[t.quality]} />
                      </td>
                      <td>
                        <strong>{t.nameFa}</strong>
                      </td>
                      <td dir="ltr" className="mono">
                        {t.address}
                      </td>
                      <td>
                        <b>
                          {typeof t.value === 'boolean' ? (t.value ? 'Active' : 'Inactive') : t.value}
                        </b>{' '}
                        {t.unit}
                      </td>
                      <td className="purpose">{t.purpose}</td>
                      <td>
                        <button type="button" onClick={() => setSelectedTagId(t.id)}>
                          Trend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: '1rem' }}>Controller registers — {selectedWell}</h3>
            <div className="tag-table-wrap">
              <table className="tag-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {modbus.map((r) => (
                    <tr key={`${r.connectionId}-${r.address}`}>
                      <td className="mono" dir="ltr">
                        {r.address}
                      </td>
                      <td>
                        <span className={`reg-type ${r.type.toLowerCase()}`}>
                          {REG_TYPE_FA[r.type] || r.type}
                        </span>
                      </td>
                      <td>
                        <strong>{r.nameFa}</strong>
                      </td>
                      <td>
                        <b>
                          {typeof r.value === 'boolean' ? (r.value ? '1' : '0') : r.value}
                        </b>{' '}
                        {r.unit}
                      </td>
                      <td className="purpose">{r.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="scada-grid">
          <section className="scada-card wide">
            <h3>Data path from the field to the dashboard</h3>
            <div className="pipeline">
              {pipeline.map((hop, i) => (
                <div key={i} className={`pipe-hop ${hop.status}`}>
                  <div className="pipe-from">{hop.from}</div>
                  <div className="pipe-arrow">← {hop.rateHz} Hz →</div>
                  <div className="pipe-to">{hop.to}</div>
                  <em>
                    {hop.status === 'ok' ? 'Stable' : hop.status === 'lag' ? 'Lagging' : 'Disconnected'}
                  </em>
                </div>
              ))}
            </div>
            <ul className="pipe-notes">
              <li>The wellhead terminals of the four pads read wellhead pressure and temperature and the safety status.</li>
              <li>The pump drive and the process controller write the pump speed and the choke valve to maintain the rate.</li>
              <li>Surface facilities (manifold, separator, pipeline) are monitored for production reconciliation and overflow prevention.</li>
              <li>Goal: reduce production stoppages, emergency shutdown safety, and feeding the dashboard smart operator.</li>
            </ul>
          </section>

          <section className="scada-card wide">
            <h3>Operations log</h3>
            {writeLog.length === 0 ? (
              <p className="muted">No operational event has been recorded.</p>
            ) : (
              <ul className="write-log">
                {writeLog.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function FacilityStat({
  label,
  value,
  unit,
  warn,
}: {
  label: string
  value: number
  unit: string
  warn?: boolean
}) {
  return (
    <div className={`facility-stat ${warn ? 'warn' : ''}`}>
      <span>{label}</span>
      <strong>
        {value.toLocaleString()} <small>{unit}</small>
      </strong>
    </div>
  )
}
