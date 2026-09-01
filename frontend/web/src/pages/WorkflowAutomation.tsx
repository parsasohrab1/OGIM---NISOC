import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { reportingAPI } from '../api/services'
import WorkflowDAG from '../components/WorkflowDAG'
import './WorkflowAutomation.css'

type Step = {
  id: string
  type: string
  config: Record<string, any>
  depends_on: string[]
}

export default function WorkflowAutomation() {
  const [name, setName] = useState('Daily Ops Workflow')
  const [description, setDescription] = useState('Auto run DQ + health checks')
  const [scheduleMinutes, setScheduleMinutes] = useState('60')
  const [steps, setSteps] = useState<Step[]>([
    { id: 'dq', type: 'data_quality_lineage', config: { lookback_hours: 24 }, depends_on: [] },
    { id: 'health', type: 'http_request', config: { method: 'GET', url: 'http://localhost:8005/health' }, depends_on: ['dq'] },
  ])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: () => reportingAPI.listWorkflows(),
    refetchInterval: 15000,
  })

  const templatesQuery = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => reportingAPI.getWorkflowTemplates(),
  })

  const stepTypesQuery = useQuery({
    queryKey: ['workflow-step-types'],
    queryFn: () => reportingAPI.getWorkflowStepTypes(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      reportingAPI.createWorkflow({
        name,
        description,
        schedule_minutes: Number(scheduleMinutes) || undefined,
        steps,
      }),
    onSuccess: () => workflowsQuery.refetch(),
  })

  const runMutation = useMutation({
    mutationFn: () => reportingAPI.runWorkflow(selectedWorkflowId, {}),
  })

  const runsQuery = useQuery({
    queryKey: ['workflow-runs', selectedWorkflowId],
    queryFn: () => reportingAPI.getWorkflowRuns(selectedWorkflowId),
    enabled: !!selectedWorkflowId,
  })

  const applyTemplate = (template: any) => {
    setName(template.name)
    setDescription(template.description || '')
    setScheduleMinutes(String(template.schedule_minutes || ''))
    setSteps(template.steps)
  }

  const addStep = () => {
    const idx = steps.length + 1
    setSteps((prev) => [
      ...prev,
      { id: `step${idx}`, type: 'http_request', config: { method: 'GET', url: 'http://localhost:8005/health' }, depends_on: prev.length ? [prev[prev.length - 1].id] : [] },
    ])
  }

  const stepTypeOptions = useMemo(() => stepTypesQuery.data?.step_types || [], [stepTypesQuery.data])

  return (
    <div className="wf-page">
      <h2>Workflow Automation</h2>
      <p className="wf-subtitle">Airflow-like scheduler with visual DAG builder</p>

      <section className="wf-section">
        <h3>Templates</h3>
        <div className="wf-templates">
          {(templatesQuery.data?.templates || []).map((tpl: any) => (
            <button key={tpl.template_id} className="wf-template-btn" onClick={() => applyTemplate(tpl)}>
              <strong>{tpl.name}</strong>
              <span>{tpl.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="wf-layout">
        <section className="wf-section">
          <h3>Create Workflow</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <input value={scheduleMinutes} onChange={(e) => setScheduleMinutes(e.target.value)} placeholder="Schedule (minutes)" />

          <h4>Steps</h4>
          {steps.map((step, idx) => (
            <div key={step.id} className="wf-step-card">
              <input
                value={step.id}
                onChange={(e) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, id: e.target.value } : s)))}
                placeholder="Step ID"
              />
              <select
                value={step.type}
                onChange={(e) => setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, type: e.target.value } : s)))}
              >
                {stepTypeOptions.map((opt: any) => (
                  <option key={opt.type} value={opt.type}>{opt.label}</option>
                ))}
              </select>
              <input
                value={step.depends_on.join(',')}
                onChange={(e) => {
                  const deps = e.target.value.split(',').map((x) => x.trim()).filter(Boolean)
                  setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, depends_on: deps } : s)))
                }}
                placeholder="depends_on (comma separated)"
              />
            </div>
          ))}

          <div className="wf-actions">
            <button onClick={addStep}>Add Step</button>
            <button className="primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </section>

        <section className="wf-section">
          <h3>Visual DAG</h3>
          <WorkflowDAG steps={steps} />
        </section>
      </div>

      <section className="wf-section">
        <h3>Run Workflows</h3>
        <select value={selectedWorkflowId} onChange={(e) => setSelectedWorkflowId(e.target.value)}>
          <option value="">Select workflow</option>
          {(workflowsQuery.data?.workflows || []).map((wf: any) => (
            <option key={wf.workflow_id} value={wf.workflow_id}>{wf.workflow_id} — {wf.name}</option>
          ))}
        </select>
        <button onClick={() => runMutation.mutate()} disabled={!selectedWorkflowId || runMutation.isPending}>
          {runMutation.isPending ? 'Running...' : 'Run Now'}
        </button>
        {runMutation.data && (
          <pre className="wf-pre">{JSON.stringify(runMutation.data, null, 2)}</pre>
        )}
      </section>

      <section className="wf-section">
        <h3>Recent Runs</h3>
        <pre className="wf-pre">{JSON.stringify(runsQuery.data?.runs || [], null, 2)}</pre>
      </section>
    </div>
  )
}
