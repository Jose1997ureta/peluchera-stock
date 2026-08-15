import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils/cn'

export function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-8', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
