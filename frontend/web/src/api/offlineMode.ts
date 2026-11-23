/** Live run mode without internet / without a backend */

const STORAGE_KEY = 'sogf_offline_live'

/** Explicitly enabled with VITE_OFFLINE_LIVE=true or localStorage */
export function isOfflineLiveForced(): boolean {
  if (import.meta.env.VITE_OFFLINE_LIVE === 'true') return true
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setOfflineLiveForced(on: boolean) {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** The browser is offline or offline mode is forced */
export function shouldUseLocalLive(): boolean {
  if (isOfflineLiveForced()) return true
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  return false
}

export type LiveTransport = 'websocket' | 'sse' | 'simulation' | 'disconnected'

export function transportLabelFa(transport: LiveTransport | string): string {
  switch (transport) {
    case 'websocket':
      return 'Live (WebSocket)'
    case 'sse':
      return 'Live (server-sent events)'
    case 'simulation':
      return 'Live (local — no internet)'
    default:
      return 'Live (local — no internet)'
  }
}
