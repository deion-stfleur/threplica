import { useCallback, useEffect, useRef, useState } from 'react'
import { createGeneration, getJobStatus } from '../services/api'

const POLL_INTERVAL_MS = 2000

const initialJobState = {
  jobId: null,
  jobStatus: null,
  progress: 0,
  statusMessage: '',
  modelUrl: '',
  downloadUrl: '',
  seed: null,
  isSubmitting: false,
  error: '',
}

/**
 * Manages generation job creation, polling, and reset.
 */
export function useGenerationJob() {
  const [job, setJob] = useState(initialJobState)
  const pollTimerRef = useRef(null)
  const activeJobIdRef = useRef(null)
  const mountedRef = useRef(true)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const resetJob = useCallback(() => {
    stopPolling()
    activeJobIdRef.current = null
    setJob(initialJobState)
  }, [stopPolling])

  const applyJobPayload = useCallback((payload) => {
    setJob((prev) => ({
      ...prev,
      jobId: payload.job_id,
      jobStatus: payload.status,
      progress: payload.progress ?? prev.progress,
      statusMessage: payload.message || '',
      modelUrl: payload.model_url || '',
      downloadUrl: payload.download_url || '',
      seed: payload.seed ?? prev.seed,
      error:
        payload.status === 'failed'
          ? payload.error || payload.message || 'The model could not be generated.'
          : '',
      isSubmitting: false,
    }))
  }, [])

  const pollOnce = useCallback(
    async (jobId) => {
      try {
        const payload = await getJobStatus(jobId)
        if (!mountedRef.current || activeJobIdRef.current !== jobId) {
          return
        }

        applyJobPayload(payload)

        if (payload.status === 'completed' || payload.status === 'failed') {
          stopPolling()
        }
      } catch (error) {
        if (!mountedRef.current || activeJobIdRef.current !== jobId) {
          return
        }

        stopPolling()
        setJob((prev) => ({
          ...prev,
          isSubmitting: false,
          error:
            error.message ||
            'Lost connection while checking generation status. Please try again.',
        }))
      }
    },
    [applyJobPayload, stopPolling],
  )

  const startPolling = useCallback(
    (jobId) => {
      stopPolling()
      activeJobIdRef.current = jobId
      pollTimerRef.current = setInterval(() => {
        pollOnce(jobId)
      }, POLL_INTERVAL_MS)
      // Immediate first poll so UI updates before the first interval tick.
      pollOnce(jobId)
    },
    [pollOnce, stopPolling],
  )

  const createJob = useCallback(
    async ({ file, quality, seed, removeBackground }) => {
      if (!file) {
        setJob((prev) => ({
          ...prev,
          error: 'Please choose an image to upload.',
        }))
        return null
      }

      stopPolling()
      activeJobIdRef.current = null

      setJob({
        ...initialJobState,
        isSubmitting: true,
        error: '',
        statusMessage: 'Uploading image...',
      })

      try {
        const accepted = await createGeneration({
          file,
          quality,
          seed,
          removeBackground,
        })

        if (!mountedRef.current) {
          return null
        }

        setJob({
          ...initialJobState,
          jobId: accepted.job_id,
          jobStatus: accepted.status,
          progress: 5,
          statusMessage: accepted.message || 'Your model is waiting to start.',
          isSubmitting: false,
          error: '',
        })

        startPolling(accepted.job_id)
        return accepted.job_id
      } catch (error) {
        if (!mountedRef.current) {
          return null
        }

        setJob({
          ...initialJobState,
          isSubmitting: false,
          error:
            error.message ||
            'Could not start generation. Check that the backend is running.',
        })
        return null
      }
    },
    [startPolling, stopPolling],
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopPolling()
    }
  }, [stopPolling])

  const isActive =
    job.isSubmitting ||
    (job.jobStatus &&
      job.jobStatus !== 'completed' &&
      job.jobStatus !== 'failed')

  return {
    ...job,
    isActive: Boolean(isActive),
    createJob,
    resetJob,
    clearError: () => setJob((prev) => ({ ...prev, error: '' })),
  }
}
