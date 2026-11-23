import { useState } from 'react'
import { FIELD } from '../data/marunField'
import './SystemArchitecture.css'

type SectionId =
  | 'sensors'
  | 'loggers'
  | 'interfaces'
  | 'protocols'
  | 'ai'
  | 'inputs'
  | 'outputs'
  | 'observability'
  | 'streaming'
  | 'storage'
  | 'services'
  | 'security'
  | 'infra'

type Item = { name: string; nameEn?: string; detail: string; tag?: string }

const SECTIONS: Array<{ id: SectionId; title: string; titleEn: string; items: Item[] }> = [
  {
    id: 'sensors',
    title: 'Sensors and measured variables',
    titleEn: 'Sensors & Measured Variables',
    items: [
      { name: 'Wellhead pressure', nameEn: 'Wellhead Pressure', detail: 'Wellhead pressure — psi' },
      { name: 'Wellhead temperature', nameEn: 'Wellhead Temperature', detail: 'Wellhead temperature — °C' },
      { name: 'Annulus pressure', nameEn: 'Casing Pressure', detail: 'Annulus pressure — psi' },
      { name: 'Oil / gas / water rate', nameEn: 'Oil / Gas / Water Rate', detail: 'Production rate — bbl/d · Mscf/d' },
      { name: 'Produced water cut', nameEn: 'Water Cut', detail: 'Ratio of water to produced fluid — %' },
      { name: 'Gas-to-oil ratio', nameEn: 'Gas–Oil Ratio', detail: 'Gas-to-oil ratio — scf/bbl' },
      { name: 'Electric submersible pump current / vibration / temperature', nameEn: 'Downhole Electric Pump Current / Vibration / Temp', detail: 'Electric submersible pump health' },
      { name: 'Manifold / separator / pipeline pressure', nameEn: 'Manifold / Separator / Pipeline P', detail: 'Surface facilities' },
      { name: 'Separator liquid level', nameEn: 'Separator Level', detail: 'Liquid level — %' },
      { name: '59-variable backend catalog', nameEn: 'Backend Data Variables (59)', detail: 'Pressure, temperature, flow, composition, vibration, electrical, environmental — data-variables-service' },
      { name: 'Oil virtual flow meter', nameEn: 'Virtual Flow Meter', detail: 'Rate estimation without a physical flow meter' },
    ],
  },
  {
    id: 'loggers',
    title: 'Data loggers and edge',
    titleEn: 'Data Loggers & Edge',
    items: [
      { name: 'Edge computing service', nameEn: 'Edge Computing Service', detail: 'Local anomaly, threshold, trend and aggregation — :8009' },
      { name: 'Offline buffer', nameEn: 'Offline Buffer', detail: 'Temporary storage when the network is down (SQLite + DuckDB)' },
      { name: 'Disconnected operation', nameEn: 'Disconnected Operation', detail: 'Edge continues working when the cloud is unavailable' },
      { name: 'Connection monitor', nameEn: 'Connection Monitor', detail: 'Edge ↔ cloud link health monitoring' },
      { name: 'DuckDB time-series storage', nameEn: 'DuckDB TS Storage', detail: 'Fast time-series buffer at the edge' },
      { name: 'Data validation and reconciliation', nameEn: 'Data Validation & Reconciliation', detail: 'Validation, outliers, mass/energy reconciliation, quality score — :8011' },
      { name: 'Sensor health', nameEn: 'Sensor Health', detail: 'Status of each sensor on the ingestion path' },
      { name: 'Time-series compression', nameEn: 'Compression Manager', detail: 'Compression and retention of Timescale data' },
    ],
  },
  {
    id: 'interfaces',
    title: 'Interfaces',
    titleEn: 'Interfaces',
    items: [
      { name: 'REST API gateway', nameEn: 'REST Proxy', detail: 'Single entry for services with a security token and access control' },
      { name: 'Real-time WebSocket', nameEn: 'Realtime WS', detail: 'Live stream for the dashboard' },
      { name: 'Real-time server-sent events', nameEn: 'Server-Sent Events', detail: 'Alternative live stream path' },
      { name: 'Open industrial communication protocol client', nameEn: 'OPC-UA Client', detail: 'SCADA and logic controller read/write' },
      { name: 'Modbus protocol client', nameEn: 'Modbus TCP', detail: 'Logic controller registers' },
      { name: 'Lightweight wireless messaging client', nameEn: 'MQTT Client', detail: 'Wireless sensors — disabled by default' },
      { name: 'Low-power sensor network client', nameEn: 'LoRaWAN', detail: 'Low-power sensor uplink — disabled by default' },
      { name: 'Enterprise resource planning connection', nameEn: 'ERP', detail: 'Maintenance work order (simulated)' },
      { name: 'Key performance indicator gateway', nameEn: 'Executive KPIs', detail: 'Executive indicators and feature usage rate' },
      { name: 'Field mobile application', nameEn: 'Mobile App', detail: 'Field client' },
    ],
  },
  {
    id: 'protocols',
    title: 'Protocols',
    titleEn: 'Protocols',
    items: [
      { name: 'HTTP / REST protocol', detail: 'Service gateway and user interface' },
      { name: 'WebSocket', detail: 'Real-time dashboard stream' },
      { name: 'Server-sent events', detail: 'Server-sent event stream' },
      { name: 'Open industrial communication protocol', detail: 'SCADA / logic controller industrial automation' },
      { name: 'Modbus protocol', detail: 'Register communication with the logic controller' },
      { name: 'Lightweight wireless messaging', detail: 'Wireless sensor messaging' },
      { name: 'Low-power sensor network', detail: 'Field low-power sensor network' },
      { name: 'Kafka message queue', detail: 'Field event bus' },
      { name: 'Open tracing protocol', detail: 'Sending traces to the tracing collector' },
      { name: 'Security token', detail: 'Gateway authentication' },
      { name: 'Mutual service encryption', detail: 'Optional between microservices' },
      { name: 'Time-based one-time password', detail: 'User two-factor authentication' },
    ],
  },
  {
    id: 'ai',
    title: 'Artificial intelligence algorithms',
    titleEn: 'AI / ML Algorithms',
    items: [
      { name: 'Isolation forest', nameEn: 'Isolation Forest', detail: 'Anomaly detection — model registry' },
      { name: 'Random forest', nameEn: 'Random Forest', detail: 'Equipment failure prediction' },
      { name: 'Long short-term memory time-series network', nameEn: 'LSTM', detail: 'Multi-step forecasting' },
      { name: 'Advanced memory network', nameEn: 'Advanced LSTM', detail: 'Advanced per-well forecasting' },
      { name: 'Remaining useful life model', nameEn: 'Remaining Useful Life', detail: 'Remaining useful life of equipment' },
      { name: 'Edge analytics', nameEn: 'Edge Heuristics', detail: 'Local threshold, trend, aggregation and anomaly' },
      { name: 'Model drift detection', nameEn: 'Model Drift', detail: 'Model quality monitoring and version comparison' },
      { name: 'Production decline curve', nameEn: 'Decline Curve', detail: 'Well/field oil rate decline forecast' },
      { name: 'Produced water cut forecast', nameEn: 'Water-Cut Forecast', detail: 'Produced water cut growth over a 90-day/12-month horizon' },
      { name: 'Sample stream processing', nameEn: 'Flink CEP', detail: 'Anomaly pattern detection in the stream — sample' },
    ],
  },
  {
    id: 'inputs',
    title: 'Dashboard inputs',
    titleEn: 'Dashboard Inputs',
    items: [
      { name: 'Live status of the 24 Maroun wells', detail: 'Oil, gas, water, produced water cut, health, equipment risk' },
      { name: 'WebSocket / server-sent event stream', detail: 'Real-time update from the API gateway' },
      { name: 'Alerts (alert gateway)', detail: 'List and status of open alarms' },
      { name: 'Validation and reconciliation data', detail: 'Quality, outliers, production / virtual flow meter reconciliation' },
      { name: '3D digital twin data', detail: 'Well trajectory, depth pressure/temperature, blowout preventer, annulus' },
      { name: 'Augmented reality data', detail: 'Device, session, anchor, facility information model overlay' },
      { name: 'Report builder / BI', detail: 'Report metadata and reporting-service queries' },
      { name: 'Key performance indicator and usage telemetry', detail: 'Recording the usage of each tab/feature' },
      { name: 'SCADA / logic controller connection', detail: 'Open industrial communication protocol and Modbus cards' },
      { name: 'Production forecast', detail: 'Production decline curve and produced water cut series for each well' },
    ],
  },
  {
    id: 'outputs',
    title: 'Dashboard outputs',
    titleEn: 'Dashboard Outputs',
    items: [
      { name: 'Field map and key performance indicator', detail: 'Production and well health summary' },
      { name: 'Production decline curve / produced water cut charts', detail: 'Recharts — field and each well' },
      { name: 'Alert management', detail: 'View, acknowledge, resolve alarms' },
      { name: 'Well table and cards', detail: 'Status of each MN-01…24' },
      { name: 'Data validation and reconciliation report', detail: 'Data quality and reconciliation' },
      { name: 'Predictive maintenance recommendation', detail: 'Remaining useful life and preventive maintenance plan' },
      { name: 'SCADA / logic controller view', detail: 'Protocol status and industrial connections' },
      { name: '3D well twin', detail: 'Three.js / React Three Fiber' },
      { name: 'Field augmented reality view', detail: 'Head-up display and visual overlay on the asset' },
      { name: 'Report builder', detail: 'Custom operational report' },
    ],
  },
  {
    id: 'observability',
    title: 'Grafana, Prometheus and observability',
    titleEn: 'Grafana · Prometheus · Observability',
    items: [
      { name: 'Prometheus', nameEn: ':9090', detail: 'Service metric collection' },
      { name: 'Grafana', nameEn: ':3001', detail: 'System performance monitoring dashboard' },
      { name: 'Open tracing collector', nameEn: 'OpenTelemetry', detail: 'Receiving distributed traces' },
      { name: 'Grafana Tempo', nameEn: ':3200', detail: 'Storing and searching distributed traces' },
      { name: 'Prometheus alarm rules', detail: 'Data quality · model quality · executive indicators' },
      { name: 'Shared metrics and traces', detail: 'Instrumentation inside each microservice' },
      { name: 'Log shipping', detail: 'Existing configuration; log store optional' },
    ],
  },
  {
    id: 'streaming',
    title: 'Kafka and streaming',
    titleEn: 'Kafka & Streaming',
    items: [
      { name: 'Kafka and queue coordinator', detail: 'Field event bus in the local deployment' },
      { name: 'Raw sensor data topic', detail: 'Raw sensor data' },
      { name: 'Processed data topic', detail: 'Processed data' },
      { name: 'Alerts topic', detail: 'Alert event' },
      { name: 'Control commands topic', detail: 'Control commands' },
      { name: 'Critical commands topic', detail: 'Critical / approved commands' },
      { name: 'Sample stream processing', detail: 'Cleansing, enrichment and pattern detection on the stream' },
      { name: 'Redis', detail: 'Cache, session, rate limiting and auxiliary publishing' },
    ],
  },
  {
    id: 'storage',
    title: 'Databases and storage',
    titleEn: 'Databases & Storage',
    items: [
      { name: 'Relational database', detail: 'User, tag, alarm, command, report' },
      { name: 'Time-series database', detail: 'Sensor time tables, compression, retention' },
      { name: 'Multi-node time-series cluster', detail: 'Time-series scalability' },
      { name: 'Redis', detail: 'Cache and rate limiting' },
      { name: 'Edge and offline storage', detail: 'Edge and offline buffer' },
      { name: 'Machine learning model registry', detail: 'Machine learning model tracking' },
      { name: 'Trained models volume', detail: 'Trained model artifacts' },
    ],
  },
  {
    id: 'services',
    title: 'Microservices',
    titleEn: 'Microservices',
    items: [
      { name: 'API gateway', detail: 'Proxy, WebSocket / server-sent events, key performance indicator, security' },
      { name: 'Authentication service', detail: 'Security token, user, two-factor authentication' },
      { name: 'Data ingestion service', detail: 'Sensor ingestion and industrial protocols' },
      { name: 'Machine learning inference service', detail: 'Anomaly, failure, forecast, remaining useful life' },
      { name: 'Alert service', detail: 'Rules, root cause analysis, notification' },
      { name: 'Reporting service', detail: 'Reports, business intelligence, lineage, workflow' },
      { name: 'Command and control service', detail: 'Control command lifecycle' },
      { name: 'Tag catalog service', detail: 'Tag catalog' },
      { name: 'Digital twin service', detail: 'Simulation, 3D model, what-if, augmented reality' },
      { name: 'Edge computing service', detail: 'Edge analytics' },
      { name: 'Enterprise resource integration service', detail: 'Maintenance work order' },
      { name: 'Data validation and reconciliation service', detail: 'Validation and reconciliation' },
      { name: 'Remote operations service', detail: 'Setpoint, valve, emergency shutdown' },
      { name: 'Data variables service', detail: 'Variable catalog' },
      { name: 'Storage optimization service', detail: 'Compression and retention' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    titleEn: 'Security',
    items: [
      { name: 'Access and refresh token', detail: 'Gateway authentication' },
      { name: 'Role-based access control', detail: 'Roles: admin · operator · engineer · viewer' },
      { name: 'Two-factor authentication', detail: 'Time-based one-time password' },
      { name: 'Rate limiter', detail: 'Role-based rate limiting' },
      { name: 'Threat detection / security event management', detail: 'Risk score and security event' },
      { name: 'Input validation', detail: 'Injection protection at the gateway' },
      { name: 'Industrial security', detail: 'Modbus packet validation and message signing' },
      { name: 'Secure command workflow', detail: 'Simulation ← two-person approval ← execution' },
      { name: 'Mutual service encryption', detail: 'Mutual encryption between services' },
    ],
  },
  {
    id: 'infra',
    title: 'Infrastructure',
    titleEn: 'Infrastructure',
    items: [
      { name: 'Containerized development deployment', detail: 'Full local stack: database, Kafka, services, Grafana, Prometheus' },
      { name: 'Orchestration manifests', detail: 'Deployment of database, Redis, Kafka, time-series, gateway' },
      { name: 'Grafana configuration', detail: 'Predefined data source and performance monitoring dashboard' },
      { name: 'Responsive web interface', detail: 'Oil and gas field smartification web dashboard' },
      { name: 'Data and chart libraries', detail: 'Data, network communication, charts' },
      { name: '3D engine', detail: '3D well display' },
      { name: 'Progressive web application', detail: 'Installability and partial offline operation' },
      { name: 'Dashboard startup script', detail: 'Quick local dashboard startup' },
    ],
  },
]

export default function SystemArchitecture() {
  const [active, setActive] = useState<SectionId>('sensors')
  const section = SECTIONS.find((s) => s.id === active) || SECTIONS[0]

  return (
    <div className="sys-page" dir="rtl">
      <header className="sys-hero">
        <div>
          <p className="sys-client">{FIELD.clientFa}</p>
          <h2>System — architecture and components of oil and gas field smartification</h2>
          <p className="sys-meta">
            {FIELD.nameFa} · list of sensors, loggers, interfaces, protocols, artificial intelligence, dashboard inputs/outputs,
            Grafana, Prometheus, Kafka and the whole software stack
          </p>
        </div>
        <div className="sys-count">
          <strong>{SECTIONS.reduce((n, s) => n + s.items.length, 0)}</strong>
          <span>Documented component</span>
        </div>
      </header>

      <div className="sys-layout">
        <nav className="sys-nav" aria-label="System sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={active === s.id ? 'active' : ''}
              onClick={() => setActive(s.id)}
            >
              <span className="sys-nav-fa">{s.title}</span>
              <em>{s.items.length}</em>
            </button>
          ))}
        </nav>

        <section className="sys-panel">
          <div className="sys-panel-head">
            <h3>{section.title}</h3>
          </div>
          <ul className="sys-grid">
            {section.items.map((item) => (
              <li key={item.name}>
                <div className="sys-item-title">
                  <strong>{item.name}</strong>
                </div>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
