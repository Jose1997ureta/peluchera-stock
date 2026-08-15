import { useSyncExternalStore } from 'react'
import { AnimatedToastStack } from '@/shared/components/motion/animated-toast-stack'
import { dismissToast, getToasts, subscribe } from '@/shared/lib/toast'

export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getToasts, getToasts)

  return (
    <AnimatedToastStack
      toasts={toasts}
      onDismiss={dismissToast}
      position="top-right"
      placement="fixed"
    />
  )
}
