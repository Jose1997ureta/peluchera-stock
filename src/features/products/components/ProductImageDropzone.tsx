import { Camera, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/shared/utils/cn'
import { PRODUCT_IMAGE_ACCEPTED_TYPES } from '../schemas/product.schema'

export interface ProductImageDropzoneProps {
  previewUrl: string | null
  onFileSelect: (file: File) => void
  onClear: () => void
}

export function ProductImageDropzone({
  previewUrl,
  onFileSelect,
  onClear,
}: ProductImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file && PRODUCT_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      onFileSelect(file)
    }
  }

  function resetInputs() {
    if (inputRef.current) inputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border border-dashed border-input bg-muted/40 transition-colors',
        isDraggingOver && 'border-primary bg-primary/5',
        !previewUrl && 'hover:border-primary/60 hover:bg-primary/5',
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDraggingOver(false)
        handleFiles(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPTED_TYPES.join(',')}
        onChange={(event) => handleFiles(event.target.files)}
        className="sr-only"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPTED_TYPES.join(',')}
        capture="environment"
        onChange={(event) => handleFiles(event.target.files)}
        className="sr-only"
      />

      {previewUrl ? (
        <div className="relative h-40 w-full">
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Quitar imagen"
            onClick={(event) => {
              event.stopPropagation()
              onClear()
              resetInputs()
            }}
            className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 p-4">
          <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 transition-colors hover:border-primary/60 hover:bg-primary/5 sm:flex-none"
            >
              <Upload className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Subir archivo</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 transition-colors hover:border-primary/60 hover:bg-primary/5 sm:flex-none"
            >
              <Camera className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Tomar foto</span>
            </button>
          </div>
          <span className="text-center text-xs text-muted-foreground">
            JPG, PNG o WEBP · máx. 5 MB
          </span>
        </div>
      )}
    </div>
  )
}
