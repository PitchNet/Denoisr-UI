import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import '../../styles/toast.css'

export type ToastType = 'info' | 'success' | 'error'

type Toast = {
  id: string
  message: string
  type: ToastType
  exiting: boolean
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const EYEBROW: Record<ToastType, string> = {
  error:   'Error',
  success: 'Done',
  info:    'Note',
}

const EXIT_DURATION = 180

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-item${toast.exiting ? ' toast-item--exiting' : ''}`}
    >
      <div className="toast-item__body">
        <span className="toast-item__eyebrow">{EYEBROW[toast.type]}</span>
        <p className="toast-item__msg">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast-item__close"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_DURATION)
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev, { id, message, type, exiting: false }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 ? (
        <div className="toast-stack" aria-label="Notifications">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
