export default function Header({ healthLabel, healthStatus = 'loading' }) {
  return (
    <header className="site-header">
      <div className="site-header__text">
        <h1 className="site-brand">SpatialForge</h1>
        <p className="site-subtitle">Image to interactive 3D</p>
      </div>
      {healthLabel ? (
        <p
          className={`health-badge health-badge--${healthStatus}`}
          aria-live="polite"
        >
          <span className="health-badge__dot" aria-hidden="true" />
          {healthLabel}
        </p>
      ) : null}
    </header>
  )
}
