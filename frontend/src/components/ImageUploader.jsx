import { useId, useRef, useState } from 'react'
import { validateImageFiles } from '../utils/fileValidation'
import { formatFileSize } from '../utils/formatters'
import ErrorMessage from './ErrorMessage'

export default function ImageUploader({
  selectedFile,
  previewUrl,
  onFileSelected,
  onRemove,
  disabled = false,
}) {
  const inputId = useId()
  const errorId = useId()
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState('')
  const [tipsOpen, setTipsOpen] = useState(false)

  function handleValidatedFiles(files) {
    const result = validateImageFiles(files)
    if (!result.ok) {
      setLocalError(result.error)
      return
    }

    setLocalError('')
    onFileSelected(result.file)
  }

  function handleInputChange(event) {
    handleValidatedFiles(event.target.files)
    event.target.value = ''
  }

  function handleDragOver(event) {
    event.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) {
      return
    }
    handleValidatedFiles(event.dataTransfer.files)
  }

  return (
    <section className="panel-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="panel-section__title">
        Upload image
      </h2>

      {!previewUrl ? (
        <div
          className={`upload-dropzone${isDragging ? ' upload-dropzone--active' : ''}${disabled ? ' upload-dropzone--disabled' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            disabled={disabled}
            aria-describedby={`${errorId} upload-help`}
            className="upload-dropzone__input"
          />
          <label htmlFor={inputId} className="upload-dropzone__label">
            <span className="upload-dropzone__icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect
                  x="6"
                  y="10"
                  width="28"
                  height="22"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M14 22l4.5-4.5L23 22l4-5 5 7H10l4-5z"
                  fill="currentColor"
                  opacity="0.35"
                />
                <circle cx="27" cy="16" r="2.5" fill="currentColor" opacity="0.55" />
              </svg>
            </span>
            <span className="upload-dropzone__title">Drop an image here</span>
            <span className="upload-dropzone__or">or choose a file</span>
            <span id="upload-help" className="upload-dropzone__meta">
              JPG, PNG, or WebP · Max 10 MB · One file only
            </span>
          </label>
        </div>
      ) : (
        <div className="upload-preview">
          <div className="upload-preview__frame">
            <img
              src={previewUrl}
              alt={selectedFile ? `Preview of ${selectedFile.name}` : 'Selected image preview'}
            />
          </div>
          <div className="upload-preview__meta">
            <p className="upload-preview__name">{selectedFile?.name}</p>
            <p className="upload-preview__size">
              {formatFileSize(selectedFile?.size ?? 0)}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--full"
            onClick={() => {
              setLocalError('')
              onRemove()
            }}
            disabled={disabled}
          >
            Remove image
          </button>
        </div>
      )}

      <ErrorMessage
        id={errorId}
        message={localError}
        onDismiss={() => setLocalError('')}
      />

      <div className="upload-tips">
        <button
          type="button"
          className="upload-tips__toggle"
          aria-expanded={tipsOpen}
          onClick={() => setTipsOpen((open) => !open)}
        >
          For better results
          <span aria-hidden="true">{tipsOpen ? '−' : '+'}</span>
        </button>
        {tipsOpen ? (
          <ul className="upload-tips__list">
            <li>Use one object per image.</li>
            <li>Show the entire object.</li>
            <li>Use a clean or simple background.</li>
            <li>Use a three-quarter camera angle.</li>
            <li>Avoid people blocking the product.</li>
            <li>Avoid heavily cropped images.</li>
          </ul>
        ) : null}
      </div>
    </section>
  )
}
