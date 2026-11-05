import '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import EmptyViewerState from './EmptyViewerState'
import ModelControls from './ModelControls'

/**
 * Interactive GLB viewer powered by Google <model-viewer>.
 */
export default function ModelViewer({
  modelUrl,
  autoRotate,
  onAutoRotateChange,
  onDownload,
  onLoadSample,
  downloadDisabled = false,
}) {
  const modelViewerRef = useRef(null)
  const stageRef = useRef(null)
  const [isLoadingModel, setIsLoadingModel] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [modelError, setModelError] = useState('')
  const [modelReady, setModelReady] = useState(false)

  const hasModel = Boolean(modelUrl)

  useEffect(() => {
    if (!modelUrl) {
      setIsLoadingModel(false)
      setLoadProgress(0)
      setModelError('')
      setModelReady(false)
      return
    }

    setIsLoadingModel(true)
    setLoadProgress(0)
    setModelError('')
    setModelReady(false)
  }, [modelUrl])

  useEffect(() => {
    const viewer = modelViewerRef.current
    if (!viewer || !modelUrl) {
      return undefined
    }

    function handleProgress(event) {
      const total = event.detail?.totalProgress
      if (typeof total === 'number') {
        setLoadProgress(Math.round(total * 100))
        if (total >= 1) {
          setIsLoadingModel(false)
        }
      }
    }

    function handleLoad() {
      setIsLoadingModel(false)
      setLoadProgress(100)
      setModelReady(true)
      setModelError('')
    }

    function handleError() {
      setIsLoadingModel(false)
      setModelReady(false)
      setModelError('The 3D model could not be loaded. Try downloading it or generating again.')
    }

    viewer.addEventListener('progress', handleProgress)
    viewer.addEventListener('load', handleLoad)
    viewer.addEventListener('error', handleError)

    return () => {
      viewer.removeEventListener('progress', handleProgress)
      viewer.removeEventListener('load', handleLoad)
      viewer.removeEventListener('error', handleError)
    }
  }, [modelUrl])

  useEffect(() => {
    const viewer = modelViewerRef.current
    if (!viewer) {
      return
    }

    if (autoRotate) {
      viewer.setAttribute('auto-rotate', '')
    } else {
      viewer.removeAttribute('auto-rotate')
    }
  }, [autoRotate, modelUrl, modelReady])

  function handleResetView() {
    const viewer = modelViewerRef.current
    if (!viewer) {
      return
    }

    viewer.cameraOrbit = 'auto auto auto'
    viewer.fieldOfView = 'auto'
    viewer.resetTurntableRotation()
    if (typeof viewer.jumpCameraToGoal === 'function') {
      viewer.jumpCameraToGoal()
    }
  }

  function handleFullscreen() {
    const stage = stageRef.current
    if (!stage) {
      return
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.()
      return
    }

    stage.requestFullscreen?.()
  }

  return (
    <section className="viewer-panel" aria-labelledby="viewer-heading">
      <div className="viewer-panel__header">
        <h2 id="viewer-heading" className="panel-section__title">
          3D preview
        </h2>
      </div>

      <div
        className={`viewer-stage${hasModel ? ' viewer-stage--active' : ''}`}
        ref={stageRef}
      >
        {!hasModel ? (
          <EmptyViewerState onLoadSample={onLoadSample} />
        ) : (
          <>
            <model-viewer
              ref={modelViewerRef}
              className="viewer-model"
              src={modelUrl}
              alt="Generated 3D model"
              camera-controls
              touch-action="pan-y"
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="1"
              tone-mapping="neutral"
              environment-image="neutral"
              interaction-prompt="auto"
              ar-modes="webxr scene-viewer quick-look"
            ></model-viewer>

            {isLoadingModel ? (
              <div className="viewer-stage__overlay" aria-live="polite">
                <p className="viewer-stage__status">
                  Loading 3D model...
                  {loadProgress > 0 ? ` ${loadProgress}%` : ''}
                </p>
              </div>
            ) : null}

            {modelError ? (
              <div className="viewer-stage__overlay viewer-stage__overlay--error">
                <p className="viewer-stage__error" role="alert">
                  {modelError}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ModelControls
        autoRotate={autoRotate}
        onAutoRotateChange={onAutoRotateChange}
        onResetView={handleResetView}
        onFullscreen={handleFullscreen}
        onDownload={onDownload}
        hasModel={hasModel && modelReady}
        disabled={downloadDisabled || Boolean(modelError)}
      />
    </section>
  )
}
