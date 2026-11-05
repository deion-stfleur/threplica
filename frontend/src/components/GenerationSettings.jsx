import { useId } from 'react'

export default function GenerationSettings({
  quality,
  seed,
  removeBackground,
  onQualityChange,
  onSeedChange,
  onRemoveBackgroundChange,
  disabled = false,
}) {
  const qualityId = useId()
  const seedId = useId()
  const bgId = useId()
  const seedHelpId = useId()

  function handleSeedInput(event) {
    const value = event.target.value
    if (value === '' || /^-?\d*$/.test(value)) {
      onSeedChange(value)
    }
  }

  return (
    <section className="panel-section" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="panel-section__title">
        Generation settings
      </h2>

      <div className="field">
        <label htmlFor={qualityId}>Quality</label>
        <select
          id={qualityId}
          value={quality}
          onChange={(event) => onQualityChange(event.target.value)}
          disabled={disabled}
        >
          <option value="preview">Preview</option>
          <option value="standard">Standard</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor={seedId}>Seed (optional)</label>
        <input
          id={seedId}
          type="text"
          inputMode="numeric"
          pattern="-?[0-9]*"
          value={seed}
          onChange={handleSeedInput}
          placeholder="Leave blank for a random seed"
          disabled={disabled}
          aria-describedby={seedHelpId}
          autoComplete="off"
        />
        <p id={seedHelpId} className="field__help">
          Use the same seed to reproduce a similar result.
        </p>
      </div>

      <div className="field field--checkbox">
        <input
          id={bgId}
          type="checkbox"
          checked={removeBackground}
          onChange={(event) => onRemoveBackgroundChange(event.target.checked)}
          disabled={disabled}
        />
        <label htmlFor={bgId}>Automatically remove image background</label>
      </div>
    </section>
  )
}
