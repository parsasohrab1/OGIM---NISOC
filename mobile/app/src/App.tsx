import { useCallback, useEffect, useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AlertItem, getOpenAlerts, acknowledgeAlert, registerPushDevice, getWells, getWellSummary } from './api'
import { flushOfflineQueue, loadAlertsCache, loadWellsCache, queueAcknowledge, saveAlertsCache, saveWellsCache } from './offline'
import { registerForPushNotificationsAsync } from './notifications'
import { getSession, logout } from './auth'
import LoginScreen from './LoginScreen'

type Tab = 'alerts' | 'wells'

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('alerts')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [wells, setWells] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')

  useEffect(() => {
    getSession().then((s) => setAuthenticated(!!s))
  }, [])

  const registerPush = useCallback(async () => {
    const token = await registerForPushNotificationsAsync()
    if (!token) return
    const userId = (await AsyncStorage.getItem('user_id')) || 'mobile-user'
    try {
      await registerPushDevice(userId, 'expo', token)
    } catch {
      // Push registration may fail if backend is offline
    }
  }, [])

  const loadAlerts = useCallback(async () => {
    try {
      if (isOnline) {
        const serverAlerts = await getOpenAlerts()
        setAlerts(serverAlerts)
        await saveAlertsCache(serverAlerts)
      } else {
        setAlerts(await loadAlertsCache() as AlertItem[])
      }
    } catch {
      setAlerts(await loadAlertsCache() as AlertItem[])
    }
  }, [isOnline])

  const loadWells = useCallback(async () => {
    try {
      if (isOnline) {
        const wellNames: string[] = await getWells()
        const summaries = await Promise.all(
          wellNames.slice(0, 10).map(async (name) => {
            try {
              const data = await getWellSummary(name)
              return { well_name: name, ...data }
            } catch {
              return { well_name: name, status: 'unknown' }
            }
          })
        )
        setWells(summaries)
        await saveWellsCache(summaries)
      } else {
        setWells(await loadWellsCache())
      }
    } catch {
      setWells(await loadWellsCache())
    }
  }, [isOnline])

  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      if (tab === 'alerts') await loadAlerts()
      else await loadWells()
    } finally {
      setRefreshing(false)
    }
  }, [tab, loadAlerts, loadWells])

  useEffect(() => {
    if (!authenticated) return
    registerPush()
  }, [authenticated, registerPush])

  useEffect(() => {
    const unsub = NetInfo.addEventListener(async (state) => {
      const online = Boolean(state.isConnected)
      setIsOnline(online)
      if (online && authenticated) {
        setSyncStatus('syncing')
        const result = await flushOfflineQueue()
        setSyncStatus(`synced:${result.processed},failed:${result.failed}`)
        await loadData()
      }
    })
    return () => unsub()
  }, [authenticated, loadData])

  useEffect(() => {
    if (authenticated) loadData()
  }, [authenticated, loadData])

  const onAcknowledge = async (alertId: string) => {
    if (isOnline) {
      await acknowledgeAlert(alertId)
      await loadAlerts()
      return
    }
    await queueAcknowledge(alertId)
    setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId))
  }

  const onLogout = async () => {
    await logout()
    setAuthenticated(false)
  }

  if (authenticated === null) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f7fb' }} />
  }

  if (!authenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LoginScreen onSuccess={() => setAuthenticated(true)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>OGIM Mobile</Text>
          <TouchableOpacity onPress={onLogout}>
            <Text style={{ color: '#1967d2' }}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ marginTop: 6, color: isOnline ? '#14833b' : '#b15206' }}>
          {isOnline ? 'Online' : 'Offline Mode'}
        </Text>
        <Text style={{ marginTop: 4, color: '#666' }}>Sync: {syncStatus}</Text>

        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setTab('alerts')}
            style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: tab === 'alerts' ? '#1967d2' : '#fff' }}
          >
            <Text style={{ textAlign: 'center', color: tab === 'alerts' ? '#fff' : '#333', fontWeight: '600' }}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('wells')}
            style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: tab === 'wells' ? '#1967d2' : '#fff' }}
          >
            <Text style={{ textAlign: 'center', color: tab === 'wells' ? '#fff' : '#333', fontWeight: '600' }}>Wells</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'alerts' ? (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.alert_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#777' }}>No open alerts</Text>}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: '700' }}>{item.well_name}</Text>
              <Text style={{ marginTop: 4 }}>{item.message}</Text>
              <Text style={{ marginTop: 4, color: '#666' }}>Severity: {item.severity}</Text>
              <TouchableOpacity
                style={{ marginTop: 10, backgroundColor: '#1967d2', padding: 10, borderRadius: 8 }}
                onPress={() => onAcknowledge(item.alert_id)}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                  {isOnline ? 'Acknowledge' : 'Queue (Offline)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={wells}
          keyExtractor={(item) => item.well_name}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#777' }}>No well data (cached when offline)</Text>}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: '700' }}>{item.well_name}</Text>
              {item.total_depth != null && <Text style={{ marginTop: 4 }}>Depth: {item.total_depth} m</Text>}
              {item.surface_data && (
                <Text style={{ marginTop: 4, color: '#666' }}>
                  Pressure: {item.surface_data.wellhead_pressure ?? '—'} psi
                </Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
