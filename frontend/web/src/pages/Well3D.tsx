import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, Html, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useQuery, useMutation } from '@tanstack/react-query'
import { well3DAPI, digitalTwinAPI } from '../api/services'
import { shouldUseLocalLive } from '../api/offlineMode'
import {
  FIELD,
  MARUN_WELLS,
  STATUS_COLOR,
  STATUS_LABEL_FA,
  getMarunLiveState,
  buildMarunWell3DData,
  buildAllMarunWells3D,
} from '../data/marunField'
import './Well3D.css'

interface DepthData {
  depth: number
  pressure: number
  temperature: number
  flowRate: number
  status: 'normal' | 'warning' | 'critical'
}

interface CasingData {
  depth: number
  outerDiameter: number // inches
  innerDiameter: number // inches
  type: 'conductor' | 'surface' | 'intermediate' | 'production'
  cementThickness: number // inches
}

interface BOPData {
  type: string
  pressureRating: number // psi
  stackHeight: number // meters
  status: 'open' | 'closed' | 'maintenance'
}

interface WellheadEquipment {
  christmasTree: {
    height: number
    width: number
    status: 'open' | 'closed'
  }
  masterValve: {
    position: number // 0-100%
    status: 'open' | 'closed'
  }
  wingValve: {
    position: number
    status: 'open' | 'closed'
  }
  chokeValve: {
    position: number
    status: 'open' | 'closed'
  }
  pressureGauges: Array<{
    name: string
    value: number
    unit: string
  }>
  flowMeter: {
    flowRate: number
    unit: string
  }
}

interface Well3DData {
  wellName: string
  totalDepth: number
  depthData: DepthData[]
  surfaceData: {
    wellheadPressure: number
    wellheadTemperature: number
    flowRate: number
  }
  trajectory?: {
    md_points: Array<{ md: number; inclination: number; azimuth: number }>
  }
  riskZones?: Array<{ name: string; fromDepth: number; toDepth: number; severity: 'warning' | 'critical' }>
  bop?: BOPData
  casings?: CasingData[]
  wellheadEquipment?: WellheadEquipment
}

// <Environment preset="..."> fetches an HDR file from a remote CDN, which
// throws (and blanks the whole Canvas) with no internet connection. The
// scene already has its own ambient/directional/point lights, so offline we
// just fall back to a flat background color instead of image-based lighting.
function SceneBackdrop() {
  if (shouldUseLocalLive()) {
    return <color attach="background" args={['#0f172a']} />
  }
  return <Environment preset="sunset" />
}

function valveStatusFa(s: string) {
  if (s === 'open') return 'Open'
  if (s === 'closed') return 'Closed'
  if (s === 'maintenance') return 'Under maintenance'
  return s
}

function casingTypeFa(t: string) {
  if (t === 'conductor') return 'Conductor'
  if (t === 'surface') return 'Surface'
  if (t === 'intermediate') return 'Intermediate'
  if (t === 'production') return 'Production'
  return t
}

function riskLevelFa(s: string) {
  if (s === 'elevated') return 'Elevated'
  if (s === 'normal') return 'Normal'
  if (s === 'high') return 'High'
  if (s === 'critical') return 'Critical'
  return s
}

// Wellhead Equipment Component
function WellheadEquipment({ equipment, wellName }: { equipment?: WellheadEquipment; wellName: string }) {
  const [hovered, setHovered] = useState<string | null>(null)
  
  const defaultEquipment: WellheadEquipment = equipment || {
    christmasTree: {
      height: 2.5,
      width: 1.2,
      status: 'open'
    },
    masterValve: {
      position: 100,
      status: 'open'
    },
    wingValve: {
      position: 75,
      status: 'open'
    },
    chokeValve: {
      position: 50,
      status: 'open'
    },
    pressureGauges: [
      { name: 'Wellhead Pressure', value: 2500, unit: 'psi' },
      { name: 'Tubing Pressure', value: 2300, unit: 'psi' },
      { name: 'Casing Pressure', value: 500, unit: 'psi' }
    ],
    flowMeter: {
      flowRate: 850,
      unit: 'bbl/day'
    }
  }

  const bopHeight = 3.5
  const wellheadBaseY = bopHeight + 0.5

  return (
    <group position={[0, wellheadBaseY, 0]}>
      {/* Christmas Tree */}
      <group
        onPointerOver={() => setHovered('christmasTree')}
        onPointerOut={() => setHovered(null)}
      >
        {/* Main Tree Body */}
        <mesh position={[0, defaultEquipment.christmasTree.height / 2, 0]}>
          <boxGeometry args={[defaultEquipment.christmasTree.width, defaultEquipment.christmasTree.height, defaultEquipment.christmasTree.width]} />
          <meshStandardMaterial 
            color={defaultEquipment.christmasTree.status === 'open' ? '#4169e1' : '#8b0000'}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Tree Branches (Valve Manifold) */}
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2
          const x = Math.cos(angle) * 0.6
          const z = Math.sin(angle) * 0.6
          return (
            <mesh key={i} position={[x, defaultEquipment.christmasTree.height * 0.7, z]}>
              <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
              <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.1} />
            </mesh>
          )
        })}

        {/* Master Valve */}
        <mesh position={[0, defaultEquipment.christmasTree.height * 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
          <meshStandardMaterial 
            color={defaultEquipment.masterValve.status === 'open' ? '#00ff00' : '#ff0000'}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Wing Valves */}
        {[0, 1].map((i) => {
          const angle = (i / 2) * Math.PI
          const x = Math.cos(angle) * 0.5
          const z = Math.sin(angle) * 0.5
          return (
            <mesh key={i} position={[x, defaultEquipment.christmasTree.height * 0.5, z]}>
              <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
              <meshStandardMaterial 
                color={defaultEquipment.wingValve.status === 'open' ? '#00ff00' : '#ff0000'}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          )
        })}

        {/* Choke Valve */}
        <mesh position={[0.6, defaultEquipment.christmasTree.height * 0.5, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
          <meshStandardMaterial 
            color="#ffaa00"
            metalness={0.8}
            roughness={0.2}
          />
          {/* Choke Position Indicator */}
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, (defaultEquipment.chokeValve.position / 100) * Math.PI * 2]}>
            <boxGeometry args={[0.05, 0.15, 0.05]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>
        </mesh>

        {/* Pressure Gauges */}
        {defaultEquipment.pressureGauges.map((gauge, i) => {
          const angle = (i / defaultEquipment.pressureGauges.length) * Math.PI * 2
          const x = Math.cos(angle) * 0.8
          const z = Math.sin(angle) * 0.8
          return (
            <group key={i} position={[x, defaultEquipment.christmasTree.height * 0.8, z]}>
              <mesh>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
                <meshStandardMaterial color="#ffffff" metalness={0.7} roughness={0.3} />
              </mesh>
              <Text
                position={[0, 0.15, 0]}
                fontSize={0.08}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {gauge.value.toFixed(0)}
              </Text>
            </group>
          )
        })}

        {/* Flow Meter */}
        <group position={[0, defaultEquipment.christmasTree.height + 0.3, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.2, 0.2]} />
            <meshStandardMaterial color="#00ffff" metalness={0.6} roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={0.1}
            color="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {defaultEquipment.flowMeter.flowRate.toFixed(0)}
          </Text>
        </group>

        {hovered === 'christmasTree' && (
          <Html distanceFactor={10}>
            <div className="asset-tooltip" dir="rtl">
              <h4>Christmas tree — {wellName}</h4>
              <p>Master valve: {valveStatusFa(defaultEquipment.masterValve.status)} ({defaultEquipment.masterValve.position}%)</p>
              <p>Wing valve: {valveStatusFa(defaultEquipment.wingValve.status)} ({defaultEquipment.wingValve.position}%)</p>
              <p>Choke valve: {valveStatusFa(defaultEquipment.chokeValve.status)} ({defaultEquipment.chokeValve.position}%)</p>
              <p>Rate: {defaultEquipment.flowMeter.flowRate} {defaultEquipment.flowMeter.unit}</p>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

// BOP Component - Blow Out Preventer
function BOP({ bopData }: { bopData?: BOPData }) {
  const [hovered, setHovered] = useState(false)
  
  const defaultBOP: BOPData = bopData || {
    type: 'Annular blowout preventer',
    pressureRating: 10000,
    stackHeight: 3.5,
    status: 'open'
  }

  const getColor = () => {
    switch (defaultBOP.status) {
      case 'closed': return '#ff0000'
      case 'maintenance': return '#ffaa00'
      default: return '#00ff00'
    }
  }

  return (
    <group position={[0, defaultBOP.stackHeight / 2 + 0.5, 0]}>
      {/* Main BOP Stack */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.6, 0.6, defaultBOP.stackHeight, 32]} />
        <meshStandardMaterial 
          color={getColor()}
          metalness={0.9}
          roughness={0.1}
          emissive={getColor()}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* BOP Stack Layers */}
      {[0, 1, 2].map((layer) => (
        <mesh
          key={layer}
          position={[0, (layer - 1) * 1.1, 0]}
        >
          <cylinderGeometry args={[0.65, 0.65, 0.3, 32]} />
          <meshStandardMaterial 
            color="#333333"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
      ))}

      {/* BOP Control Lines */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.7,
              defaultBOP.stackHeight / 2,
              Math.sin(angle) * 0.7
            ]}
          >
            <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#ffaa00" />
          </mesh>
        )
      })}

      {hovered && (
        <Html distanceFactor={10}>
          <div className="asset-tooltip" dir="rtl">
            <h4>Blowout preventer</h4>
            <p>Type: {defaultBOP.type}</p>
            <p>Pressure rating: {defaultBOP.pressureRating.toLocaleString()} psi</p>
            <p>Stack height: {defaultBOP.stackHeight.toFixed(1)} m</p>
            <p>Status: {valveStatusFa(defaultBOP.status)}</p>
          </div>
        </Html>
      )}
    </group>
  )
}

// Casing Component - displaying the Casing pipes
function Casing({ casing }: { casing: CasingData }) {
  const [hovered, setHovered] = useState(false)
  const radius = casing.outerDiameter / 24 // Convert inches to meters (approximate)
  const innerRadius = casing.innerDiameter / 24
  const casingLength = casing.depth
  const cementRadius = radius + casing.cementThickness / 24

  const getCasingColor = () => {
    switch (casing.type) {
      case 'conductor': return '#8b4513'
      case 'surface': return '#4169e1'
      case 'intermediate': return '#32cd32'
      case 'production': return '#ff6347'
      default: return '#808080'
    }
  }

  return (
    <group position={[0, -casingLength / 2, 0]}>
      {/* Cement Layer (outside casing) */}
      <mesh>
        <cylinderGeometry args={[cementRadius, cementRadius, casingLength, 32]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          metalness={0.3}
          roughness={0.8}
          opacity={0.6}
          transparent
        />
      </mesh>

      {/* Outer Casing */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[radius, radius, casingLength, 32]} />
        <meshStandardMaterial 
          color={getCasingColor()}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Inner Casing (hollow - shows previous casing or wellbore) */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, casingLength, 32]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Casing Label */}
      <Text
        position={[cementRadius + 0.3, -casingLength / 2, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
      >
        {casing.type.toUpperCase()}
      </Text>

      {/* Size Label */}
      <Text
        position={[cementRadius + 0.3, -casingLength / 2 + 0.2, 0]}
        fontSize={0.12}
        color="#ffff00"
        anchorX="left"
        anchorY="middle"
      >
        {casing.outerDiameter}" OD / {casing.innerDiameter}" ID
      </Text>

      {/* Cement Label */}
      <Text
        position={[cementRadius + 0.3, -casingLength / 2 + 0.4, 0]}
        fontSize={0.1}
        color="#c0c0c0"
        anchorX="left"
        anchorY="middle"
      >
        Cement: {casing.cementThickness}" ({casing.cementThickness * 25.4}mm)
      </Text>

      {hovered && (
        <Html distanceFactor={10}>
          <div className="asset-tooltip" dir="rtl">
            <h4>Annulus: {casingTypeFa(casing.type)}</h4>
            <p>Depth: 0 – {casing.depth.toFixed(1)} m</p>
            <p>Outer diameter: {casing.outerDiameter}" ({casing.outerDiameter * 25.4}mm)</p>
            <p>Inner diameter: {casing.innerDiameter}" ({casing.innerDiameter * 25.4}mm)</p>
            <p>Cement thickness: {casing.cementThickness}" ({casing.cementThickness * 25.4}mm)</p>
            <p>Wall thickness: {((casing.outerDiameter - casing.innerDiameter) / 2).toFixed(2)}"</p>
          </div>
        </Html>
      )}
    </group>
  )
}

// Wellbore component - displaying the wellbore pipe
function Wellbore({ depth, data, casings }: { depth: number; data: DepthData[]; casings?: CasingData[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const segments = 50
  const radius = 0.3

  // Create color based on status
  const getColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ff0000'
      case 'warning': return '#ffaa00'
      default: return '#4a90e2'
    }
  }

  // Create geometry for wellbore
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const y = -(i / segments) * depth
    points.push(new THREE.Vector3(0, y, 0))
  }

  return (
    <group>
      {/* Render casings first (they're larger, nested from outside to inside) */}
      {casings && casings.map((casing, index) => (
        <Casing key={index} casing={casing} />
      ))}

      {/* Main wellbore cylinder (only if no casings or as inner liner) */}
      {(!casings || casings.length === 0) && (
        <mesh ref={meshRef} position={[0, -depth / 2, 0]}>
          <cylinderGeometry args={[radius, radius, depth, 32]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.3} roughness={0.7} />
        </mesh>
      )}

      {/* Depth segments with status colors (inside casings) */}
      {data.map((segment, index) => {
        const segmentDepth = depth / data.length
        const yPosition = -(index * segmentDepth + segmentDepth / 2)
        const color = getColor(segment.status)
        const innerRadius = casings && casings.length > 0 
          ? (casings[casings.length - 1]?.innerDiameter || 0) / 24 * 0.8
          : radius * 0.8

        return (
          <mesh
            key={index}
            position={[0, yPosition, 0]}
          >
            <cylinderGeometry args={[innerRadius, innerRadius, segmentDepth, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              metalness={0.5}
              roughness={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Depth labels
function DepthLabels({ depth, segments }: { depth: number; segments: number }) {
  const labels = []
  for (let i = 0; i <= segments; i++) {
    const y = -(i / segments) * depth
    const depthValue = (i / segments) * depth

    labels.push(
      <Text
        key={i}
        position={[0.8, y, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
      >
        {depthValue.toFixed(0)}m
      </Text>
    )
  }
  return <group>{labels}</group>
}

// Multiple Wells Scene - displaying several wells
function MultipleWellsScene({ wellsData, wells }: { wellsData: Record<string, Well3DData | null>; wells: string[] }) {
  const controlsRef = useRef<any>(null)
  const spacing = 12 // spacing between the Maroun wells (4×4)

  return (
    <>
      <PerspectiveCamera makeDefault position={[40, 28, 40]} fov={50} />
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={120}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Ground plane - Maroun field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#3a5f3a" />
      </mesh>

      {/* Render all wells — 4×4 grid */}
      {wells.map((wellName, index) => {
        const wellData = wellsData[wellName]

        const row = Math.floor(index / 4)
        const col = index % 4
        const x = (col - 1.5) * spacing
        const z = (row - 1.5) * spacing

        if (!wellData) {
          return (
            <group key={wellName} position={[x, 0, z]}>
              <Text position={[0, 5, 0]} fontSize={0.5} color="#ffffff" anchorX="center" anchorY="middle">
                {wellName}
              </Text>
              <Text position={[0, 3.5, 0]} fontSize={0.35} color="#f87171" anchorX="center" anchorY="middle">
                Data unavailable
              </Text>
            </group>
          )
        }

        return (
          <group key={wellName} position={[x, 0, z]}>
            <Text
              position={[0, 5, 0]}
              fontSize={0.5}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {wellName}
            </Text>
            <BOP bopData={wellData.bop} />
            <Wellbore
              depth={Math.min(wellData.totalDepth, 900)}
              data={wellData.depthData.slice(0, 14)}
              casings={wellData.casings}
            />
            <WellheadEquipment equipment={wellData.wellheadEquipment} wellName={wellName} />
          </group>
        )
      })}

      <SceneBackdrop />
    </>
  )
}

// Main 3D Scene - Single Well
function WellScene({ data, autoRotate = false }: { data: Well3DData; autoRotate?: boolean }) {
  const controlsRef = useRef<any>(null)

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 2, 5]} fov={50} />
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#3a5f3a" />
      </mesh>

      {/* BOP - Blow Out Preventer */}
      <BOP bopData={data.bop} />

      {/* Wellbore with Casings */}
      <Wellbore depth={data.totalDepth} data={data.depthData} casings={data.casings} />

      {/* Depth labels */}
      <DepthLabels depth={data.totalDepth} segments={10} />

      {/* Wellhead Equipment */}
      <WellheadEquipment equipment={data.wellheadEquipment} wellName={data.wellName} />

      {/* Surface data display */}
      <Html position={[2, 2, 0]} distanceFactor={5}>
        <div className="surface-data-panel">
          <h3>{data.wellName} — surface data</h3>
          <div className="data-row">
            <span>Wellhead pressure:</span>
            <span>{data.surfaceData.wellheadPressure.toFixed(2)} psi</span>
          </div>
          <div className="data-row">
            <span>Wellhead temperature:</span>
            <span>{data.surfaceData.wellheadTemperature.toFixed(1)} °C</span>
          </div>
          <div className="data-row">
            <span>Rate / virtual flow meter:</span>
            <span>{data.surfaceData.flowRate.toFixed(2)} bbl/day</span>
          </div>
        </div>
      </Html>

      {/* Environment */}
      <SceneBackdrop />
    </>
  )
}

export default function Well3D() {
  const [selectedWell, setSelectedWell] = useState<string>(MARUN_WELLS[0].id)
  const [autoRotate, setAutoRotate] = useState(false)
  const [viewMode, setViewMode] = useState<'single' | 'multiple'>('single')
  const [chokePct, setChokePct] = useState(0)
  const [pumpSpeedPct, setPumpSpeedPct] = useState(0)
  const [whatIfResult, setWhatIfResult] = useState<any>(null)
  const [tick, setTick] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 10000)
    return () => window.clearInterval(id)
  }, [])

  const marunIds = useMemo(() => MARUN_WELLS.map((w) => w.id), [])
  const liveWells = useMemo(() => getMarunLiveState(tick), [tick])
  const liveSelected = liveWells.find((w) => w.id === selectedWell)

  const whatIfMutation = useMutation({
    mutationFn: (base: { flow_rate: number; pressure: number; temperature: number }) =>
      digitalTwinAPI.runWhatIfScenario({
        well_name: selectedWell,
        base_conditions: base,
        adjustments: { choke_pct: chokePct, pump_speed_pct: pumpSpeedPct },
        horizon_hours: 12,
      }),
    onSuccess: (data) => setWhatIfResult(data),
    onError: () => {
      // Local Marun what-if when twin API unavailable
      if (!displayDataRef.current) return
      const base = displayDataRef.current.surfaceData
      const flow =
        base.flowRate * (1 + chokePct / 100) * (1 + pumpSpeedPct / 80)
      const pressure = base.wellheadPressure * (1 - chokePct / 200) * (1 + pumpSpeedPct / 150)
      setWhatIfResult({
        projected: {
          flow_rate: Math.round(flow),
          pressure: Math.round(pressure),
          temperature: base.wellheadTemperature,
        },
        risk_level:
          flow > base.flowRate * 1.15 || pressure > base.wellheadPressure * 1.1
            ? 'elevated'
            : 'normal',
        source: 'local-marun-model',
      })
    },
  })

  const { data: wellsResponse } = useQuery({
    queryKey: ['wells-list-3d-marun'],
    queryFn: async () => {
      try {
        const response = await well3DAPI.getWells()
        const list = Array.isArray(response) ? response : response?.wells || []
        return list.length >= 8 ? list : marunIds
      } catch {
        return marunIds
      }
    },
    initialData: marunIds,
  })

  const wells: string[] = useMemo(() => {
    const list = Array.isArray(wellsResponse) ? wellsResponse : marunIds
    return list.length > 0 ? list : marunIds
  }, [wellsResponse, marunIds])

  useEffect(() => {
    if (wells.length > 0 && !wells.includes(selectedWell)) {
      setSelectedWell(wells[0])
    }
  }, [wells, selectedWell])

  const { data: apiWellData, isLoading } = useQuery({
    queryKey: ['well3d', selectedWell, tick],
    queryFn: () => well3DAPI.getWellData(selectedWell),
    refetchInterval: 15000,
    enabled: !!selectedWell,
    retry: 0,
  })

  const fallbackData = useMemo(
    () => buildMarunWell3DData(selectedWell, tick) as Well3DData,
    [selectedWell, tick]
  )

  const displayData: Well3DData = useMemo(() => {
    if (apiWellData && apiWellData.depthData?.length) {
      return {
        ...fallbackData,
        ...apiWellData,
        wellName: apiWellData.wellName || selectedWell,
        surfaceData: apiWellData.surfaceData || fallbackData.surfaceData,
        depthData: apiWellData.depthData,
        bop: apiWellData.bop || fallbackData.bop,
        casings: apiWellData.casings?.length ? apiWellData.casings : fallbackData.casings,
        wellheadEquipment: apiWellData.wellheadEquipment || fallbackData.wellheadEquipment,
        riskZones: apiWellData.riskZones?.length ? apiWellData.riskZones : fallbackData.riskZones,
      }
    }
    return fallbackData
  }, [apiWellData, fallbackData, selectedWell])

  const displayDataRef = useRef(displayData)
  displayDataRef.current = displayData

  const { data: allWellsData } = useQuery({
    queryKey: ['wells3d-all-marun', wells, tick],
    queryFn: async () => {
      const local = buildAllMarunWells3D(tick) as Record<string, Well3DData>
      const wellsData: Record<string, Well3DData | null> = { ...local }
      for (const wellName of wells.slice(0, 16)) {
        try {
          const remote = await well3DAPI.getWellData(wellName)
          if (remote?.depthData?.length) {
            wellsData[wellName] = { ...local[wellName], ...remote }
          }
        } catch {
          /* keep local Marun twin */
        }
      }
      return wellsData
    },
    enabled: viewMode === 'multiple',
    initialData: buildAllMarunWells3D(tick) as Record<string, Well3DData>,
  })

  const wellLabel =
    MARUN_WELLS.find((w) => w.id === selectedWell)?.nameFa || selectedWell

  return (
    <div className="well3d-container" dir="rtl">
      <div className="well3d-controls deh-3d-header">
        <div className="deh-3d-brand">
          <strong>{FIELD.nameFa}</strong>
          <span>{FIELD.clientFa} · sour light-to-medium crude, API gravity {FIELD.apiGravity}°</span>
        </div>
        <div className="control-group">
          <label>Display mode:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'single' | 'multiple')}
          >
            <option value="single">Single well</option>
            <option value="multiple">All 24 wells</option>
          </select>
        </div>
        {viewMode === 'single' && (
          <div className="control-group">
            <label>Select well:</label>
            <select
              value={selectedWell}
              onChange={(e) => setSelectedWell(e.target.value)}
            >
              {wells.map((well) => {
                const fa = MARUN_WELLS.find((w) => w.id === well)?.nameFa
                return (
                  <option key={well} value={well}>
                    {fa ? `${fa} (${well})` : well}
                  </option>
                )
              })}
            </select>
          </div>
        )}
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            Auto rotate
          </label>
        </div>
        <div className="well-info">
          {viewMode === 'single' ? (
            <>
              <h2>
                {wellLabel}{' '}
                {liveSelected && (
                  <span
                    className="deh-3d-status"
                    style={{ color: STATUS_COLOR[liveSelected.status] }}
                  >
                    {STATUS_LABEL_FA[liveSelected.status]}
                  </span>
                )}
              </h2>
              <p>
                Total depth: {displayData.totalDepth.toFixed(0)} m · wellhead pressure:{' '}
                {displayData.surfaceData.wellheadPressure} psi · virtual flow meter:{' '}
                {displayData.surfaceData.flowRate} bbl/d
                {isLoading ? ' · updating…' : ''}
              </p>
            </>
          ) : (
            <>
              <h2>3D view of the Maroun field</h2>
              <p>{FIELD.wellCount} wells · digital twin</p>
            </>
          )}
        </div>
      </div>

      {viewMode === 'single' && liveSelected && (
        <div className="deh-3d-livebar">
          <span>Wellhead pressure: <b>{liveSelected.thp} psi</b></span>
          <span>Temperature: <b>{liveSelected.tht} °C</b></span>
          <span>Oil: <b>{liveSelected.oilRate} bbl/d</b></span>
          <span>Gas: <b>{liveSelected.gasRate} Mscf/d</b></span>
          <span>Water: <b>{liveSelected.waterRate} bbl/d</b></span>
          <span>Produced water cut: <b>{liveSelected.waterCut}%</b></span>
          <span>Pump: <b>{liveSelected.pumpOnline ? 'Online' : 'Offline'}</b></span>
        </div>
      )}

      <div className="well3d-viewport">
        <Canvas className="well3d-canvas" shadows>
          <Suspense fallback={null}>
            {viewMode === 'single' ? (
              <WellScene data={displayData} autoRotate={autoRotate} />
            ) : (
              <MultipleWellsScene
                wellsData={allWellsData || (buildAllMarunWells3D(tick) as Record<string, Well3DData>)}
                wells={wells.slice(0, 16)}
              />
            )}
          </Suspense>
        </Canvas>
      </div>

      <div className="well3d-legend">
        <div className="legend-section">
          <h3>Status</h3>
          <div className="legend-item">
            <div className="legend-color normal"></div>
            <span>Normal</span>
          </div>
          <div className="legend-item">
            <div className="legend-color warning"></div>
            <span>Warning</span>
          </div>
          <div className="legend-item">
            <div className="legend-color critical"></div>
            <span>Critical</span>
          </div>
        </div>

        {displayData.bop && (
          <div className="legend-section">
            <h3>Blowout preventer</h3>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background:
                    displayData.bop.status === 'open'
                      ? '#00ff00'
                      : displayData.bop.status === 'closed'
                        ? '#ff0000'
                        : '#ffaa00',
                }}
              ></div>
              <span>
                {displayData.bop.type} — {valveStatusFa(displayData.bop.status)}
              </span>
            </div>
            <div className="legend-item">
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                Pressure rating: {displayData.bop.pressureRating.toLocaleString()} psi
              </span>
            </div>
          </div>
        )}

        {displayData.casings && displayData.casings.length > 0 && (
          <div className="legend-section">
            <h3>Annuli</h3>
            {displayData.casings.map((casing, index) => {
              const getCasingColor = () => {
                switch (casing.type) {
                  case 'conductor':
                    return '#8b4513'
                  case 'surface':
                    return '#4169e1'
                  case 'intermediate':
                    return '#32cd32'
                  case 'production':
                    return '#ff6347'
                  default:
                    return '#808080'
                }
              }
              return (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ background: getCasingColor() }}></div>
                  <span>
                    {casingTypeFa(casing.type)}: {casing.outerDiameter}&quot; / {casing.innerDiameter}&quot; (0–
                    {casing.depth}m)
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {displayData.riskZones && displayData.riskZones.length > 0 && (
          <div className="legend-section">
            <h3>Risk zones</h3>
            {displayData.riskZones.map((zone, idx) => (
              <div key={idx} className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: zone.severity === 'critical' ? '#ff0000' : '#ffaa00' }}
                ></div>
                <span>
                  {zone.name}: {zone.fromDepth}m – {zone.toDepth}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'single' && (
        <div className="well3d-whatif">
          <h3>What-if analysis — Maroun digital twin</h3>
          <div className="whatif-controls">
            <label>
              Choke valve adjustment (%)
              <input
                type="range"
                min={-20}
                max={20}
                value={chokePct}
                onChange={(e) => setChokePct(Number(e.target.value))}
              />
              {chokePct}%
            </label>
            <label>
              Pump speed (%)
              <input
                type="range"
                min={-20}
                max={20}
                value={pumpSpeedPct}
                onChange={(e) => setPumpSpeedPct(Number(e.target.value))}
              />
              {pumpSpeedPct}%
            </label>
            <button
              onClick={() =>
                whatIfMutation.mutate({
                  flow_rate: displayData.surfaceData.flowRate,
                  pressure: displayData.surfaceData.wellheadPressure,
                  temperature: displayData.surfaceData.wellheadTemperature,
                })
              }
              disabled={whatIfMutation.isPending}
            >
              {whatIfMutation.isPending ? 'Simulating…' : 'Run simulation'}
            </button>
          </div>
          {whatIfResult && (
            <div className="whatif-results">
              <p>
                <strong>Forecast rate:</strong>{' '}
                {whatIfResult.projected?.flow_rate?.toFixed?.(1) ??
                  whatIfResult.projected_flow_rate ??
                  '—'}{' '}
                bbl/d
              </p>
              <p>
                <strong>Forecast pressure:</strong>{' '}
                {whatIfResult.projected?.pressure?.toFixed?.(1) ??
                  whatIfResult.projected_pressure ??
                  '—'}{' '}
                psi
              </p>
              <p>
                <strong>Risk level:</strong>{' '}
                {riskLevelFa(String(whatIfResult.risk_level ?? whatIfResult.risk ?? '—'))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


