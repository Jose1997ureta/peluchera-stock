import { ImageOff } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export function ActivityProductThumbnail({
  imageUrl,
  name,
  className,
}: {
  imageUrl: string | null
  name: string
  className?: string
}) {
  if (!imageUrl) {
    return (
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-4" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={cn('size-9 shrink-0 rounded-lg object-cover', className)}
    />
  )
}
