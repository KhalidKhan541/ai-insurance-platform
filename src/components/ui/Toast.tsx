import { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

let listeners: ((toast: ToastItem) => void)[] = []

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2)
  listeners.forEach((fn) => fn({ id, message, type }))
}

interface ToastContainerProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-left': 'bottom-4 left-4',
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-900',
  warning: 'bg-amber-500',
}

export function ToastContainer({ position = 'top-right' }: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 4000)
    }
    listeners = [...listeners, handler]
    return () => {
      listeners = listeners.filter((fn) => fn !== handler)
    }
  }, [])

  return (
    <div className={`fixed z-[100] flex flex-col gap-2 ${positionClasses[position]}`}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-in slide-in-from-right-5 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${typeStyles[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
