import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../hooks/useAuth'
import { alertAPI } from '../api/services'
import { transportLabelFa } from '../api/offlineMode'
import {
  buildAlertSmsText,
  getMarunAlerts,
  getLocalSmsStatus,
  loadLocalSmsOutbox,
  pushLocalSms,
  saveLocalSmsRecipient,
  type MarunAlert,
} from '../data/marunAlerts'
import './Alerts.css'

type Tab = 'all' | 'correlated' | 'sms'

const SMS_PHONE_KEY = 'sogf_sms_alert_phone'

function getMeta(alert: any): Record<string, any> {
  return alert.metadata_json || alert.metadata || {}
}

function normalizePhoneInput(raw: string) {
  return raw.replace(/[^\d+]/g, '').trim()
}

function severityFa(s: string) {
  if (s === 'critical') return 'Critical'
  if (s === 'warning') return 'Warning'
  if (s === 'info') return 'Info'
  return s
}

function statusFa(s: string) {
  if (s === 'open') return 'Open'
  if (s === 'acknowledged') return 'Acknowledged'
  if (s === 'resolved') return 'Resolved'
  return s
}

function resolvePhone(phone: string) {
  const normalized = normalizePhoneInput(phone)
  if (normalized) return normalized
  return normalizePhoneInput(localStorage.getItem(SMS_PHONE_KEY) || '')
}

export default function Alerts() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('all')
  const [rcaResults, setRcaResults] = useState<Record<string, any>>({})
  const [phone, setPhone] = useState(() => localStorage.getItem(SMS_PHONE_KEY) || '')
  const [smsLabel, setSmsLabel] = useState('Maroun field operator')
  const [smsMsg, setSmsMsg] = useState<string | null>(null)
  const [smsErr, setSmsErr] = useState<string | null>(null)

  const { transport } = useWebSocket({
    onSnapshot: (payload) => {
      if (payload.data.alerts) {
        queryClient.setQueryData(['alerts'], payload.data.alerts)
      }
    },
  })

  const { data: alertsResponse, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const data = await alertAPI.getAlerts()
        const list = data?.alerts || data || []
        if (Array.isArray(list) && list.length > 0) {
          return { count: list.length, alerts: list, source: 'api' as const }
        }
      } catch {
        /* fallback below */
      }
      const alerts = getMarunAlerts()
      return { count: alerts.length, alerts, source: 'marun' as const }
    },
    refetchInterval: 15000,
    retry: false,
  })

  const { data: correlationsData, isLoading: correlationsLoading } = useQuery({
    queryKey: ['alert-correlations'],
    queryFn: async () => {
      try {
        return await alertAPI.getCorrelatedAlerts('open')
      } catch {
        const alerts = getMarunAlerts().filter((a) => a.severity !== 'info')
        const byWell: Record<string, MarunAlert[]> = {}
        for (const a of alerts) {
          ;(byWell[a.well_name] ||= []).push(a)
        }
        const groups = Object.entries(byWell)
          .filter(([, items]) => items.length >= 2)
          .map(([well, items]) => ({
            correlation_id: `CORR-${well}`,
            well_name: well,
            count: items.length,
            max_severity: items.some((i) => i.severity === 'critical') ? 'critical' : 'warning',
            suppressed_total: 0,
            alerts: items.map((i) => i.alert_id),
          }))
        return { groups }
      }
    },
    enabled: tab === 'correlated',
    refetchInterval: 15000,
  })

  const { data: smsStatus, refetch: refetchSms } = useQuery({
    queryKey: ['sms-status'],
    queryFn: async () => {
      try {
        return await alertAPI.getSmsStatus()
      } catch {
        return getLocalSmsStatus(phone)
      }
    },
    retry: false,
    refetchInterval: 30000,
  })

  const { data: smsOutbox, refetch: refetchOutbox } = useQuery({
    queryKey: ['sms-outbox'],
    queryFn: async () => {
      try {
        const data = await alertAPI.getSmsOutbox(12)
        if ((data?.messages || []).length > 0) return data
      } catch {
        /* local */
      }
      const messages = loadLocalSmsOutbox()
      return { messages, count: messages.length }
    },
    retry: false,
  })

  useEffect(() => {
    const registered = smsStatus?.recipients?.[0]?.phone_display || smsStatus?.recipients?.[0]?.phone
    if (registered && !phone) setPhone(registered)
  }, [smsStatus, phone])

  const acknowledgeMutation = useMutation({
    mutationFn: ({ alertId, username }: { alertId: string; username: string }) =>
      alertAPI.acknowledgeAlert(alertId, username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => alertAPI.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alert-correlations'] })
    },
  })

  const createWorkOrderMutation = useMutation({
    mutationFn: ({ alertId, erpType }: { alertId: string; erpType?: string }) =>
      alertAPI.createWorkOrder(alertId, erpType || 'sap'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      alert(`Work order created: ${data.work_order_id}`)
    },
    onError: (error: any) => {
      alert(`Work order creation failed: ${error.response?.data?.detail || error.message}`)
    },
  })

  const rcaMutation = useMutation({
    mutationFn: (alertId: string) => alertAPI.runRCA(alertId, 60),
    onSuccess: (data) => {
      setRcaResults((prev) => ({ ...prev, [data.alert_id]: data.rca }))
    },
  })

  const registerSmsMutation = useMutation({
    mutationFn: async () => {
      const p = resolvePhone(phone)
      if (!p) throw new Error('Enter the mobile number')
      try {
        return await alertAPI.registerSmsPhone({
          phone: p,
          label: smsLabel,
          enabled: true,
          severities: ['critical', 'warning'],
        })
      } catch {
        saveLocalSmsRecipient(p, smsLabel)
        return { message: 'Number registered locally (ready to send alert SMS)' }
      }
    },
    onSuccess: (data) => {
      localStorage.setItem(SMS_PHONE_KEY, resolvePhone(phone))
      setSmsErr(null)
      setSmsMsg(data.message || 'Number registered')
      refetchSms()
    },
    onError: (error: any) => {
      setSmsMsg(null)
      setSmsErr(error.response?.data?.detail || error.message || 'Error registering the number')
    },
  })

  const testSmsMutation = useMutation({
    mutationFn: async () => {
      const p = resolvePhone(phone)
      if (!p) throw new Error('Enter/register the mobile number first')
      try {
        return await alertAPI.sendTestSms(p)
      } catch {
        const entry = pushLocalSms(
          p,
          `Field Smartification — test SMS\nMaroun field\nTime: ${new Date().toLocaleString('en-US')}`,
          { type: 'test' }
        )
        return { entry, message: 'Test SMS queued locally' }
      }
    },
    onSuccess: (data) => {
      const st = data.entry?.result?.status || 'queued'
      setSmsErr(null)
      setSmsMsg(
        st === 'sent'
          ? 'Test SMS sent'
          : `Test SMS queued (${data.entry?.effective_provider || 'local-mock'})`
      )
      refetchOutbox()
      refetchSms()
    },
    onError: (error: any) => {
      setSmsMsg(null)
      setSmsErr(error.response?.data?.detail || error.message || 'Test send failed')
    },
  })

  const alertSmsMutation = useMutation({
    mutationFn: async (alertItem: any) => {
      const p = resolvePhone(phone)
      if (!p) throw new Error('Register the mobile number first')
      try {
        return await alertAPI.sendAlertSms(alertItem.alert_id)
      } catch {
        const text = buildAlertSmsText(alertItem)
        const entry = pushLocalSms(p, text, {
          type: 'alert',
          alert_id: alertItem.alert_id,
          severity: alertItem.severity,
        })
        return { entry, sent: 1, local: true }
      }
    },
    onSuccess: () => {
      setSmsErr(null)
      setSmsMsg('Alert SMS sent/queued — the text is visible in the "Latest SMS" section')
      refetchOutbox()
      setTab('sms')
    },
    onError: (error: any) => {
      setSmsMsg(null)
      setSmsErr(error.response?.data?.detail || error.message || 'Sending the alert SMS failed')
    },
  })

  const bulkCriticalSmsMutation = useMutation({
    mutationFn: async () => {
      const p = resolvePhone(phone)
      if (!p) throw new Error('Register the mobile number first')
      const criticals = (alertsResponse?.alerts || []).filter(
        (a: any) => a.severity === 'critical' && a.status === 'open'
      )
      if (criticals.length === 0) throw new Error('There is no open critical alert to send')
      let sent = 0
      for (const a of criticals.slice(0, 8)) {
        try {
          await alertAPI.sendAlertSms(a.alert_id)
          sent += 1
        } catch {
          pushLocalSms(p, buildAlertSmsText(a), { type: 'alert', alert_id: a.alert_id })
          sent += 1
        }
      }
      return { sent, total: criticals.length }
    },
    onSuccess: (data) => {
      setSmsErr(null)
      setSmsMsg(`${data.sent} critical alert SMS queued`)
      refetchOutbox()
      setTab('sms')
    },
    onError: (error: any) => {
      setSmsMsg(null)
      setSmsErr(error.message || 'Bulk send failed')
    },
  })

  const handleAcknowledge = (alertId: string) => {
    if (!user) return
    acknowledgeMutation.mutate({ alertId, username: user.username })
  }

  const handleResolve = (alertId: string) => resolveMutation.mutate(alertId)

  const handleCreateWorkOrder = (alertId: string) => {
    if (window.confirm('Create a work order for this alert?')) {
      createWorkOrderMutation.mutate({ alertId })
    }
  }

  const alerts = alertsResponse?.alerts || []
  const groups = correlationsData?.groups || []
  const criticalOpen = alerts.filter((a: any) => a.severity === 'critical' && a.status === 'open')
  const warningOpen = alerts.filter((a: any) => a.severity === 'warning' && a.status === 'open')

  if (isLoading) return <div className="loading">Loading alerts…</div>

  const smsPanel = (
    <section className="sms-panel">
      <div className="sms-panel-head">
        <div>
          <h3>Send alert SMS</h3>
          <p>
            Register the operator's mobile number, then press the "Send SMS" button in the alerts list or send all
            critical alerts at once.
          </p>
        </div>
        {smsStatus && (
          <div className="sms-provider-badge">
            <span>{smsStatus.provider}</span>
            <small>{smsStatus.detail}</small>
          </div>
        )}
      </div>

      <div className="sms-stats">
        <span className="sms-stat critical">{criticalOpen.length} critical</span>
        <span className="sms-stat warning">{warningOpen.length} warning</span>
        <span className="sms-stat">{alerts.length} total</span>
      </div>

      <div className="sms-form">
        <label>
          Mobile number
          <input
            type="tel"
            inputMode="tel"
            placeholder="09121234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
          />
        </label>
        <label>
          Label
          <input
            type="text"
            value={smsLabel}
            onChange={(e) => setSmsLabel(e.target.value)}
            placeholder="Field operator"
          />
        </label>
        <div className="sms-actions">
          <button
            type="button"
            className="sms-primary"
            disabled={!phone.trim() || registerSmsMutation.isPending}
            onClick={() => registerSmsMutation.mutate()}
          >
            {registerSmsMutation.isPending ? 'Registering…' : 'Register number'}
          </button>
          <button
            type="button"
            disabled={testSmsMutation.isPending}
            onClick={() => testSmsMutation.mutate()}
          >
            {testSmsMutation.isPending ? 'Sending…' : 'Test SMS'}
          </button>
          <button
            type="button"
            className="sms-bulk"
            disabled={bulkCriticalSmsMutation.isPending || criticalOpen.length === 0}
            onClick={() => bulkCriticalSmsMutation.mutate()}
          >
            {bulkCriticalSmsMutation.isPending
              ? 'Sending…'
              : `Send SMS for all critical alerts (${criticalOpen.length})`}
          </button>
        </div>
      </div>

      {(smsMsg || smsErr) && (
        <p className={smsErr ? 'sms-feedback err' : 'sms-feedback ok'}>{smsErr || smsMsg}</p>
      )}

      {smsStatus?.recipients?.length > 0 && (
        <div className="sms-recipients">
          <strong>Registered numbers:</strong>
          <ul>
            {smsStatus.recipients.map((r: any) => (
              <li key={r.phone}>
                <span dir="ltr">{r.phone_display || r.phone}</span>
                <em>{r.label}</em>
                <small>{(r.severities || []).map((s: string) => severityFa(s)).join(', ')}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(smsOutbox?.messages?.length || 0) > 0 && (
        <div className="sms-outbox">
          <strong>Latest SMS</strong>
          <ul>
            {smsOutbox.messages.slice(0, 8).map((m: any) => (
              <li key={m.id}>
                <span dir="ltr">{m.phone_display || m.phone}</span>
                <em>{m.result?.status || m.effective_provider}</em>
                <p>{m.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )

  return (
    <div className="alerts-page" dir="rtl">
      <div className="alerts-toolbar">
        <h2>Alerts</h2>
        <div className="alerts-toolbar-right">
          <span className={`transport-badge ${transport}`}>
            {transportLabelFa(transport)}
          </span>
          <div className="tab-buttons">
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
              All alerts ({alerts.length})
            </button>
            <button
              className={tab === 'sms' ? 'active' : ''}
              onClick={() => setTab('sms')}
            >
              Send SMS
            </button>
            <button
              className={tab === 'correlated' ? 'active' : ''}
              onClick={() => setTab('correlated')}
            >
              Correlated groups
            </button>
          </div>
        </div>
      </div>

      {(tab === 'sms' || tab === 'all') && smsPanel}

      {tab === 'sms' ? (
        <div className="sms-alert-pick">
          <h3>Alerts that can be sent by SMS</h3>
          <p className="sms-pick-hint">
            Press "Send SMS" on each alert. Critical and warning items take priority.
          </p>
          <div className="alerts-list">
            {alerts
              .filter((a: any) => a.severity === 'critical' || a.severity === 'warning')
              .map((alertItem: any) => (
                <div key={alertItem.alert_id} className={`alert-card ${alertItem.severity}`}>
                  <div className="alert-header">
                    <span className="alert-id">{alertItem.alert_id}</span>
                    <span className={`alert-severity ${alertItem.severity}`}>
                      {severityFa(alertItem.severity)}
                    </span>
                  </div>
                  <div className="alert-body">
                    <p>
                      <strong>Well / location:</strong> {alertItem.well_name}
                    </p>
                    <p>
                      <strong>Message:</strong> {alertItem.message}
                    </p>
                    <p className="sms-preview">
                      <strong>SMS preview:</strong>
                      <span>{buildAlertSmsText(alertItem)}</span>
                    </p>
                    <div className="alert-actions">
                      <button
                        className="sms-btn sms-primary"
                        onClick={() => alertSmsMutation.mutate(alertItem)}
                        disabled={alertSmsMutation.isPending}
                      >
                        {alertSmsMutation.isPending ? 'Sending…' : 'Send SMS for this alert'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : tab === 'correlated' ? (
        <div className="correlation-groups">
          {correlationsLoading ? (
            <p>Loading correlations…</p>
          ) : groups.length === 0 ? (
            <div className="no-alerts">
              <p>No correlated alert group found.</p>
            </div>
          ) : (
            groups.map((group: any) => (
              <div key={group.correlation_id} className={`alert-card ${group.max_severity}`}>
                <div className="alert-header">
                  <span className="alert-id">{group.correlation_id}</span>
                  <span className={`alert-severity ${group.max_severity}`}>
                    {severityFa(group.max_severity)}
                  </span>
                </div>
                <div className="alert-body">
                  <p>
                    <strong>Well:</strong> {group.well_name}
                  </p>
                  <p>
                    <strong>Number of alerts in the group:</strong> {group.count}
                  </p>
                  <p>
                    <strong>Suppressed (alert fatigue):</strong> {group.suppressed_total}
                  </p>
                  <p>
                    <strong>Alert IDs:</strong> {group.alerts.join(', ')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {alerts.length === 0 && (
            <div className="no-alerts">
              <p>No alerts found. All systems are normal.</p>
            </div>
          )}
          <div className="alerts-list">
            {alerts.map((alertItem: any) => {
              const meta = getMeta(alertItem)
              const rca = rcaResults[alertItem.alert_id] || meta.rca
              const suppressed = meta.suppressed_count || 0

              return (
                <div key={alertItem.alert_id} className={`alert-card ${alertItem.severity}`}>
                  <div className="alert-header">
                    <span className="alert-id">{alertItem.alert_id}</span>
                    <span className={`alert-severity ${alertItem.severity}`}>
                      {severityFa(alertItem.severity)}
                    </span>
                  </div>
                  <div className="alert-body">
                    <p>
                      <strong>Well:</strong> {alertItem.well_name}
                    </p>
                    <p>
                      <strong>Message:</strong> {alertItem.message}
                    </p>
                    <p>
                      <strong>Status:</strong> {statusFa(alertItem.status)}
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date(alertItem.timestamp).toLocaleString('en-US')}
                    </p>
                    {meta.correlation_id && (
                      <p>
                        <strong>Correlation:</strong> {meta.correlation_id}
                      </p>
                    )}
                    {suppressed > 0 && (
                      <p className="fatigue-badge">
                        <strong>Alert fatigue suppression:</strong> {suppressed} duplicate(s)
                      </p>
                    )}
                    {alertItem.erp_work_order_id && (
                      <div className="work-order-info">
                        <p>
                          <strong>Work order:</strong> {alertItem.erp_work_order_id}
                        </p>
                      </div>
                    )}
                    {rca && (
                      <div className="rca-box">
                        <strong>Root cause analysis (RCA)</strong>
                        <p>Dominant rule: {rca.dominant_rule || rca.primary_rule || '—'}</p>
                        <p>
                          Dominant sensor: {rca.dominant_sensor || rca.primary_sensor || '—'}
                        </p>
                        {rca.confidence !== undefined && (
                          <p>Confidence: {(rca.confidence * 100).toFixed(0)}%</p>
                        )}
                      </div>
                    )}
                    <div className="alert-actions">
                      <button
                        onClick={() => rcaMutation.mutate(alertItem.alert_id)}
                        disabled={rcaMutation.isPending}
                      >
                        {rcaMutation.isPending ? 'Running RCA…' : 'Run RCA'}
                      </button>
                      <button
                        className="sms-btn sms-primary"
                        onClick={() => alertSmsMutation.mutate(alertItem)}
                        disabled={alertSmsMutation.isPending}
                      >
                        {alertSmsMutation.isPending ? 'Sending…' : 'Send SMS'}
                      </button>
                      {alertItem.status === 'open' && (
                        <>
                          <button
                            onClick={() => handleAcknowledge(alertItem.alert_id)}
                            disabled={acknowledgeMutation.isPending}
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolve(alertItem.alert_id)}
                            disabled={resolveMutation.isPending}
                          >
                            Resolve
                          </button>
                          {!alertItem.erp_work_order_id && (
                            <button
                              onClick={() => handleCreateWorkOrder(alertItem.alert_id)}
                              disabled={createWorkOrderMutation.isPending}
                              className="work-order-btn"
                            >
                              Create work order
                            </button>
                          )}
                        </>
                      )}
                      {alertItem.status === 'acknowledged' && (
                        <>
                          <button
                            onClick={() => handleResolve(alertItem.alert_id)}
                            disabled={resolveMutation.isPending}
                          >
                            Resolve
                          </button>
                          {!alertItem.erp_work_order_id && (
                            <button
                              onClick={() => handleCreateWorkOrder(alertItem.alert_id)}
                              disabled={createWorkOrderMutation.isPending}
                              className="work-order-btn"
                            >
                              Create work order
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
