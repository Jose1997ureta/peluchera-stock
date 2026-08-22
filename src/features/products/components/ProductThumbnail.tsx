import { ImageOff, X } from 'lucide-react'
import { useState } from 'react'
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from '@/shared/components/motion/center-morph-modal'
import { cn } from '@/shared/utils/cn'

export function ProductThumbnail({
  imageUrl,
  name,
  className,
}: {
  imageUrl: string | null
  name: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className={cn(
          'h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted',
          imageUrl && 'cursor-zoom-in',
          className,
        )}
        onClick={imageUrl ? () => setOpen(true) : undefined}
        role={imageUrl ? 'button' : undefined}
        tabIndex={imageUrl ? 0 : undefined}
        aria-label={imageUrl ? `Ver imagen de ${name}` : undefined}
        onKeyDown={
          imageUrl
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setOpen(true)
                }
              }
            : undefined
        }
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {imageUrl ? (
        <CenterMorphModal open={open} onOpenChange={setOpen}>
          <CenterMorphModalContent
            ariaLabel={name}
            className="w-auto max-w-[90vw] border-none bg-transparent"
            showCloseButton={false}
          >
            <img
              src={imageUrl}
              alt={name}
              className="block max-h-[80vh] max-w-[90vw] rounded-[30px] object-contain"
            />
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </CenterMorphModalContent>
        </CenterMorphModal>
      ) : null}
    </>
  )
}
