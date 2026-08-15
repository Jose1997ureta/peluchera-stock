export interface CompressImageOptions {
  /** Lado más largo de la imagen resultante, en px. */
  maxDimension: number
  quality?: number
}

/**
 * Redimensiona y recomprime una imagen a WebP en el navegador antes de subirla
 * a Storage — una foto de celular sin comprimir puede pesar 3-4 MB, y no hace
 * falta esa resolución para una miniatura de catálogo o un avatar.
 */
export async function compressImage(
  file: File,
  { maxDimension, quality = 0.82 }: CompressImageOptions,
): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  if (!blob) return file

  const newName = `${file.name.replace(/\.[^./]+$/, '')}.webp`
  return new File([blob], newName, { type: 'image/webp' })
}
