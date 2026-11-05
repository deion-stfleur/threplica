/**
 * Inline error display. Never use browser alert().
 */
export default function ErrorMessage({ id, message, onRetry, onDismiss }) {
  if (!message) {
    return null
  }

  return (
    <div
      id={id}
      className="error-message"
      role="alert"
      aria-live="assertive"
    >
      <p>{message}</p>
      <div className="error-message__actions">
        {onRetry ? (
          <button type="button" className="btn btn--secondary" onClick={onRetry}>
            Retry
          </button>
        ) : null}
        {onDismiss ? (
          <button type="button" className="btn btn--ghost" onClick={onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  )
}
