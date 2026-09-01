import AsyncStorage from '@react-native-async-storage/async-storage'
import { acknowledgeAlert } from './api'

const CACHE_KEY = 'ogim_mobile_alerts_cache'
const WELLS_CACHE_KEY = 'ogim_mobile_wells_cache'
const QUEUE_KEY = 'ogim_mobile_action_queue'

export async function saveAlertsCache(alerts: unknown[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(alerts))
}

export async function loadAlertsCache(): Promise<any[]> {
  const raw = await AsyncStorage.getItem(CACHE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function saveWellsCache(wells: unknown[]): Promise<void> {
  await AsyncStorage.setItem(WELLS_CACHE_KEY, JSON.stringify(wells))
}

export async function loadWellsCache(): Promise<any[]> {
  const raw = await AsyncStorage.getItem(WELLS_CACHE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function queueAcknowledge(alertId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  const queue = raw ? JSON.parse(raw) : []
  queue.push({ type: 'ack', alert_id: alertId, created_at: new Date().toISOString() })
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function flushOfflineQueue(): Promise<{ processed: number; failed: number }> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return { processed: 0, failed: 0 }

  const queue = JSON.parse(raw) as Array<{ type: string; alert_id: string }>
  const remaining: typeof queue = []
  let processed = 0
  let failed = 0

  for (const item of queue) {
    try {
      if (item.type === 'ack') {
        await acknowledgeAlert(item.alert_id)
      }
      processed += 1
    } catch {
      failed += 1
      remaining.push(item)
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  return { processed, failed }
}
