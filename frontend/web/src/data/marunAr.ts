/**
 * AR / Augmented reality — targeted Maroun field data
 * Coverage: field devices, sessions, AR anchors, BIM overlays, live telemetry
 */
import {
  MARUN_WELLS,
  FIELD,
  STATUS_COLOR,
  STATUS_LABEL_FA,
  getMarunLiveState,
  type WellHealthStatus,
} from './marunField'

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export type ArDeviceType = 'HoloLens 2' | 'RealWear Navigator' | 'Field AR tablet'

export type ArDevice = {
  deviceId: string
  deviceType: ArDeviceType
  userFa: string
  roleFa: string
  locationFa: string
  wellId: string
  connectionStatus: 'connected' | 'disconnected'
  batteryLevel: number
  activeSession: boolean
  signalDbm: number
  lastUpdateFa: string
}

export type ArSession = {
  sessionId: string
  deviceId: string
  userFa: string
  wellId: string
  startTimeFa: string
  durationMin: number
  taskFa: string
  componentsViewed: string[]
  annotationsCreated: number
  dataPointsAccessed: number
  checklistDone: number
  checklistTotal: number
}

export type ArAnchor = {
  id: string
  labelFa: string
  kind: 'wellhead' | 'esp' | 'manifold' | 'separator' | 'pipeline'
  x: number // % in viewport
  y: number
  wellId: string
  status: WellHealthStatus
  hud: {
    thp?: number
    tht?: number
    oil?: number
    waterCut?: number
    vfm?: number
    pumpOnline?: boolean
  }
}

export type ArBimComponent = {
  componentId: string
  nameFa: string
  type: 'pump' | 'valve' | 'model' | 'pipeline' | 'tree' | 'separator'
  locationFa: string
  wellId: string
  status: 'normal' | 'warning' | 'critical'
  realTimeData: {
    pressure?: number
    temperature?: number
    flowRate?: number
    waterCut?: number
    currentA?: number
  }
  arHintFa: string
}

const TECHNICIANS = [
  { name: 'Eng. Rezaei', role: 'Wellhead technician' },
  { name: 'Eng. Karimi', role: 'Electric submersible pump specialist' },
  { name: 'Eng. Ahmadi', role: 'Safety inspector' },
  { name: 'Eng. Mousavi', role: 'Production operator' },
  { name: 'Eng. Nouri', role: 'Field support' },
]

export function buildMarunArDevices(tick = Date.now()): ArDevice[] {
  const live = getMarunLiveState(tick)
  const types: ArDeviceType[] = ['HoloLens 2', 'RealWear Navigator', 'Field AR tablet']
  return Array.from({ length: 5 }, (_, i) => {
    const well = MARUN_WELLS[i * 3]
    const lw = live.find((w) => w.id === well.id) || live[i]
    const r = seeded(i + 11)
    const connected = i !== 4 || r > 0.3
    const tech = TECHNICIANS[i]
    return {
      deviceId: `AR-MN-${String(i + 1).padStart(2, '0')}`,
      deviceType: types[i % 3],
      userFa: tech.name,
      roleFa: tech.role,
      locationFa: `Platform ${well.nameFa}`,
      wellId: well.id,
      connectionStatus: connected ? 'connected' : 'disconnected',
      batteryLevel: connected ? Math.round(35 + r * 60) : 0,
      activeSession: connected && i < 3,
      signalDbm: connected ? Math.round(-55 - r * 25) : -110,
      lastUpdateFa: connected ? 'Just now' : `${10 + Math.floor(r * 20)} minutes ago`,
    }
  })
}

export function buildMarunArSessions(devices: ArDevice[], tick = Date.now()): ArSession[] {
  return devices
    .filter((d) => d.activeSession)
    .map((d, i) => {
      const r = seeded(i + 30)
      const comps = [
        `Christmas tree ${d.wellId}`,
        `Electric submersible pump ${d.wellId}`,
        `Master valve ${d.wellId}`,
        `Wellhead pressure reading ${d.wellId}`,
        `Flow manifold`,
      ].slice(0, 3 + Math.floor(r * 2))
      return {
        sessionId: `SES-MN-${String(i + 1).padStart(3, '0')}`,
        deviceId: d.deviceId,
        userFa: d.userFa,
        wellId: d.wellId,
        startTimeFa: `${8 + i}:${String(10 + i * 7).padStart(2, '0')}`,
        durationMin: Math.round(12 + r * 40),
        taskFa:
          i === 0
            ? 'Wellhead inspection and recording of produced water cut'
            : i === 1
              ? 'Electric submersible pump vibration troubleshooting'
              : 'Confirm the virtual flow meter matches the measurement',
        componentsViewed: comps,
        annotationsCreated: Math.round(1 + r * 5),
        dataPointsAccessed: Math.round(20 + r * 80),
        checklistDone: Math.round(4 + r * 6),
        checklistTotal: 10,
      }
    })
}

/** Visual AR anchors on the field map (24 wells + several facilities) */
export function buildMarunArAnchors(tick = Date.now()): ArAnchor[] {
  const live = getMarunLiveState(tick)
  const wellAnchors: ArAnchor[] = MARUN_WELLS.map((w) => {
    const lw = live.find((x) => x.id === w.id)!
    return {
      id: `ANC-${w.id}`,
      labelFa: w.nameFa,
      kind: 'wellhead',
      x: w.x,
      y: w.y,
      wellId: w.id,
      status: lw.status,
      hud: {
        thp: lw.thp,
        tht: lw.tht,
        oil: lw.oilRate,
        waterCut: lw.waterCut,
        vfm: lw.vfmOilRate,
        pumpOnline: lw.pumpOnline,
      },
    }
  })

  const facilities: ArAnchor[] = [
    {
      id: 'ANC-MANIFOLD',
      labelFa: 'Maroun production manifold',
      kind: 'manifold',
      x: 78,
      y: 42,
      wellId: 'FAC-01',
      status: 'healthy',
      hud: { thp: 920, oil: live.reduce((s, w) => s + (w.status === 'offline' ? 0 : w.oilRate), 0) },
    },
    {
      id: 'ANC-SEP',
      labelFa: 'Three-phase separator',
      kind: 'separator',
      x: 88,
      y: 58,
      wellId: 'FAC-02',
      status: 'warning',
      hud: { thp: 210, tht: 48, waterCut: 34 },
    },
  ]

  return [...wellAnchors, ...facilities]
}

export function buildMarunArBim(wellId: string, tick = Date.now()): ArBimComponent[] {
  const lw = getMarunLiveState(tick).find((w) => w.id === wellId) || getMarunLiveState(tick)[0]
  const st =
    lw.status === 'critical' ? 'critical' : lw.status === 'warning' ? 'warning' : 'normal'

  return [
    {
      componentId: `${wellId}-TREE`,
      nameFa: 'Christmas Tree',
      type: 'tree',
      locationFa: 'Wellhead',
      wellId,
      status: st,
      realTimeData: { pressure: lw.thp, temperature: lw.tht, flowRate: lw.oilRate },
      arHintFa: 'Highlight the master and wing valves in augmented reality — open/closed status on the head-up display',
    },
    {
      componentId: `${wellId}-ESP`,
      nameFa: 'Electric submersible pump',
      type: 'pump',
      locationFa: 'Tubing',
      wellId,
      status: lw.equipmentRisk > 50 ? 'warning' : lw.pumpOnline ? 'normal' : 'critical',
      realTimeData: {
        currentA: lw.pumpOnline ? Math.round(28 + lw.equipmentRisk * 0.15) : 0,
        temperature: lw.pumpOnline ? Math.round(62 + lw.equipmentRisk * 0.2) : undefined,
        flowRate: lw.oilRate,
      },
      arHintFa: 'Show vibration and amperage on the pump nameplate — predictive failure alert',
    },
    {
      componentId: `${wellId}-MV`,
      nameFa: 'Master Valve',
      type: 'valve',
      locationFa: 'Christmas tree',
      wellId,
      status: lw.status === 'offline' ? 'critical' : 'normal',
      realTimeData: { pressure: Math.round(lw.thp * 0.92) },
      arHintFa: 'Show the valve open percentage as a virtual gauge on the component',
    },
    {
      componentId: `${wellId}-VFM`,
      nameFa: 'Virtual flow meter with visual overlay',
      type: 'model',
      locationFa: 'Software model',
      wellId,
      status: Math.abs(lw.oilRate - lw.vfmOilRate) / Math.max(1, lw.oilRate) > 0.08 ? 'warning' : 'normal',
      realTimeData: { flowRate: lw.vfmOilRate, waterCut: lw.waterCut },
      arHintFa: 'Compare the virtual flow meter with the reference rate — no separate physical flow meter needed',
    },
    {
      componentId: `${wellId}-FL`,
      nameFa: 'Production flowline',
      type: 'pipeline',
      locationFa: 'Flowline to manifold',
      wellId,
      status: 'normal',
      realTimeData: {
        flowRate: lw.oilRate + lw.waterRate,
        temperature: Math.round(lw.tht - 4),
        pressure: Math.round(lw.thp * 0.88),
      },
      arHintFa: 'Color-code the pipe path on the ground with its health status',
    },
  ]
}

export function buildArTelemetrySeries(wellId: string, tick = Date.now()) {
  const lw = getMarunLiveState(tick).find((w) => w.id === wellId) || getMarunLiveState(tick)[0]
  return Array.from({ length: 24 }, (_, i) => {
    const drift = Math.sin((i + wellId.length) * 0.45) * 0.04
    return {
      t: `${i}`,
      pressure: Math.round(lw.thp * (1 + drift)),
      temperature: Math.round((lw.tht + drift * 8) * 10) / 10,
      oil: Math.round(lw.oilRate * (1 + drift * 0.5)),
      waterCut: Math.round((lw.waterCut + drift * 5) * 10) / 10,
      vfm: Math.round(lw.vfmOilRate * (1 + drift * 0.3)),
    }
  })
}

export function buildArOverlayPayload(wellId: string, tick = Date.now()) {
  const lw = getMarunLiveState(tick).find((w) => w.id === wellId) || getMarunLiveState(tick)[0]
  const well = MARUN_WELLS.find((w) => w.id === wellId)
  return {
    field: FIELD.nameFa,
    client: FIELD.clientFa,
    well_id: wellId,
    well_name_fa: well?.nameFa,
    oil_api: FIELD.apiGravity,
    status: lw.status,
    status_fa: STATUS_LABEL_FA[lw.status],
    status_color: STATUS_COLOR[lw.status],
    anchors: [
      { id: 'hud-thp', label: 'Wellhead pressure', value: lw.thp, unit: 'psi' },
      { id: 'hud-tht', label: 'Wellhead temperature', value: lw.tht, unit: '°C' },
      { id: 'hud-oil', label: 'Oil', value: lw.oilRate, unit: 'bbl/d' },
      { id: 'hud-wc', label: 'Produced water cut', value: lw.waterCut, unit: '%' },
      { id: 'hud-vfm', label: 'Virtual flow meter', value: lw.vfmOilRate, unit: 'bbl/d' },
    ],
    equipment: {
      pump_online: lw.pumpOnline,
      equipment_risk: lw.equipmentRisk,
      health_score: lw.healthScore,
    },
    guidance_fa: [
      'Point the headset at the Christmas tree to lock the anchor',
      'For the electric submersible pump, focus on the motor nameplate',
      'If the produced water cut is high, open the separator checklist',
    ],
    timestamp: new Date(tick).toISOString(),
  }
}

export { STATUS_COLOR, STATUS_LABEL_FA }
