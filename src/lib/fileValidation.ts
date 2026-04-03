const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46]
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]

const hasSignature = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte)

const isAllowedImageBytes = (bytes: Uint8Array) => (
  hasSignature(bytes, JPEG_SIGNATURE) ||
  hasSignature(bytes, PNG_SIGNATURE) ||
  (hasSignature(bytes, RIFF_SIGNATURE) && hasSignature(bytes, WEBP_SIGNATURE, 8))
)

const ensureImageCanBeDecoded = async (file: File) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
      return
    } catch {
      throw new Error(`${file.name} は画像として壊れているか、内容が不正です。`)
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image()

      image.onload = () => {
        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
          resolve()
          return
        }
        reject(new Error(`${file.name} は画像として壊れているか、内容が不正です。`))
      }

      image.onerror = () => reject(new Error(`${file.name} は画像として壊れているか、内容が不正です。`))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export const validateAllowedImageFiles = async (files: File[]) => {
  for (const file of files) {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())

    if (!isAllowedImageBytes(header)) {
      throw new Error(`${file.name} は許可されていない画像形式です。JPEG / PNG / WebP のみアップロードできます。`)
    }

    await ensureImageCanBeDecoded(file)
  }
}
