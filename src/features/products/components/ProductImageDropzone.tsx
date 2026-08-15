import { Upload, X } from 'lucide-react'
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
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file && PRODUCT_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      onFileSelect(file)
    }
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

      {previewUrl ? (
        <div className="relative h-40 w-full">
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Quitar imagen"
            onClick={(event) => {
              event.stopPropagation()
              onClear()
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-1.5 text-center text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            Cambiar imagen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-16 w-full items-center justify-center gap-2 px-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
            <Upload className="size-4" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-medium text-foreground">
              Arrastrá o hacé click para subir
            </span>
            <span className="block text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 5 MB</span>
          </span>
        </button>
      )}
    </div>
  )
}
