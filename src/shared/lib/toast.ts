import type {
  AnimatedToast,
  ToastInput,
  ToastStatus,
} from '@/shared/components/motion/animated-toast-stack'

const DEFAULT_DURATION = 4200

let toasts: AnimatedToast[] = []
const listeners = new Set<() => void>()
const timers = new Map<string, number>()
let idSeed = 0

function emit() {
  listeners.forEach((listener) => listener())
}

function scheduleDismiss(toastEntry: AnimatedToast) {
  const existing = timers.get(toastEntry.id)
  if (existing !== undefined) window.clearTimeout(existing)

  const duration = toastEntry.duration ?? DEFAULT_DURATION
  if (duration <= 0) return

  const timer = window.setTimeout(() => {
    timers.delete(toastEntry.id)
    dismissToast(toastEntry.id)
  }, duration)
  timers.set(toastEntry.id, timer)
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts() {
  return toasts
}

export function showToast(input: ToastInput): string {
  const toastEntry: AnimatedToast = {
    duration: DEFAULT_DURATION,
    dismissible: true,
    ...input,
    id: input.id ?? `toast-${idSeed++}`,
    createdAt: Date.now(),
  }
  toasts = [...toasts, toastEntry]
  emit()
  scheduleDismiss(toastEntry)
  return toastEntry.id
}

export function updateToast(id: string, patch: Partial<ToastInput>) {
  let updated: AnimatedToast | undefined
  toasts = toasts.map((toastEntry) => {
    if (toastEntry.id !== id) return toastEntry
    updated = { ...toastEntry, ...patch, id, createdAt: Date.now() }
    return updated
  })
  emit()
  if (updated) scheduleDismiss(updated)
}

export function dismissToast(id: string) {
  const timer = timers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
  toasts = toasts.filter((toastEntry) => toastEntry.id !== id)
  emit()
}

type ToastOptions = Omit<ToastInput, 'title' | 'status'>

function buildToast(status: ToastStatus, title: ToastInput['title'], opts?: ToastOptions) {
  return showToast({ status, title, ...opts })
}

export const toast = {
  message: (title: ToastInput['title'], opts?: ToastOptions) => buildToast('neutral', title, opts),
  success: (title: ToastInput['title'], opts?: ToastOptions) => buildToast('success', title, opts),
  error: (title: ToastInput['title'], opts?: ToastOptions) => buildToast('error', title, opts),
  info: (title: ToastInput['title'], opts?: ToastOptions) => buildToast('info', title, opts),
  loading: (title: ToastInput['title'], opts?: ToastOptions) => buildToast('loading', title, opts),
  dismiss: dismissToast,
  update: updateToast,
}
