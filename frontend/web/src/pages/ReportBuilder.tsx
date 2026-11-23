import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportingAPI } from '../api/services'
import { getApiBaseUrl } from '../api/config'
import './ReportBuilder.css'

const DIMENSIONS = ['well_name', 'sensor_type', 'sensor_id']
const MEASURES = ['count', 'avg_value', 'min_value', 'max_value', 'sum_value']

const DIM_LABEL_FA: Record<string, string> = {
  well_name: 'Well name',
  sensor_type: 'Sensor type',
  sensor_id: 'Sensor ID',
}

const MEASURE_LABEL_FA: Record<string, string> = {
  count: 'Count',
  avg_value: 'Average',
  min_value: 'Minimum',
  max_value: 'Maximum',
  sum_value: 'Total',
}

export default function ReportBuilder() {
  const [name, setName] = useState('Production analysis')
  const [wellName, setWellName] = useState('')
  const [selectedDims, setSelectedDims] = useState<string[]>(['well_name', 'sensor_type'])
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>(['count', 'avg_value'])
  const [result, setResult] = useState<any>(null)

  const { data: biMetadata } = useQuery({
    queryKey: ['bi-metadata'],
    queryFn: () => reportingAPI.getBIMetadata(),
  })

  const { data: biConnectors } = useQuery({
    queryKey: ['bi-connectors'],
    queryFn: () => reportingAPI.getBIConnectors(),
  })

  const buildMutation = useMutation({
    mutationFn: () =>
      reportingAPI.runReportBuilder({
        name,
        well_name: wellName || undefined,
        dimensions: selectedDims,
        measures: selectedMeasures,
        filters: {},
        limit: 100,
      }),
    onSuccess: (data) => setResult(data),
  })

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  const labelFor = (key: string) => DIM_LABEL_FA[key] || MEASURE_LABEL_FA[key] || key

  const exportCsv = () => {
    if (!result?.rows?.length) return
    const headers = [...selectedDims, ...selectedMeasures]
    const lines = [headers.join(',')]
    result.rows.forEach((row: any) => {
      lines.push(headers.map((h) => row[h] ?? '').join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.report_id || 'report'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = (result?.rows || []).slice(0, 12).map((row: any) => ({
    label: row.well_name || row.sensor_type || row.sensor_id || '—',
    value: row.avg_value ?? row.count ?? 0,
  }))

  const apiBase = getApiBaseUrl()

  return (
    <div className="rb-page" dir="rtl">
      <h2>Report builder / advanced analysis</h2>

      <div className="rb-grid">
        <section className="rb-panel">
          <h3>Report configuration</h3>
          <label>Report name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Well (optional)</label>
          <input value={wellName} onChange={(e) => setWellName(e.target.value)} placeholder="MN-01" />

          <label>Dimensions</label>
          <div className="rb-chips">
            {DIMENSIONS.map((d) => (
              <button key={d} className={selectedDims.includes(d) ? 'active' : ''} onClick={() => toggle(selectedDims, d, setSelectedDims)}>
                {DIM_LABEL_FA[d] || d}
              </button>
            ))}
          </div>

          <label>Measures</label>
          <div className="rb-chips">
            {MEASURES.map((m) => (
              <button key={m} className={selectedMeasures.includes(m) ? 'active' : ''} onClick={() => toggle(selectedMeasures, m, setSelectedMeasures)}>
                {MEASURE_LABEL_FA[m] || m}
              </button>
            ))}
          </div>

          <button className="rb-run" onClick={() => buildMutation.mutate()} disabled={buildMutation.isPending || !selectedDims.length || !selectedMeasures.length}>
            {buildMutation.isPending ? 'Building…' : 'Run report'}
          </button>
        </section>

        <section className="rb-panel">
          <h3>Preview</h3>
          {!result ? (
            <p className="rb-muted">Run the report to see the result.</p>
          ) : (
            <>
              <div className="rb-meta">Rows: {result.count} | ID: {result.report_id}</div>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4a6cf7" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="rb-table-wrap">
                <table>
                  <thead>
                    <tr>
                      {[...selectedDims, ...selectedMeasures].map((h) => <th key={h}>{labelFor(h)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(result.rows || []).slice(0, 15).map((row: any, i: number) => (
                      <tr key={i}>
                        {[...selectedDims, ...selectedMeasures].map((h) => <td key={h}>{row[h] ?? '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="rb-export" onClick={exportCsv}>Export spreadsheet file</button>
            </>
          )}
        </section>
      </div>

      <section className="rb-panel full">
        <h3>Power BI / Tableau integration</h3>
        <div className="rb-connectors">
          <div className="rb-connector-card">
            <strong>Power BI</strong>
            <p>REST endpoint: <code>{biConnectors?.power_bi?.base_url || `${apiBase}/api/reporting/bi/query`}</code></p>
            <p>Metadata: <code>{biConnectors?.power_bi?.metadata_url || `${apiBase}/api/reporting/bi/metadata`}</code></p>
            <p>{biConnectors?.power_bi?.notes}</p>
          </div>
          <div className="rb-connector-card">
            <strong>Tableau</strong>
            <p>REST endpoint: <code>{biConnectors?.tableau?.base_url || `${apiBase}/api/reporting/bi/query`}</code></p>
            <p>Metadata: <code>{biConnectors?.tableau?.metadata_url || `${apiBase}/api/reporting/bi/metadata`}</code></p>
            <p>{biConnectors?.tableau?.notes}</p>
          </div>
        </div>
        <details>
          <summary>BI schema metadata</summary>
          <pre>{JSON.stringify(biMetadata, null, 2)}</pre>
        </details>
      </section>
    </div>
  )
}
