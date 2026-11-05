export default function GenerateButton({
  disabled,
  isSubmitting,
  isActive,
  onClick,
}) {
  let label = 'Generate 3D Model'

  if (isSubmitting) {
    label = 'Uploading image...'
  } else if (isActive) {
    label = 'Generating model...'
  }

  return (
    <button
      type="button"
      className="btn btn--primary btn--full"
      onClick={onClick}
      disabled={disabled || isSubmitting || isActive}
    >
      {label}
    </button>
  )
}
