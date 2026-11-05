export default function EmptyViewerState({ onLoadSample }) {
  return (
    <div className="empty-viewer">
      <div className="empty-viewer__cube" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="88" height="88" fill="none">
          <path
            d="M60 18L98 38v44L60 102 22 82V38L60 18z"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M60 18v84M22 38l38 20 38-20" stroke="currentColor" strokeWidth="2" />
          <path d="M60 58l38-20M60 58L22 38" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        </svg>
      </div>
      <p className="empty-viewer__title">Your generated model will appear here.</p>
      <p className="empty-viewer__copy">
        Upload an image and generate a model to rotate and inspect it in 3D.
      </p>
      {onLoadSample ? (
        <button
          type="button"
          className="btn btn--secondary empty-viewer__sample"
          onClick={onLoadSample}
        >
          Load sample model
        </button>
      ) : null}
    </div>
  )
}
