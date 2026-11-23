/**
 * Demonstration/synthetic data of the operations layer: NISOC subsidiary companies, equipment,
 * access levels and production targets. This file is used only as local/fallback
 * data for when the operations-service is unavailable;
 * in connected mode, this same data shape will be received from the API.
 *
 * The number of wells and production rate of each subsidiary company, and the total number of rigs of the 5 companies (46 units),
 * are estimated from public sources (Persian Wikipedia, SHANA, IRNA) as of September 2026
 * — not an official real-time company figure. The number of trucks, coiled tubing and other field services
 * remained demonstration/estimated, as no public/published statistics were found for them.
 */

export type FluidType = 'oil' | 'gas' | 'gas_cap' | 'associated_gas' | 'water'

export const FLUID_TYPE_LABEL_FA: Record<FluidType, string> = {
  oil: 'Oil',
  gas: 'Gas',
  gas_cap: 'Gas cap',
  associated_gas: 'Associated gas',
  water: 'Water',
}

export interface ReservoirRow {
  id: string
  name: string
  fluid_type: FluidType
  well_count: number
}

export interface SubsidiaryRow {
  id: number
  code: string
  name_fa: string
  name_en: string
  active_well_count: number
  target_production_bopd: number
  reservoirs: ReservoirRow[]
}

/** The 5 operating subsidiary companies of the National Iranian South Oil Company (NISOC) */
export const SUBSIDIARIES: SubsidiaryRow[] = [
  {
    id: 1,
    code: 'MIS',
    name_fa: 'Masjed Soleyman Oil and Gas Exploitation Company',
    name_en: 'Masjed Soleyman Oil & Gas Producing Company',
    // Source: Persian Wikipedia (Masjed Soleyman Oil and Gas Exploitation Company) — 492 oil wells,
    // 16 exploitation complexes, production of about 142 thousand barrels per day.
    active_well_count: 492,
    target_production_bopd: 142000,
    reservoirs: [
      { id: 'MIS-R1', name: 'Masjed Soleyman', fluid_type: 'oil', well_count: 300 },
      { id: 'MIS-R2', name: 'Haft Shahidan', fluid_type: 'gas', well_count: 92 },
      { id: 'MIS-R3', name: 'Naft Safid', fluid_type: 'associated_gas', well_count: 100 },
    ],
  },
  {
    id: 2,
    code: 'AGJ',
    name_fa: 'Aghajari Oil and Gas Exploitation Company',
    name_en: 'Aghajari Oil & Gas Producing Company',
    // Source: Persian Wikipedia (Aghajari oil field) — 218 active/inactive wells
    // (73 oil wells, 3 gas wells, 36 observation/injection/appraisal wells and the rest suspended/abandoned).
    // No officially published target rate was found; the figure below is an estimate.
    active_well_count: 218,
    target_production_bopd: 180000,
    reservoirs: [
      { id: 'AGJ-R1', name: 'Aghajari', fluid_type: 'oil', well_count: 150 },
      { id: 'AGJ-R2', name: 'Aghajari gas cap (crude)', fluid_type: 'gas_cap', well_count: 33 },
      { id: 'AGJ-R3', name: 'Rag Sefid', fluid_type: 'oil', well_count: 35 },
    ],
  },
  {
    id: 3,
    code: 'KRN',
    name_fa: 'Karun Oil and Gas Exploitation Company',
    name_en: 'Karoun Oil & Gas Producing Company',
    // No officially published source was found for the total number of wells / target rate of Karun;
    // the values below are estimates (based on the scale of the Ahvaz and Mansouri fields).
    active_well_count: 220,
    target_production_bopd: 150000,
    reservoirs: [
      { id: 'KRN-R1', name: 'Ahvaz', fluid_type: 'oil', well_count: 110 },
      { id: 'KRN-R2', name: 'Mansouri', fluid_type: 'oil', well_count: 80 },
      { id: 'KRN-R3', name: 'Ahvaz - associated water', fluid_type: 'water', well_count: 30 },
    ],
  },
  {
    id: 4,
    code: 'MN',
    name_fa: 'Maroun Oil and Gas Exploitation Company',
    name_en: 'Marun Oil & Gas Producing Company',
    // Number of wells: 500 (as confirmed by the user). A rate of ~520 thousand barrels/day matches public
    // sources (English Wikipedia/Wood Mackenzie) with the available data.
    // The three reservoirs of the Maroun field per Persian Wikipedia: Asmari, Bangestan, Khami.
    active_well_count: 500,
    target_production_bopd: 520000,
    reservoirs: [
      { id: 'MN-R1', name: 'Asmari Maroun', fluid_type: 'oil', well_count: 460 },
      { id: 'MN-R2', name: 'Bangestan Maroun', fluid_type: 'oil', well_count: 30 },
      { id: 'MN-R3', name: 'Khami Maroun', fluid_type: 'associated_gas', well_count: 10 },
    ],
  },
  {
    id: 5,
    code: 'GCH',
    name_fa: 'Gachsaran Oil and Gas Exploitation Company',
    name_en: 'Gachsaran Oil & Gas Producing Company',
    // Source: Persian Wikipedia / IRNA — 853 oil wells in 23 fields (16 active fields),
    // production of about 580 thousand barrels per day.
    active_well_count: 853,
    target_production_bopd: 580000,
    reservoirs: [
      { id: 'GCH-R1', name: 'Gachsaran', fluid_type: 'oil', well_count: 650 },
      { id: 'GCH-R2', name: 'Bibi Hakimeh', fluid_type: 'oil', well_count: 150 },
      { id: 'GCH-R3', name: 'Gachsaran gas cap', fluid_type: 'gas_cap', well_count: 53 },
    ],
  },
]

export type EquipmentType =
  | 'mot'
  | 'rig'
  | 'pipeline'
  | 'truck'
  | 'vfm'
  | 'coiled_tubing'
  | 'massive_acidizing'
  | 'injectivity'
  | 'fluid_injection'
  | 'logging'
  | 'perforating'
  | 'shutoff_isolation'
  | 'mobile_processing_unit'
  | 'slickline'
  | 'workover_rig'
  | 'development_rig'

export const EQUIPMENT_TYPE_LABEL_FA: Record<EquipmentType, string> = {
  mot: 'MOT equipment (mobile multiphase measurement)',
  rig: 'Drilling/workover rig (Rig)',
  pipeline: 'Pipelines',
  truck: 'Truck (service vehicle)',
  vfm: 'Virtual flow meter (VFM)',
  coiled_tubing: 'Coiled Tubing unit',
  massive_acidizing: 'Massive Acidizing operation',
  injectivity: 'Injectivity Test',
  fluid_injection: 'Fluid Injection',
  logging: 'Well Logging',
  perforating: 'Perforating operation',
  shutoff_isolation: 'Shut-off / Isolation',
  mobile_processing_unit: 'Mobile Processing Unit',
  slickline: 'Slickline operation',
  workover_rig: 'Workover Rig',
  development_rig: 'Development Rig',
}

export const EQUIPMENT_STATUS_LABEL_FA: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  maintenance: 'Under maintenance',
  retired: 'Retired',
}

export interface EquipmentRow {
  id: number
  equipment_id: string
  equipment_type: EquipmentType
  name: string
  subsidiary_id: number
  well_name?: string
  status: 'active' | 'idle' | 'maintenance' | 'retired'
  phase: 1 | 2
}

function buildEquipment(): EquipmentRow[] {
  const rows: EquipmentRow[] = []
  let id = 1
  // Total number of drilling/workover rigs of the subsidiary companies: 46 units (out of a total of 51 rigs
  // in the Southern Oil Fields), per public sources; the distribution among the 5 companies was estimated in proportion to
  // each company's number of wells since no breakdown official statistics were found.
  const RIG_COUNT_BY_CODE: Record<string, number> = {
    MIS: 10,
    AGJ: 4,
    KRN: 4,
    MN: 10,
    GCH: 18,
  }
  const perSubsidiaryCounts: Record<EquipmentType, number> = {
    mot: 2,
    rig: 0, // replaced; see RIG_COUNT_BY_CODE
    pipeline: 4,
    truck: 5,
    vfm: 4,
    coiled_tubing: 2,
    massive_acidizing: 1,
    injectivity: 2,
    fluid_injection: 2,
    logging: 2,
    perforating: 2,
    shutoff_isolation: 1,
    mobile_processing_unit: 1,
    slickline: 2,
    workover_rig: 2,
    development_rig: 2,
  }
  // Types usually performed on a specific well (unlike fixed equipment / the general fleet)
  const wellLinkedTypes = new Set<EquipmentType>([
    'vfm',
    'massive_acidizing',
    'injectivity',
    'fluid_injection',
    'logging',
    'perforating',
    'shutoff_isolation',
    'slickline',
    'workover_rig',
    'development_rig',
  ])
  SUBSIDIARIES.forEach((sub, subIdx) => {
    ;(Object.keys(perSubsidiaryCounts) as EquipmentType[]).forEach((type) => {
      const count = type === 'rig' ? RIG_COUNT_BY_CODE[sub.code] ?? 0 : perSubsidiaryCounts[type]
      for (let i = 1; i <= count; i++) {
        rows.push({
          id: id++,
          equipment_id: `${sub.code}-${type.toUpperCase()}-${String(i).padStart(2, '0')}`,
          equipment_type: type,
          name: `${EQUIPMENT_TYPE_LABEL_FA[type]} ${i}`,
          subsidiary_id: sub.id,
          well_name: wellLinkedTypes.has(type) ? `${sub.code}-${String(i).padStart(2, '0')}` : undefined,
          status: i % 7 === 0 ? 'maintenance' : i % 5 === 0 ? 'idle' : 'active',
          phase: type === 'vfm' ? 2 : 1,
        })
      }
      void subIdx
    })
  })
  return rows
}

export const EQUIPMENT: EquipmentRow[] = buildEquipment()

/** List of roles/access levels (local backup – the full version is fetched from the operations service) */
export const ROLE_CATALOG = [
  {
    role: 'system_admin',
    level: 100,
    title_fa: 'System Administrator',
    description_fa: 'Full access to the system configuration, users and access levels.',
  },
  {
    role: 'hq_operations_chief',
    level: 90,
    title_fa: 'Head of Operations Engineering (HQ)',
    description_fa:
      'View access to all subsidiary companies, equipment, production status and HQ-level decision-support reports.',
  },
  {
    role: 'subsidiary_ops_manager',
    level: 70,
    title_fa: 'Subsidiary Operations Manager',
    description_fa: 'Management access to the data of the parent subsidiary company.',
  },
  {
    role: 'field_supervisor',
    level: 60,
    title_fa: 'Field Operations Supervisor',
    description_fa: 'Supervision of the wells and equipment of the parent field and approval of manually entered data.',
  },
  {
    role: 'data_engineer',
    level: 55,
    title_fa: 'Data Engineer',
    description_fa: 'Access to data integration, models and analytics pipelines.',
  },
  {
    role: 'field_operator',
    level: 50,
    title_fa: 'Field Operator',
    description_fa: 'Operational access to SCADA, alerts and field equipment control.',
  },
  {
    role: 'data_entry_operator',
    level: 30,
    title_fa: 'Well Data Entry Clerk (Operating Company)',
    description_fa:
      'Manual entry of the daily data of the parent subsidiary company\'s wells until field sensors are purchased and installed.',
  },
  {
    role: 'viewer',
    level: 10,
    title_fa: 'Viewer',
    description_fa: 'Read-only access to public dashboards.',
  },
]

export const PERMISSION_LABEL_FA: Record<string, string> = {
  view_dashboard: 'View dashboard',
  view_all_subsidiaries: 'View all subsidiary companies',
  manage_subsidiaries: 'Manage subsidiary companies',
  manage_equipment: 'Manage equipment',
  view_equipment: 'View equipment',
  enter_manual_readings: 'Manual well data entry',
  view_manual_readings: 'View manually entered data',
  view_vfm_decline: 'View virtual flow meter and decline curve',
  manage_vfm_decline: 'Enter virtual flow meter data',
  manage_production_targets: 'Define production targets',
  view_production_status: 'View production status',
  export_hq_reports: 'Export HQ decision-support reports',
  manage_access_levels: 'Manage access levels',
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: Object.keys(PERMISSION_LABEL_FA),
  hq_operations_chief: [
    'view_dashboard',
    'view_all_subsidiaries',
    'view_equipment',
    'view_manual_readings',
    'view_vfm_decline',
    'view_production_status',
    'export_hq_reports',
    'manage_production_targets',
  ],
  subsidiary_ops_manager: [
    'view_dashboard',
    'manage_equipment',
    'view_equipment',
    'view_manual_readings',
    'view_vfm_decline',
    'manage_vfm_decline',
    'view_production_status',
    'manage_production_targets',
  ],
  field_supervisor: [
    'view_dashboard',
    'view_equipment',
    'enter_manual_readings',
    'view_manual_readings',
    'view_vfm_decline',
    'view_production_status',
  ],
  data_engineer: [
    'view_dashboard',
    'view_equipment',
    'view_manual_readings',
    'view_vfm_decline',
    'manage_vfm_decline',
    'view_production_status',
  ],
  field_operator: [
    'view_dashboard',
    'view_equipment',
    'enter_manual_readings',
    'view_manual_readings',
    'view_vfm_decline',
    'view_production_status',
  ],
  data_entry_operator: [
    'view_dashboard',
    'view_equipment',
    'enter_manual_readings',
    'view_manual_readings',
  ],
  viewer: ['view_dashboard'],
}

export const HQ_EXPECTED_REPORTS = [
  {
    id: 'subsidiary_production_status',
    title_fa: 'Production status of each subsidiary company versus the defined target',
    description_fa:
      'Current production rate of each of the 5 subsidiary companies against the defined target and the amount ahead/behind.',
    category: 'production',
  },
  {
    id: 'reservoir_well_inventory',
    title_fa: 'List of reservoirs by fluid type and number of active wells',
    description_fa: 'Number of reservoirs of each subsidiary company by fluid nature and the number of its active wells.',
    category: 'asset_inventory',
  },
  {
    id: 'equipment_utilization',
    title_fa: 'Equipment utilization (Rig, Coiled Tubing, truck) by subsidiary company',
    description_fa: 'Allocation and productivity status of drilling/workover/transport equipment in each subsidiary company.',
    category: 'equipment',
  },
  {
    id: 'vfm_decline_watch',
    title_fa: 'Tracking the production rate of change by combining the virtual flow meter and the decline curve',
    description_fa:
      'Comparing the instantaneous rate of the virtual flow meter (VFM) with the production decline curve (Decline Curve) to identify unexpected decline.',
    category: 'production',
  },
  {
    id: 'manual_data_entry_coverage',
    title_fa: 'Manual well data entry coverage (before sensor installation)',
    description_fa: 'Percentage of wells whose daily data has been manually entered.',
    category: 'data_quality',
  },
  {
    id: 'access_level_matrix',
    title_fa: 'System access level matrix',
    description_fa: 'List of roles and access levels defined in the system up to the level of Head of Operations Engineering at HQ.',
    category: 'governance',
  },
]

export interface ManualReadingRow {
  id: number
  well_name: string
  subsidiary_id: number
  reading_date: string
  production_pressure_psi: number
  production_flow_rate_bopd: number
  water_cut_pct: number
  gas_rate_mscfd: number
  choke_size_64th: number
}

export function generateMockManualReadings(): ManualReadingRow[] {
  const rows: ManualReadingRow[] = []
  let id = 1
  const now = Date.now()
  SUBSIDIARIES.forEach((sub) => {
    for (let d = 0; d < 5; d++) {
      const wellIdx = (d % Math.max(sub.active_well_count, 1)) + 1
      rows.push({
        id: id++,
        well_name: `${sub.code}-${String(wellIdx).padStart(2, '0')}`,
        subsidiary_id: sub.id,
        reading_date: new Date(now - d * 86400000).toISOString(),
        production_pressure_psi: Math.round(800 + Math.random() * 1200),
        production_flow_rate_bopd: Math.round(200 + Math.random() * 1800),
        water_cut_pct: Math.round(Math.random() * 60 * 10) / 10,
        gas_rate_mscfd: Math.round(50 + Math.random() * 400),
        choke_size_64th: [16, 24, 32, 40, 48][Math.floor(Math.random() * 5)],
      })
    }
  })
  return rows.sort((a, b) => (a.reading_date < b.reading_date ? 1 : -1))
}

export interface VfmDeclinePoint {
  timestamp: string
  vfm_oil_rate_bopd: number
  decline_predicted_rate_bopd: number
  rate_change_pct: number
  alert_flag: boolean
}

export function generateMockVfmDecline(wellName: string, qi = 1200, di = 0.00025, b = 0.4): VfmDeclinePoint[] {
  const points: VfmDeclinePoint[] = []
  const now = Date.now()
  for (let d = 59; d >= 0; d--) {
    const tYears = d / 365
    const predicted = b === 0 ? qi * Math.exp(-di * (60 - d)) : qi / Math.pow(1 + b * di * (60 - d), 1 / b)
    const noise = (Math.random() - 0.5) * predicted * 0.12
    const actual = Math.max(0, predicted + noise - (wellName.length % 3 === 0 ? d * 0.5 : 0))
    const changePct = predicted > 0 ? Math.round(((actual - predicted) / predicted) * 1000) / 10 : 0
    points.push({
      timestamp: new Date(now - d * 86400000).toISOString(),
      vfm_oil_rate_bopd: Math.round(actual),
      decline_predicted_rate_bopd: Math.round(predicted),
      rate_change_pct: changePct,
      alert_flag: Math.abs(changePct) >= 10,
    })
    void tYears
  }
  return points
}

export interface SubsidiaryProductionStatus {
  subsidiary_id: number
  code: string
  name_fa: string
  active_well_count: number
  target_bopd: number
  actual_bopd: number
  variance_pct: number
  status: 'ahead' | 'behind' | 'on_target'
  equipment_in_use: { coiled_tubing: number; truck: number; rig: number }
}

export function generateMockProductionStatus(): SubsidiaryProductionStatus[] {
  return SUBSIDIARIES.map((sub) => {
    const variance = Math.round((Math.random() * 24 - 10) * 10) / 10
    const actual = Math.round(sub.target_production_bopd * (1 + variance / 100))
    const equipmentForSub = EQUIPMENT.filter((e) => e.subsidiary_id === sub.id && e.status === 'active')
    return {
      subsidiary_id: sub.id,
      code: sub.code,
      name_fa: sub.name_fa,
      active_well_count: sub.active_well_count,
      target_bopd: sub.target_production_bopd,
      actual_bopd: actual,
      variance_pct: variance,
      status: variance > 1 ? 'ahead' : variance < -1 ? 'behind' : 'on_target',
      equipment_in_use: {
        coiled_tubing: equipmentForSub.filter((e) => e.equipment_type === 'coiled_tubing').length,
        truck: equipmentForSub.filter((e) => e.equipment_type === 'truck').length,
        rig: equipmentForSub.filter((e) => e.equipment_type === 'rig').length,
      },
    }
  })
}
