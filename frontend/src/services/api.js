/**
 * Native Fetch API client for the SpatialForge backend.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '')

export function getApiBaseUrl() {
  return API_BASE_URL
}

async function readErrorDetail(response) {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') {
      return data.detail
    }
    if (Array.isArray(data?.detail)) {
      return data.detail.map((item) => item.msg || JSON.stringify(item)).join(' ')
    }
  } catch {
    // Ignore JSON parse failures and fall through.
  }
  return `Request failed (${response.status}).`
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

/**
 * @param {{
 *   file: File,
 *   quality: string,
 *   seed?: string,
 *   removeBackground: boolean,
 * }} options
 */
export async function createGeneration({
  file,
  quality,
  seed = '',
  removeBackground = true,
}) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('quality', quality)
  formData.append('remove_background', removeBackground ? 'true' : 'false')
  if (seed !== '' && seed != null) {
    formData.append('seed', String(seed))
  }

  const response = await fetch(`${API_BASE_URL}/api/generations`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function getJobStatus(jobId) {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}
