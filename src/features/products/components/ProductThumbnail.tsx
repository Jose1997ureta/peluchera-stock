import { ImageOff } from 'lucide-react'
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
  return (
    <div
      className={cn(
        'h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted',
        className,
      )}
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
  )
}
