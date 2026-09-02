/**
 * داده‌های نمایشی/سنتتیک لایه عملیات: شرکت‌های تابعه NISOC، تجهیزات،
 * سطوح دسترسی و اهداف تولید. این فایل صرفاً به‌عنوان دادهٔ محلی/پشتیبان
 * (fallback) برای زمانی که سرویس operations-service در دسترس نیست استفاده
 * می‌شود؛ در حالت متصل، همین شکل داده از API دریافت خواهد شد.
 */

export type FluidType = 'oil' | 'gas' | 'gas_cap' | 'associated_gas' | 'water'

export const FLUID_TYPE_LABEL_FA: Record<FluidType, string> = {
  oil: 'نفت',
  gas: 'گاز',
  gas_cap: 'کلاهک گازی',
  associated_gas: 'گاز همراه',
  water: 'آب',
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

/** ۵ شرکت بهره‌برداری تابعه شرکت ملی مناطق نفت‌خیز جنوب (NISOC) */
export const SUBSIDIARIES: SubsidiaryRow[] = [
  {
    id: 1,
    code: 'MIS',
    name_fa: 'شرکت بهره‌برداری نفت و گاز مسجدسلیمان',
    name_en: 'Masjed Soleyman Oil & Gas Producing Company',
    active_well_count: 210,
    target_production_bopd: 95000,
    reservoirs: [
      { id: 'MIS-R1', name: 'مسجدسلیمان', fluid_type: 'oil', well_count: 120 },
      { id: 'MIS-R2', name: 'هفت‌شهیدان', fluid_type: 'gas', well_count: 40 },
      { id: 'MIS-R3', name: 'نفت سفید', fluid_type: 'associated_gas', well_count: 50 },
    ],
  },
  {
    id: 2,
    code: 'AGJ',
    name_fa: 'شرکت بهره‌برداری نفت و گاز آغاجاری',
    name_en: 'Aghajari Oil & Gas Producing Company',
    active_well_count: 340,
    target_production_bopd: 210000,
    reservoirs: [
      { id: 'AGJ-R1', name: 'آغاجاری', fluid_type: 'oil', well_count: 260 },
      { id: 'AGJ-R2', name: 'کلاهک گازی آغاجاری', fluid_type: 'gas_cap', well_count: 30 },
      { id: 'AGJ-R3', name: 'رگ سفید', fluid_type: 'oil', well_count: 50 },
    ],
  },
  {
    id: 3,
    code: 'KRN',
    name_fa: 'شرکت بهره‌برداری نفت و گاز کارون',
    name_en: 'Karoun Oil & Gas Producing Company',
    active_well_count: 180,
    target_production_bopd: 130000,
    reservoirs: [
      { id: 'KRN-R1', name: 'اهواز', fluid_type: 'oil', well_count: 90 },
      { id: 'KRN-R2', name: 'منصوری', fluid_type: 'oil', well_count: 60 },
      { id: 'KRN-R3', name: 'اهواز - آب همراه', fluid_type: 'water', well_count: 30 },
    ],
  },
  {
    id: 4,
    code: 'MRN',
    name_fa: 'شرکت بهره‌برداری نفت و گاز مارون',
    name_en: 'Marun Oil & Gas Producing Company',
    active_well_count: 24,
    target_production_bopd: 520000,
    reservoirs: [
      { id: 'MRN-R1', name: 'آسماری–بنگستان مارون', fluid_type: 'oil', well_count: 20 },
      { id: 'MRN-R2', name: 'گاز همراه مارون', fluid_type: 'associated_gas', well_count: 4 },
    ],
  },
  {
    id: 5,
    code: 'GCH',
    name_fa: 'شرکت بهره‌برداری نفت و گاز گچساران',
    name_en: 'Gachsaran Oil & Gas Producing Company',
    active_well_count: 260,
    target_production_bopd: 250000,
    reservoirs: [
      { id: 'GCH-R1', name: 'گچساران', fluid_type: 'oil', well_count: 190 },
      { id: 'GCH-R2', name: 'بی‌بی حکیمه', fluid_type: 'oil', well_count: 40 },
      { id: 'GCH-R3', name: 'کلاهک گازی گچساران', fluid_type: 'gas_cap', well_count: 30 },
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

export const EQUIPMENT_TYPE_LABEL_FA: Record<EquipmentType, string> = {
  mot: 'تجهیزات MOT (اندازه‌گیری چند فازی سیار)',
  rig: 'دکل حفاری/تعمیر (Rig)',
  pipeline: 'خطوط لوله',
  truck: 'تراک (خودروی سرویس)',
  vfm: 'دبی‌سنج مجازی (VFM)',
  coiled_tubing: 'واحد کویل تیوبینگ (Coiled Tubing)',
}

export const EQUIPMENT_STATUS_LABEL_FA: Record<string, string> = {
  active: 'فعال',
  idle: 'بلااستفاده',
  maintenance: 'در تعمیر',
  retired: 'از رده خارج',
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
  const perSubsidiaryCounts: Record<EquipmentType, number> = {
    mot: 2,
    rig: 3,
    pipeline: 4,
    truck: 5,
    vfm: 4,
    coiled_tubing: 2,
  }
  SUBSIDIARIES.forEach((sub, subIdx) => {
    ;(Object.keys(perSubsidiaryCounts) as EquipmentType[]).forEach((type) => {
      const count = perSubsidiaryCounts[type]
      for (let i = 1; i <= count; i++) {
        rows.push({
          id: id++,
          equipment_id: `${sub.code}-${type.toUpperCase()}-${String(i).padStart(2, '0')}`,
          equipment_type: type,
          name: `${EQUIPMENT_TYPE_LABEL_FA[type]} ${i}`,
          subsidiary_id: sub.id,
          well_name: type === 'vfm' ? `${sub.code}-${String(i).padStart(2, '0')}` : undefined,
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

/** فهرست نقش‌ها/سطوح دسترسی (پشتیبان محلی – نسخهٔ کامل از سرویس عملیات دریافت می‌شود) */
export const ROLE_CATALOG = [
  {
    role: 'system_admin',
    level: 100,
    title_fa: 'مدیر سیستم',
    description_fa: 'دسترسی کامل به پیکربندی سامانه، کاربران و سطوح دسترسی.',
  },
  {
    role: 'hq_operations_chief',
    level: 90,
    title_fa: 'رئیس مهندسی بهره‌برداری ستاد',
    description_fa:
      'دسترسی مشاهده به تمامی شرکت‌های تابعه، تجهیزات، وضعیت تولید و گزارش‌های تصمیم‌یار در سطح ستاد.',
  },
  {
    role: 'subsidiary_ops_manager',
    level: 70,
    title_fa: 'مدیر بهره‌برداری شرکت تابعه',
    description_fa: 'دسترسی مدیریتی به داده‌های شرکت تابعه متبوع.',
  },
  {
    role: 'field_supervisor',
    level: 60,
    title_fa: 'سرپرست عملیات میدان',
    description_fa: 'نظارت بر چاه‌ها و تجهیزات میدان متبوع و تایید داده‌های ثبت‌شده دستی.',
  },
  {
    role: 'data_engineer',
    level: 55,
    title_fa: 'مهندس داده',
    description_fa: 'دسترسی به یکپارچه‌سازی داده، مدل‌ها و پایپ‌لاین‌های تحلیلی.',
  },
  {
    role: 'field_operator',
    level: 50,
    title_fa: 'اپراتور میدان',
    description_fa: 'دسترسی عملیاتی به اسکادا، هشدارها و کنترل تجهیزات میدان.',
  },
  {
    role: 'data_entry_operator',
    level: 30,
    title_fa: 'متصدی ثبت اطلاعات چاه (شرکت بهره‌برداری)',
    description_fa:
      'ثبت دستی اطلاعات روزانه چاه‌های شرکت تابعه متبوع تا زمان خرید و نصب سنسورهای میدانی.',
  },
  {
    role: 'viewer',
    level: 10,
    title_fa: 'بازدیدکننده',
    description_fa: 'دسترسی فقط‌خواندنی به داشبوردهای عمومی.',
  },
]

export const PERMISSION_LABEL_FA: Record<string, string> = {
  view_dashboard: 'مشاهده داشبورد',
  view_all_subsidiaries: 'مشاهده همه شرکت‌های تابعه',
  manage_subsidiaries: 'مدیریت شرکت‌های تابعه',
  manage_equipment: 'مدیریت تجهیزات',
  view_equipment: 'مشاهده تجهیزات',
  enter_manual_readings: 'ثبت دستی اطلاعات چاه',
  view_manual_readings: 'مشاهده اطلاعات ثبت‌شده دستی',
  view_vfm_decline: 'مشاهده دبی‌سنج مجازی و منحنی افت',
  manage_vfm_decline: 'ثبت داده دبی‌سنج مجازی',
  manage_production_targets: 'تعریف اهداف تولید',
  view_production_status: 'مشاهده وضعیت تولید',
  export_hq_reports: 'استخراج گزارش‌های تصمیم‌یار ستاد',
  manage_access_levels: 'مدیریت سطوح دسترسی',
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
    title_fa: 'وضعیت تولید هر شرکت تابعه نسبت به هدف تعریف‌شده',
    description_fa:
      'دبی تولید فعلی هر یک از ۵ شرکت تابعه در برابر هدف تعریف‌شده و میزان جلو/عقب بودن.',
    category: 'production',
  },
  {
    id: 'reservoir_well_inventory',
    title_fa: 'فهرست مخازن به تفکیک نوع سیال و تعداد چاه فعال',
    description_fa: 'تعداد مخازن هر شرکت تابعه به تفکیک ماهیت سیال و تعداد چاه‌های فعال آن.',
    category: 'asset_inventory',
  },
  {
    id: 'equipment_utilization',
    title_fa: 'میزان بکارگیری تجهیزات (Rig، Coiled Tubing، تراک) به تفکیک شرکت تابعه',
    description_fa: 'وضعیت تخصیص و بهره‌وری تجهیزات حفاری/تعمیر/حمل در هر شرکت تابعه.',
    category: 'equipment',
  },
  {
    id: 'vfm_decline_watch',
    title_fa: 'رصد نرخ تغییر تولید با تلفیق دبی‌سنج مجازی و منحنی افت تولید',
    description_fa:
      'مقایسه دبی لحظه‌ای دبی‌سنج مجازی (VFM) با منحنی افت تولید (Decline Curve) برای شناسایی افت غیرمنتظره.',
    category: 'production',
  },
  {
    id: 'manual_data_entry_coverage',
    title_fa: 'پوشش ثبت دستی اطلاعات چاه‌ها (پیش از نصب سنسور)',
    description_fa: 'درصد چاه‌هایی که داده روزانه آن‌ها به‌صورت دستی ثبت شده است.',
    category: 'data_quality',
  },
  {
    id: 'access_level_matrix',
    title_fa: 'ماتریس سطوح دسترسی سامانه',
    description_fa: 'فهرست نقش‌ها و سطوح دسترسی تعریف‌شده در سامانه تا سطح ریاست مهندسی بهره‌برداری ستاد.',
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
