import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { kpiAPI } from '../api/services'
import { isOfflineLiveForced, shouldUseLocalLive } from '../api/offlineMode'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

function featureFromPath(pathname: string): string {
  if (pathname === '/') return 'dashboard'
  const segment = pathname.replace(/^\//, '').split('/')[0]
  return segment || 'dashboard'
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user } = useAuth()
  const [offlineLive, setOfflineLive] = useState(() => shouldUseLocalLive())

  useEffect(() => {
    const sync = () => setOfflineLive(shouldUseLocalLive())
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    sync()
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  useEffect(() => {
    if (shouldUseLocalLive()) return
    const feature = featureFromPath(location.pathname)
    kpiAPI.recordFeatureUsage(feature).catch(() => {
      /* non-blocking adoption metric */
    })
  }, [location.pathname])

  const link = (to: string, label: string) => (
    <Link to={to} className={location.pathname === to ? 'active' : ''}>
      {label}
    </Link>
  )

  return (
    <div className="layout" dir="rtl">
      <nav className="navbar">
        <div className="navbar-top">
          <div className="nav-brand">
            <h1>Field Smartification</h1>
            <span>Maroun field · National Iranian South Oil Company</span>
          </div>
          {user && (
            <div className="nav-user">
              {(offlineLive || isOfflineLiveForced()) && (
                <span className="offline-live-badge" title="Live run without needing internet or a backend">
                  Live offline
                </span>
              )}
              <span>
                {user.username} ({roleFa(user.role)})
              </span>
            </div>
          )}
        </div>
        <div className="nav-links">
          {link('/', 'Dashboard')}
          {link('/wells', 'Wells')}
          {link('/alerts', 'Alerts')}
          {link('/production-forecast', 'Production forecast')}
          {link('/dvr', 'Data validation')}
          {link('/maintenance', 'Predictive maintenance')}
          {link('/scada', 'SCADA and PLC')}
          {link('/well3d', '3D view')}
          {link('/ar-integration', 'Augmented reality')}
          {link('/report-builder', 'Report builder')}
          {link('/subsidiaries', 'Subsidiary companies')}
          {link('/subsidiary-production', 'Subsidiary production status')}
          {link('/equipment', 'Equipment')}
          {link('/manual-data-entry', 'Manual well data entry')}
          {link('/vfm-decline', 'Virtual flow meter and decline curve')}
          {link('/access-control', 'Access levels')}
          {link('/system', 'System')}
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  )
}

function roleFa(role: string) {
  const map: Record<string, string> = {
    system_admin: 'System administrator',
    hq_operations_chief: 'Head of Operations Engineering (HQ)',
    subsidiary_ops_manager: 'Subsidiary operations manager',
    field_supervisor: 'Field operations supervisor',
    field_operator: 'Field operator',
    data_engineer: 'Data engineer',
    data_entry_operator: 'Well data entry clerk',
    viewer: 'Viewer',
    admin: 'Admin',
    offline_operator: 'Offline operator',
    guest: 'Guest',
  }
  return map[role] || role
}
