const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Validate a single uploaded image file before any network request.
 * @param {FileList|File[]|null|undefined} files
 * @returns {{ ok: true, file: File } | { ok: false, error: string }}
 */
export function validateImageFiles(files) {
  if (!files || files.length === 0) {
    return { ok: false, error: 'Please choose an image to upload.' }
  }

  if (files.length > 1) {
    return { ok: false, error: 'Please upload only one image at a time.' }
  }

  const file = files[0]

  if (!file || file.size === 0) {
    return { ok: false, error: 'The selected file is empty.' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'The selected image is larger than 10 MB.' }
  }

  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  const hasValidType = ACCEPTED_TYPES.includes(type)
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))

  if (!hasValidType && !hasValidExtension) {
    return { ok: false, error: 'Please choose a JPG, PNG, or WebP image.' }
  }

  return { ok: true, file }
}

export { ACCEPTED_TYPES, MAX_FILE_SIZE_BYTES }
