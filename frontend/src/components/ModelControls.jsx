export default function ModelControls({
  autoRotate,
  onAutoRotateChange,
  onResetView,
  onFullscreen,
  onDownload,
  hasModel,
  disabled = false,
}) {
  return (
    <div className="model-controls">
      <label className="model-controls__toggle">
        <input
          type="checkbox"
          checked={autoRotate}
          onChange={(event) => onAutoRotateChange(event.target.checked)}
          disabled={disabled || !hasModel}
        />
        <span>Auto rotate</span>
      </label>

      <div className="model-controls__buttons">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onResetView}
          disabled={disabled || !hasModel}
        >
          Reset view
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onFullscreen}
          disabled={disabled || !hasModel}
        >
          Fullscreen
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onDownload}
          disabled={disabled || !hasModel}
        >
          Download GLB
        </button>
      </div>
    </div>
  )
}
