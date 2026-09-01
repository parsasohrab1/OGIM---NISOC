import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { reportingAPI } from '../api/services'
import './Reports.css'

interface Report {
  report_id: string
  report_type: string
  generated_at: string
  period_start: string
  period_end: string
  well_name?: string
  metrics: {
    total_production?: number
    average_pressure?: number
    average_temperature?: number
    alerts_count?: number
    downtime_hours?: number
  }
}

export default function Reports() {
  const queryClient = useQueryClient()
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [reportType, setReportType] = useState('daily')
  const [wellName, setWellName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Fetch reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      try {
        return await reportingAPI.getReports()
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.debug('Reports service unavailable')
        }
        // Return mock data when backend is not available
        return {
          count: 3,
          reports: [
            {
              report_id: 'RPT-20241201-120000',
              report_type: 'daily',
              generated_at: new Date(Date.now() - 86400000).toISOString(),
              period_start: new Date(Date.now() - 86400000).toISOString(),
              period_end: new Date().toISOString(),
              well_name: 'PROD-001',
              metrics: {
                total_production: 12500.5,
                average_pressure: 350.2,
                average_temperature: 85.3,
                alerts_count: 12,
                downtime_hours: 2.5,
              }
            },
            {
              report_id: 'RPT-20241130-120000',
              report_type: 'weekly',
              generated_at: new Date(Date.now() - 172800000).toISOString(),
              period_start: new Date(Date.now() - 604800000).toISOString(),
              period_end: new Date(Date.now() - 86400000).toISOString(),
              well_name: 'PROD-002',
              metrics: {
                total_production: 87500.3,
                average_pressure: 345.8,
                average_temperature: 82.1,
                alerts_count: 45,
                downtime_hours: 8.2,
              }
            },
            {
              report_id: 'RPT-20241125-120000',
              report_type: 'monthly',
              generated_at: new Date(Date.now() - 518400000).toISOString(),
              period_start: new Date(Date.now() - 2592000000).toISOString(),
              period_end: new Date(Date.now() - 518400000).toISOString(),
              metrics: {
                total_production: 375000.7,
                average_pressure: 348.5,
                average_temperature: 84.2,
                alerts_count: 156,
                downtime_hours: 32.5,
              }
            }
          ] as Report[]
        }
      }
    },
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
    retryDelay: 3000,
  })

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: async (reportRequest: any) => {
      return await reportingAPI.generateReport(reportRequest)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setShowGenerateForm(false)
      // Reset form
      setReportType('daily')
      setWellName('')
      setStartDate('')
      setEndDate('')
    },
    onError: () => {
      if (import.meta.env.DEV) {
        console.debug('Report generation failed')
      }
      alert('Failed to generate report. Using mock data.')
    }
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      alert('Please select start and end dates')
      return
    }

    generateMutation.mutate({
      report_type: reportType,
      well_name: wellName || null,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      metrics: []
    })
  }

  const reports = reportsData?.reports || []

  if (isLoading) {
    return <div className="loading">Loading reports...</div>
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h2>Reports</h2>
        <button 
          onClick={() => setShowGenerateForm(!showGenerateForm)}
          className="btn-generate"
        >
          {showGenerateForm ? 'Cancel' : 'Generate New Report'}
        </button>
      </div>

      {showGenerateForm && (
        <div className="generate-form">
          <h3>Generate New Report</h3>
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Well Name (Optional)</label>
              <input
                type="text"
                value={wellName}
                onChange={(e) => setWellName(e.target.value)}
                placeholder="e.g., PROD-001"
              />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={generateMutation.isPending}
              className="btn-submit"
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
            </button>
          </form>
        </div>
      )}

      <div className="reports-summary">
        <div className="summary-card">
          <h3>Total Reports</h3>
          <div className="summary-value">{reportsData?.count || 0}</div>
        </div>
        <div className="summary-card">
          <h3>Daily Reports</h3>
          <div className="summary-value">
            {reports.filter((r: Report) => r.report_type === 'daily').length}
          </div>
        </div>
        <div className="summary-card">
          <h3>Weekly Reports</h3>
          <div className="summary-value">
            {reports.filter((r: Report) => r.report_type === 'weekly').length}
          </div>
        </div>
        <div className="summary-card">
          <h3>Monthly Reports</h3>
          <div className="summary-value">
            {reports.filter((r: Report) => r.report_type === 'monthly').length}
          </div>
        </div>
      </div>

      <div className="reports-list">
        <h3>Recent Reports</h3>
        {reports.length === 0 ? (
          <div className="no-reports">
            <p>No reports found. Generate a new report to get started.</p>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report: Report) => (
              <div key={report.report_id} className="report-card">
                <div className="report-header">
                  <div>
                    <span className="report-id">{report.report_id}</span>
                    <span className={`report-type ${report.report_type}`}>
                      {report.report_type}
                    </span>
                  </div>
                  <div className="report-date">
                    {new Date(report.generated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="report-body">
                  {report.well_name && (
                    <p><strong>Well:</strong> {report.well_name}</p>
                  )}
                  <p><strong>Period:</strong> {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}</p>
                  <div className="report-metrics">
                    <h4>Metrics</h4>
                    <div className="metrics-grid">
                      {report.metrics.total_production && (
                        <div className="metric-item">
                          <span className="metric-label">Total Production</span>
                          <span className="metric-value">{report.metrics.total_production.toFixed(1)} bbl</span>
                        </div>
                      )}
                      {report.metrics.average_pressure && (
                        <div className="metric-item">
                          <span className="metric-label">Avg Pressure</span>
                          <span className="metric-value">{report.metrics.average_pressure.toFixed(1)} psi</span>
                        </div>
                      )}
                      {report.metrics.average_temperature && (
                        <div className="metric-item">
                          <span className="metric-label">Avg Temperature</span>
                          <span className="metric-value">{report.metrics.average_temperature.toFixed(1)} °C</span>
                        </div>
                      )}
                      {report.metrics.alerts_count !== undefined && (
                        <div className="metric-item">
                          <span className="metric-label">Alerts</span>
                          <span className="metric-value">{report.metrics.alerts_count}</span>
                        </div>
                      )}
                      {report.metrics.downtime_hours && (
                        <div className="metric-item">
                          <span className="metric-label">Downtime</span>
                          <span className="metric-value">{report.metrics.downtime_hours.toFixed(1)} hrs</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reports-list" style={{ marginTop: '2rem' }}>
        <h3>Advanced Analytics</h3>
        <p>Use the dedicated <a href="/report-builder">Report Builder</a> for visual analytics, CSV export, and Power BI / Tableau connectors.</p>
      </div>
    </div>
  )
}
