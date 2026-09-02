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
            <h1>هوشمندسازی میادین</h1>
            <span>میدان مارون · شرکت ملی مناطق نفت‌خیز جنوب</span>
          </div>
          {user && (
            <div className="nav-user">
              {(offlineLive || isOfflineLiveForced()) && (
                <span className="offline-live-badge" title="اجرای زنده بدون نیاز به اینترنت یا بک‌اند">
                  زنده آفلاین
                </span>
              )}
              <span>
                {user.username} ({roleFa(user.role)})
              </span>
            </div>
          )}
        </div>
        <div className="nav-links">
          {link('/', 'داشبورد')}
          {link('/wells', 'چاه‌ها')}
          {link('/alerts', 'هشدارها')}
          {link('/production-forecast', 'پیش‌بینی تولید')}
          {link('/dvr', 'اعتبارسنجی داده')}
          {link('/maintenance', 'نگهداری پیش‌بینانه')}
          {link('/scada', 'اسکادا و کنترل‌گر منطقی')}
          {link('/well3d', 'نمایش سه‌بعدی')}
          {link('/ar-integration', 'واقعیت افزوده')}
          {link('/report-builder', 'گزارش‌ساز')}
          {link('/subsidiaries', 'شرکت‌های تابعه')}
          {link('/subsidiary-production', 'وضعیت تولید شرکت‌های تابعه')}
          {link('/equipment', 'تجهیزات')}
          {link('/manual-data-entry', 'ثبت دستی اطلاعات چاه')}
          {link('/vfm-decline', 'دبی‌سنج مجازی و منحنی افت')}
          {link('/access-control', 'سطوح دسترسی')}
          {link('/system', 'سیستم')}
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  )
}

function roleFa(role: string) {
  const map: Record<string, string> = {
    system_admin: 'مدیر سیستم',
    hq_operations_chief: 'رئیس مهندسی بهره‌برداری ستاد',
    subsidiary_ops_manager: 'مدیر بهره‌برداری شرکت تابعه',
    field_supervisor: 'سرپرست عملیات میدان',
    field_operator: 'اپراتور میدان',
    data_engineer: 'مهندس داده',
    data_entry_operator: 'متصدی ثبت اطلاعات چاه',
    viewer: 'بازدیدکننده',
    admin: 'مدیر',
    offline_operator: 'اپراتور آفلاین',
    guest: 'مهمان',
  }
  return map[role] || role
}
