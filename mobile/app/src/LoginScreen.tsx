import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { login } from './auth'

type Props = {
  onSuccess: () => void
}

export default function LoginScreen({ onSuccess }: Props) {
  const [username, setUsername] = useState('operator1')
  const [password, setPassword] = useState('operator123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f6f7fb' }}>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 8 }}>OGIM Mobile</Text>
      <Text style={{ color: '#666', marginBottom: 24 }}>Sign in to receive push alerts and sync offline data</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        autoCapitalize="none"
        style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      {error ? <Text style={{ color: '#c62828', marginBottom: 12 }}>{error}</Text> : null}

      <TouchableOpacity
        onPress={onLogin}
        disabled={loading}
        style={{ backgroundColor: '#1967d2', padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
