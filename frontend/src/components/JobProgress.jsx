import { JOB_PROGRESS } from '../utils/formatters'

export default function JobProgress({
  jobStatus,
  progress,
  statusMessage,
}) {
  if (!jobStatus) {
    return null
  }

  const percent =
    typeof progress === 'number'
      ? progress
      : JOB_PROGRESS[jobStatus] ?? 0

  return (
    <section
      className="job-progress"
      aria-labelledby="progress-heading"
    >
      <div className="job-progress__header">
        <h2 id="progress-heading" className="panel-section__title">
          Generation progress
        </h2>
        <span className="job-progress__percent" aria-hidden="true">
          {percent}%
        </span>
      </div>
      <div
        className="job-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Generation progress"
      >
        <div
          className="job-progress__fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="job-progress__message" aria-live="polite">
        {statusMessage}
      </p>
    </section>
  )
}
