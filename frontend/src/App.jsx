import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import ImageUploader from './components/ImageUploader'
import GenerationSettings from './components/GenerationSettings'
import GenerateButton from './components/GenerateButton'
import JobProgress from './components/JobProgress'
import ModelViewer from './components/ModelViewer'
import ErrorMessage from './components/ErrorMessage'
import { useGenerationJob } from './hooks/useGenerationJob'
import { getHealth } from './services/api'

export const SAMPLE_MODEL_URL = '/sample-model.glb'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [quality, setQuality] = useState('standard')
  const [seed, setSeed] = useState('')
  const [removeBackground, setRemoveBackground] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const [localError, setLocalError] = useState('')
  const [health, setHealth] = useState({
    status: 'loading',
    label: 'Generator is starting',
  })
  const [sampleModelUrl, setSampleModelUrl] = useState('')

  const previewUrlRef = useRef('')
  const {
    jobId,
    jobStatus,
    progress,
    statusMessage,
    modelUrl,
    downloadUrl,
    isSubmitting,
    isActive,
    error: jobError,
    createJob,
    resetJob,
    clearError,
  } = useGenerationJob()

  const refreshHealth = useCallback(async () => {
    try {
      const data = await getHealth()
      if (data.model_loaded) {
        setHealth({ status: 'ready', label: 'Generator ready' })
      } else {
        setHealth({ status: 'starting', label: 'Generator is starting' })
      }
    } catch {
      setHealth({ status: 'unavailable', label: 'Generator unavailable' })
    }
  }, [])

  useEffect(() => {
    refreshHealth()
    const timer = setInterval(refreshHealth, 15000)
    return () => clearInterval(timer)
  }, [refreshHealth])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  function setPreviewFile(file) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const nextUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextUrl
    setSelectedFile(file)
    setPreviewUrl(nextUrl)
    setLocalError('')
    setSampleModelUrl('')
    resetJob()
  }

  function removeImage() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    setSelectedFile(null)
    setPreviewUrl('')
    setLocalError('')
  }

  function loadSampleModel() {
    setLocalError('')
    clearError()
    setSampleModelUrl(SAMPLE_MODEL_URL)
  }

  async function handleGenerate() {
    setLocalError('')
    setSampleModelUrl('')
    clearError()

    if (!selectedFile) {
      setLocalError('Please choose an image to upload.')
      return
    }

    if (health.status === 'unavailable') {
      setLocalError(
        'Generator unavailable. Start the backend on port 8000 and try again.',
      )
      return
    }

    await createJob({
      file: selectedFile,
      quality,
      seed,
      removeBackground,
    })
  }

  function handleGenerateAnother() {
    setSampleModelUrl('')
    resetJob()
    setLocalError('')
  }

  function handleDownload() {
    const url = downloadUrl || modelUrl || sampleModelUrl
    if (!url) {
      return
    }

    const link = document.createElement('a')
    link.href = url
    link.download = jobId
      ? `spatialforge-${jobId}.glb`
      : 'spatialforge-sample.glb'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const displayModelUrl = modelUrl || sampleModelUrl
  const backendUnavailable = health.status === 'unavailable'
  const canGenerate =
    Boolean(selectedFile) &&
    !isSubmitting &&
    !isActive &&
    !backendUnavailable

  const errorMessage = localError || jobError

  return (
    <div className="app-shell">
      <Header healthLabel={health.label} healthStatus={health.status} />

      <section className="intro" aria-labelledby="intro-heading">
        <h2 id="intro-heading" className="intro__title">
          Turn a single product photo into an interactive 3D model.
        </h2>
        <p className="intro__copy">
          Upload a clear image of one object. SpatialForge will generate a
          visual 3D approximation that you can rotate, inspect, and download.
        </p>
        <p className="intro__notice" role="note">
          Generated models are visual estimates and may not match the
          object&apos;s exact dimensions or hidden surfaces.
        </p>
      </section>

      <main className="workspace">
        <aside className="workspace__controls panel">
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onFileSelected={setPreviewFile}
            onRemove={removeImage}
            disabled={isSubmitting || isActive}
          />

          <GenerationSettings
            quality={quality}
            seed={seed}
            removeBackground={removeBackground}
            onQualityChange={setQuality}
            onSeedChange={setSeed}
            onRemoveBackgroundChange={setRemoveBackground}
            disabled={isSubmitting || isActive}
          />

          <GenerateButton
            disabled={!canGenerate}
            isSubmitting={isSubmitting}
            isActive={isActive}
            onClick={handleGenerate}
          />

          {jobStatus === 'completed' ? (
            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={handleGenerateAnother}
            >
              Generate another model
            </button>
          ) : null}

          <JobProgress
            jobStatus={jobStatus}
            progress={progress}
            statusMessage={statusMessage}
          />

          <ErrorMessage
            message={errorMessage}
            onRetry={
              backendUnavailable
                ? refreshHealth
                : selectedFile
                  ? handleGenerate
                  : undefined
            }
            onDismiss={() => {
              setLocalError('')
              clearError()
            }}
          />
        </aside>

        <div className="workspace__viewer panel">
          <ModelViewer
            modelUrl={displayModelUrl}
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            onDownload={handleDownload}
            onLoadSample={loadSampleModel}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
