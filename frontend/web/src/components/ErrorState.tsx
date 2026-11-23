import './ErrorState.css'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Failed to load data from the server.', onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" dir="rtl">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry}>Try again</button>
      )}
    </div>
  )
}
