type WorkflowStep = {
  id: string
  type: string
  config: Record<string, any>
  depends_on: string[]
}

type Props = {
  steps: WorkflowStep[]
}

export default function WorkflowDAG({ steps }: Props) {
  if (!steps.length) {
    return <p className="wf-muted">Add steps to see the workflow graph.</p>
  }

  const nodeW = 160
  const nodeH = 56
  const gapY = 70
  const positions: Record<string, { x: number; y: number }> = {}

  steps.forEach((step, i) => {
    positions[step.id] = { x: 40, y: 30 + i * (nodeH + gapY) }
  })

  const height = steps.length * (nodeH + gapY) + 40

  return (
    <svg className="wf-dag" viewBox={`0 0 260 ${height}`} role="img" aria-label="Workflow DAG">
      {steps.flatMap((step) =>
        step.depends_on.map((dep) => {
          const from = positions[dep]
          const to = positions[step.id]
          if (!from || !to) return null
          return (
            <line
              key={`${dep}-${step.id}`}
              x1={from.x + nodeW / 2}
              y1={from.y + nodeH}
              x2={to.x + nodeW / 2}
              y2={to.y}
              stroke="#4a6cf7"
              strokeWidth="2"
              markerEnd="url(#wf-arrow)"
            />
          )
        })
      )}
      <defs>
        <marker id="wf-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4a6cf7" />
        </marker>
      </defs>
      {steps.map((step) => {
        const pos = positions[step.id]
        return (
          <g key={step.id}>
            <rect x={pos.x} y={pos.y} width={nodeW} height={nodeH} rx="8" fill="#2a2a2a" stroke="#4a6cf7" />
            <text x={pos.x + 10} y={pos.y + 22} fill="#fff" fontSize="12" fontWeight="bold">{step.id}</text>
            <text x={pos.x + 10} y={pos.y + 40} fill="#888" fontSize="10">{step.type}</text>
          </g>
        )
      })}
    </svg>
  )
}
