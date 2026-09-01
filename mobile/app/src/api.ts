import axios from 'axios'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const baseURL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  timeout: 15000
})

export type AlertItem = {
  alert_id: string
  timestamp: string
  severity: string
  status: string
  well_name: string
  message: string
  rule_name: string
}

async function authHeaders() {
  const token = (await AsyncStorage.getItem('access_token')) || ''
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export async function getOpenAlerts(): Promise<AlertItem[]> {
  const response = await api.get('/api/alert/alerts', {
    params: { status: 'open', limit: 50 },
    headers: await authHeaders()
  })
  return response.data?.alerts || []
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const username = (await AsyncStorage.getItem('username')) || 'mobile-user'
  await api.post(`/api/alert/alerts/${alertId}/acknowledge`, { acknowledged_by: username }, {
    headers: await authHeaders()
  })
}

export async function registerPushDevice(userId: string, platform: string, deviceToken: string): Promise<void> {
  await api.post(
    '/api/alert/notifications/devices/register',
    { user_id: userId, platform, device_token: deviceToken },
    { headers: await authHeaders() }
  )
}

export async function getWells(): Promise<string[]> {
  try {
    const response = await api.get('/api/digital-twin/wells', { headers: await authHeaders() })
    return response.data?.wells || response.data || []
  } catch {
    return ['PROD-001', 'PROD-002', 'DEV-001']
  }
}

export async function getWellSummary(wellName: string): Promise<any> {
  const response = await api.get(`/api/digital-twin/well/${wellName}/3d`, { headers: await authHeaders() })
  return response.data
}
