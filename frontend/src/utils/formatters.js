/**
 * Format bytes into a human-readable file size.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const QUALITY_PRESETS = {
  preview: {
    resolution: 512,
    textureSize: 1024,
    decimationTarget: 50000,
  },
  standard: {
    resolution: 512,
    textureSize: 2048,
    decimationTarget: 100000,
  },
  high: {
    resolution: 1024,
    textureSize: 2048,
    decimationTarget: 150000,
  },
}

export const JOB_PROGRESS = {
  queued: 5,
  preprocessing: 15,
  generating_shape: 35,
  generating_texture: 70,
  exporting: 90,
  completed: 100,
  failed: 0,
}

export const JOB_MESSAGES = {
  queued: 'Your model is waiting to start.',
  preprocessing: 'Preparing your image.',
  generating_shape: 'Building the 3D geometry.',
  generating_texture: 'Creating the materials and textures.',
  exporting: 'Packaging the model for the web.',
  completed: 'Your 3D model is ready.',
  failed: 'The model could not be generated.',
}
