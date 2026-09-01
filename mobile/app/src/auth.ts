import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from './api'

export type AuthSession = {
  access_token: string
  refresh_token?: string
  username: string
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)

  const response = await api.post('/api/auth/token', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const session: AuthSession = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    username,
  }

  await AsyncStorage.setItem('access_token', session.access_token)
  if (session.refresh_token) {
    await AsyncStorage.setItem('refresh_token', session.refresh_token)
  }
  await AsyncStorage.setItem('user_id', username)
  await AsyncStorage.setItem('username', username)

  return session
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_id', 'username'])
}

export async function getSession(): Promise<AuthSession | null> {
  const access_token = await AsyncStorage.getItem('access_token')
  const username = (await AsyncStorage.getItem('username')) || ''
  if (!access_token) return null
  return {
    access_token,
    refresh_token: (await AsyncStorage.getItem('refresh_token')) || undefined,
    username,
  }
}
