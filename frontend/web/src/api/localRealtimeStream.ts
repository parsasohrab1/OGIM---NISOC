import { getMarunAlerts } from '../data/marunAlerts'
import type { RealtimeSnapshotPayload } from './realtimeStream'
import type { LiveTransport } from './offlineMode'

const TICK_MS = 4000

type Handlers = {
  onSnapshot: (payload: RealtimeSnapshotPayload) => void
  onTransportChange?: (transport: LiveTransport) => void
}

/** Local live stream of Maroun field data — no network */
export function startLocalRealtimeStream(handlers: Handlers): () => void {
  let closed = false

  const emit = () => {
    if (closed) return
    const tick = Date.now()
    const alerts = getMarunAlerts(tick)

    const payload: RealtimeSnapshotPayload = {
      type: 'snapshot',
      timestamp: new Date(tick).toISOString(),
      data: {
        alerts: {
          count: alerts.filter((a) => a.status === 'open').length,
          alerts,
        },
      },
    }
    handlers.onSnapshot(payload)
  }

  handlers.onTransportChange?.('simulation')
  emit()
  const id = window.setInterval(emit, TICK_MS)

  return () => {
    closed = true
    window.clearInterval(id)
    handlers.onTransportChange?.('disconnected')
  }
}
