/** Smart operator — automatic control of manual variables and recovery of production decline */

export type ControllableKey =
  | 'choke'
  | 'esp_speed'
  | 'gas_lift'
  | 'separator_p'
  | 'water_injection'

export type ControllableVar = {
  key: ControllableKey
  nameFa: string
  nameEn: string
  unit: string
  min: number
  max: number
  /** Operating optimum — deviation from it causes decline */
  optimal: number
  step: number
  /** Weight of the effect on oil rate (higher = more sensitive) */
  oilWeight: number
  /** Weight of the effect on Water Cut */
  wcWeight: number
}

export const CONTROLLABLE_VARS: ControllableVar[] = [
  {
    key: 'choke',
    nameFa: 'Choke valve opening',
    nameEn: 'Choke Opening',
    unit: '%',
    min: 10,
    max: 100,
    optimal: 55,
    step: 1,
    oilWeight: 1.15,
    wcWeight: 0.9,
  },
  {
    key: 'esp_speed',
    nameFa: 'Electric submersible pump speed',
    nameEn: 'ESP Speed',
    unit: '%',
    min: 40,
    max: 110,
    optimal: 85,
    step: 1,
    oilWeight: 1.35,
    wcWeight: 0.45,
  },
  {
    key: 'gas_lift',
    nameFa: 'Gas lift rate',
    nameEn: 'Gas Lift Rate',
    unit: '%',
    min: 0,
    max: 100,
    optimal: 60,
    step: 1,
    oilWeight: 0.95,
    wcWeight: 0.35,
  },
  {
    key: 'separator_p',
    nameFa: 'Separator pressure setpoint',
    nameEn: 'Separator Pressure SP',
    unit: 'psi',
    min: 80,
    max: 280,
    optimal: 160,
    step: 5,
    oilWeight: 0.55,
    wcWeight: 0.25,
  },
  {
    key: 'water_injection',
    nameFa: 'Water injection rate',
    nameEn: 'Water Injection',
    unit: '%',
    min: 0,
    max: 100,
    optimal: 45,
    step: 1,
    oilWeight: 0.7,
    wcWeight: 1.2,
  },
]

export type ControlState = Record<ControllableKey, number>

export function defaultControls(): ControlState {
  return CONTROLLABLE_VARS.reduce((acc, v) => {
    acc[v.key] = v.optimal
    return acc
  }, {} as ControlState)
}

export type ProductionImpact = {
  /** Oil rate multiplier relative to the base (≈1 at the optimum) */
  oilFactor: number
  /** Water Cut change in absolute percent */
  wcDelta: number
  /** Relative production decline versus the base (0–1) */
  declineFraction: number
  /** Magnitude of deviation from the optimum (0–1) */
  deviationScore: number
  perVar: Array<{
    key: ControllableKey
    nameFa: string
    value: number
    optimal: number
    deviationPct: number
    oilPenalty: number
  }>
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Effect of manual settings on production — deviation from the optimum = decline */
export function computeProductionImpact(controls: ControlState): ProductionImpact {
  let penaltySum = 0
  let weightSum = 0
  let wcDelta = 0
  let deviationAcc = 0

  const perVar = CONTROLLABLE_VARS.map((v) => {
    const value = controls[v.key]
    const span = Math.max(1, v.max - v.min)
    const normDev = (value - v.optimal) / span
    const absDev = Math.abs(normDev)
    const oilPenalty = absDev * absDev * v.oilWeight
    penaltySum += oilPenalty
    weightSum += v.oilWeight
    // high choke or high injection → high WC; very high ESP also slightly raises WC
    wcDelta += normDev * v.wcWeight * 8
    deviationAcc += absDev
    return {
      key: v.key,
      nameFa: v.nameFa,
      value,
      optimal: v.optimal,
      deviationPct: Math.round(absDev * 1000) / 10,
      oilPenalty: Math.round(oilPenalty * 1000) / 1000,
    }
  })

  const avgPenalty = weightSum > 0 ? penaltySum / weightSum : 0
  // oilFactor between ~0.45 and 1.05
  const oilFactor = clamp(1.02 - avgPenalty * 1.35, 0.45, 1.05)
  const declineFraction = clamp(1 - oilFactor, 0, 1)

  return {
    oilFactor: Math.round(oilFactor * 1000) / 1000,
    wcDelta: Math.round(wcDelta * 10) / 10,
    declineFraction: Math.round(declineFraction * 1000) / 1000,
    deviationScore: Math.round((deviationAcc / CONTROLLABLE_VARS.length) * 1000) / 1000,
    perVar,
  }
}

export type AutoPilotAction = {
  at: number
  key: ControllableKey
  nameFa: string
  from: number
  to: number
  reason: string
}

export type AutoPilotStepResult = {
  controls: ControlState
  actions: AutoPilotAction[]
  recovered: boolean
  status: 'stable' | 'recovering' | 'declined'
}

/**
 * One smart operator step: returns the deviated variables toward the optimum
 * to compensate for the decline caused by manual settings.
 */
export function autoPilotStep(
  controls: ControlState,
  opts?: { aggressiveness?: number; declineThreshold?: number }
): AutoPilotStepResult {
  const aggressiveness = opts?.aggressiveness ?? 0.22
  const declineThreshold = opts?.declineThreshold ?? 0.02
  const impact = computeProductionImpact(controls)
  const next = { ...controls }
  const actions: AutoPilotAction[] = []

  if (impact.declineFraction < declineThreshold && impact.deviationScore < 0.04) {
    return { controls: next, actions, recovered: true, status: 'stable' }
  }

  // Priority goes to the variables with the largest oil penalty
  const ranked = [...impact.perVar].sort((a, b) => b.oilPenalty - a.oilPenalty)

  for (const row of ranked) {
    if (row.oilPenalty < 0.002) continue
    const meta = CONTROLLABLE_VARS.find((v) => v.key === row.key)!
    const current = next[row.key]
    const target = meta.optimal
    const delta = (target - current) * aggressiveness
    if (Math.abs(delta) < meta.step * 0.25) continue
    const moved = clamp(
      Math.round((current + delta) / meta.step) * meta.step,
      meta.min,
      meta.max
    )
    if (moved === current) continue
    next[row.key] = moved
    actions.push({
      at: Date.now(),
      key: row.key,
      nameFa: meta.nameFa,
      from: current,
      to: moved,
      reason:
        impact.declineFraction >= declineThreshold
          ? `Compensating ${(impact.declineFraction * 100).toFixed(1)}% production decline — returning toward the optimum`
          : 'Aligned with the optimal operating point',
    })
  }

  const after = computeProductionImpact(next)
  const status: AutoPilotStepResult['status'] =
    after.declineFraction < declineThreshold
      ? 'stable'
      : actions.length > 0
        ? 'recovering'
        : 'declined'

  return {
    controls: next,
    actions,
    recovered: after.declineFraction < declineThreshold,
    status,
  }
}

export function applyImpactToOil(baseOil: number, impact: ProductionImpact) {
  return Math.max(0, Math.round(baseOil * impact.oilFactor))
}

export function applyImpactToWaterCut(baseWc: number, impact: ProductionImpact) {
  return Math.round(clamp(baseWc + impact.wcDelta, 5, 92) * 10) / 10
}
