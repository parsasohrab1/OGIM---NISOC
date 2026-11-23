import { useEffect, useMemo, useState } from 'react'
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
} from 'recharts'
import { digitalTwinAPI } from '../api/services'
import { FIELD, MARUN_WELLS } from '../data/marunField'
import {
  buildMarunArDevices,
  buildMarunArSessions,
  buildMarunArAnchors,
  buildMarunArBim,
  buildArTelemetrySeries,
  buildArOverlayPayload,
  STATUS_COLOR,
  STATUS_LABEL_FA,
  type ArAnchor,
} from '../data/marunAr'
import './ARIntegration.css'

export default function ARIntegration() {
  const [tick, setTick] = useState(Date.now())
  const [selectedDevice, setSelectedDevice] = useState('AR-MN-01')
  const [selectedWell, setSelectedWell] = useState(MARUN_WELLS[0].id)
  const [focusAnchor, setFocusAnchor] = useState<string | null>(null)
  const [hudLocked, setHudLocked] = useState(true)

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 8000)
    return () => window.clearInterval(id)
  }, [])

  const devices = useMemo(() => buildMarunArDevices(tick), [tick])
  const sessions = useMemo(() => buildMarunArSessions(devices, tick), [devices, tick])
  const anchors = useMemo(() => buildMarunArAnchors(tick), [tick])
  const bim = useMemo(() => buildMarunArBim(selectedWell, tick), [selectedWell, tick])
  const series = useMemo(() => buildArTelemetrySeries(selectedWell, tick), [selectedWell, tick])
  const localOverlay = useMemo(() => buildArOverlayPayload(selectedWell, tick), [selectedWell, tick])

  useEffect(() => {
    if (!devices.find((d) => d.deviceId === selectedDevice) && devices[0]) {
      setSelectedDevice(devices[0].deviceId)
    }
  }, [devices, selectedDevice])

  const selectedDeviceData = devices.find((d) => d.deviceId === selectedDevice)
  const focused: ArAnchor | undefined =
    anchors.find((a) => a.id === focusAnchor) ||
    anchors.find((a) => a.wellId === selectedWell) ||
    anchors[0]

  useEffect(() => {
    if (selectedDeviceData?.wellId) {
      setSelectedWell(selectedDeviceData.wellId)
      setFocusAnchor(`ANC-${selectedDeviceData.wellId}`)
    }
  }, [selectedDeviceData?.wellId])

  const { data: remoteOverlay } = useQuery({
    queryKey: ['ar-overlay-deh', selectedWell],
    queryFn: async () => {
      try {
        return await digitalTwinAPI.getAROverlay(selectedWell)
      } catch {
        return null
      }
    },
    refetchInterval: 12000,
    retry: 0,
  })

  const overlay = remoteOverlay?.anchors ? remoteOverlay : localOverlay

  return (
    <div className="ar-integration-page deh-ar" dir="rtl">
      <header className="deh-ar-hero">
        <div>
          <p className="deh-ar-client">{FIELD.clientFa}</p>
          <h1>Field augmented reality — {FIELD.nameFa}</h1>
          <p className="deh-ar-meta">
            Overlay of 24 wells · wellhead head-up display · facility information model components · virtual flow meter and produced water cut on augmented-reality anchors
          </p>
        </div>
        <label className="deh-ar-lock">
          <input type="checkbox" checked={hudLocked} onChange={(e) => setHudLocked(e.target.checked)} />
          Head-up display locked on anchor
        </label>
      </header>

      <div className="ar-stats-grid">
        <div className="stat-card">
          <h3>Online devices</h3>
          <div className="stat-value">
            {devices.filter((d) => d.connectionStatus === 'connected').length}
          </div>
          <div className="stat-label">of {devices.length} field devices</div>
        </div>
        <div className="stat-card">
          <h3>Active sessions</h3>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-label">technicians in the Maroun field</div>
        </div>
        <div className="stat-card">
          <h3>Augmented reality anchors</h3>
          <div className="stat-value">{anchors.length}</div>
          <div className="stat-label">wells + facilities</div>
        </div>
        <div className="stat-card">
          <h3>Data points in session</h3>
          <div className="stat-value">
            {sessions.reduce((s, x) => s + x.dataPointsAccessed, 0)}
          </div>
          <div className="stat-label">Live overlay telemetry</div>
        </div>
      </div>

      {/* —— Visual AR viewport —— */}
      <section className="deh-ar-viewport-wrap">
        <div className="deh-ar-viewport-head">
          <h2>Augmented reality view (field simulation)</h2>
          <select
            value={selectedWell}
            onChange={(e) => {
              setSelectedWell(e.target.value)
              setFocusAnchor(`ANC-${e.target.value}`)
            }}
          >
            {MARUN_WELLS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nameFa} ({w.id})
              </option>
            ))}
          </select>
        </div>

        <div className="deh-ar-viewport">
          <div className="deh-ar-sky" />
          <div className="deh-ar-ground" />
          <div className="deh-ar-reticle" />

          {anchors.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`deh-ar-anchor ${a.kind} ${focused?.id === a.id ? 'focused' : ''}`}
              style={{
                left: `${a.x}%`,
                top: `${a.y}%`,
                borderColor: STATUS_COLOR[a.status],
              }}
              onClick={() => {
                setFocusAnchor(a.id)
                if (a.wellId.startsWith('MN-')) setSelectedWell(a.wellId)
              }}
              title={a.labelFa}
            >
              <i style={{ background: STATUS_COLOR[a.status] }} />
              <span className="anc-label">{a.labelFa.replace('Maroun well ', 'D')}</span>
            </button>
          ))}

          {focused && hudLocked && (
            <div
              className="deh-ar-hud"
              style={{
                left: `min(${Math.min(focused.x + 6, 72)}%, 72%)`,
                top: `min(${Math.max(focused.y - 8, 8)}%, 70%)`,
                borderColor: STATUS_COLOR[focused.status],
              }}
            >
              <div className="hud-title">
                <strong>{focused.labelFa}</strong>
                <em style={{ color: STATUS_COLOR[focused.status] }}>
                  {STATUS_LABEL_FA[focused.status]}
                </em>
              </div>
              <div className="hud-grid">
                {focused.hud.thp != null && (
                  <div>
                    <span>Wellhead pressure</span>
                    <b>{focused.hud.thp} psi</b>
                  </div>
                )}
                {focused.hud.tht != null && (
                  <div>
                    <span>Wellhead temperature</span>
                    <b>{focused.hud.tht} °C</b>
                  </div>
                )}
                {focused.hud.oil != null && (
                  <div>
                    <span>Oil</span>
                    <b>{focused.hud.oil} bbl/d</b>
                  </div>
                )}
                {focused.hud.waterCut != null && (
                  <div>
                    <span>Produced water cut</span>
                    <b>{focused.hud.waterCut}%</b>
                  </div>
                )}
                {focused.hud.vfm != null && (
                  <div className="accent">
                    <span>Virtual flow meter</span>
                    <b>{focused.hud.vfm} bbl/d</b>
                  </div>
                )}
                {focused.hud.pumpOnline != null && (
                  <div>
                    <span>Pump</span>
                    <b>{focused.hud.pumpOnline ? 'Online' : 'Offline'}</b>
                  </div>
                )}
              </div>
              <p className="hud-hint">Anchor locked · live Maroun field data</p>
            </div>
          )}

          <div className="deh-ar-compass">N · Maroun field</div>
        </div>
      </section>

      <div className="ar-content-grid">
        <div className="devices-section">
          <h2>Field augmented reality devices</h2>
          <div className="devices-list">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className={`device-card ${device.connectionStatus} ${
                  selectedDevice === device.deviceId ? 'selected' : ''
                }`}
                onClick={() => setSelectedDevice(device.deviceId)}
              >
                <div className="device-header">
                  <span className="device-id">{device.deviceId}</span>
                  <span className={`connection-status ${device.connectionStatus}`}>
                    {device.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="device-info">
                  <p>
                    <strong>Type:</strong> {device.deviceType}
                  </p>
                  <p>
                    <strong>User:</strong> {device.userFa} ({device.roleFa})
                  </p>
                  <p>
                    <strong>Location:</strong> {device.locationFa}
                  </p>
                  <p>
                    <strong>Well:</strong> {device.wellId}
                  </p>
                  <p>
                    <strong>Signal:</strong> {device.signalDbm} dBm
                  </p>
                  <p>
                    <strong>Last update:</strong> {device.lastUpdateFa}
                  </p>
                </div>
                <div className="battery-indicator">
                  <div className="battery-bar">
                    <div
                      className={`battery-fill ${
                        device.batteryLevel > 50 ? 'high' : device.batteryLevel > 20 ? 'medium' : 'low'
                      }`}
                      style={{ width: `${device.batteryLevel}%` }}
                    />
                  </div>
                  <span className="bat-txt">{device.batteryLevel}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sessions-section">
          <h2>Active field sessions</h2>
          {sessions.length > 0 ? (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.sessionId} className="session-card">
                  <div className="session-header">
                    <h3>{session.userFa}</h3>
                    <span className="session-duration">{session.durationMin} min</span>
                  </div>
                  <div className="session-info">
                    <p>
                      <strong>Mission:</strong> {session.taskFa}
                    </p>
                    <p>
                      <strong>Device:</strong> {session.deviceId}
                    </p>
                    <p>
                      <strong>Well:</strong> {session.wellId}
                    </p>
                    <p>
                      <strong>Start:</strong> {session.startTimeFa}
                    </p>
                    <p>
                      <strong>Checklist:</strong> {session.checklistDone}/{session.checklistTotal}
                    </p>
                    <p>
                      <strong>Annotations:</strong> {session.annotationsCreated}
                    </p>
                  </div>
                  <div className="components-list">
                    <strong>Components seen in augmented reality:</strong>
                    <div className="components-tags">
                      {session.componentsViewed.map((comp) => (
                        <span key={comp} className="component-tag">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-sessions">
              <p>No active session</p>
            </div>
          )}
        </div>
      </div>

      <div className="bim-components-section">
        <h2>Facility information model components displayable in augmented reality — {selectedWell}</h2>
        <p className="section-sub">
          Each component with live data and a visual guide for the headset / tablet technician
        </p>
        <div className="components-grid">
          {bim.map((component) => (
            <div key={component.componentId} className={`component-card ${component.status}`}>
              <div className="component-header">
                <h3>{component.nameFa}</h3>
                <span className={`status-badge ${component.status}`}>
                  {component.status === 'normal'
                    ? 'Normal'
                    : component.status === 'warning'
                      ? 'Warning'
                      : 'Critical'}
                </span>
              </div>
              <div className="component-info">
                <p>
                  <strong>ID:</strong> {component.componentId}
                </p>
                <p>
                  <strong>Type:</strong> {component.type}
                </p>
                <p>
                  <strong>Location:</strong> {component.locationFa}
                </p>
              </div>
              <div className="realtime-data">
                <h4>Live data on the head-up display</h4>
                {component.realTimeData.pressure != null && (
                  <p>
                    Pressure: <strong>{component.realTimeData.pressure} psi</strong>
                  </p>
                )}
                {component.realTimeData.temperature != null && (
                  <p>
                    Temperature: <strong>{component.realTimeData.temperature} °C</strong>
                  </p>
                )}
                {component.realTimeData.flowRate != null && (
                  <p>
                    Flow rate: <strong>{component.realTimeData.flowRate} bbl/d</strong>
                  </p>
                )}
                {component.realTimeData.waterCut != null && (
                  <p>
                    Produced water cut: <strong>{component.realTimeData.waterCut}%</strong>
                  </p>
                )}
                {component.realTimeData.currentA != null && (
                  <p>
                    Electric submersible pump current: <strong>{component.realTimeData.currentA} A</strong>
                  </p>
                )}
              </div>
              <p className="ar-hint">{component.arHintFa}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="realtime-chart-section">
        <h2>Telemetry trend on the augmented reality overlay — {selectedWell}</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="t" stroke="#888" />
              <YAxis yAxisId="left" stroke="#888" />
              <YAxis yAxisId="right" orientation="right" stroke="#888" />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #ccc', color: '#111' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="pressure" stroke="#ef5350" name="Pressure (psi)" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ffa726" name="Temperature (°C)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="oil" stroke="#42a5f5" name="Oil (bbl/d)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="vfm" stroke="#66bb6a" name="Virtual flow meter" strokeDasharray="4 3" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="waterCut" stroke="#ab47bc" name="Produced water cut %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bim-components-section overlay-panel">
        <h2>Overlay package sent to the headset</h2>
        <pre>{JSON.stringify(overlay, null, 2)}</pre>
      </div>
    </div>
  )
}
