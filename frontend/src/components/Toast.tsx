import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (title: string, description?: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (title: string, description?: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, type }])

      setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast]
  )

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
      case 'info':
        return <Info className="w-4 h-4 text-sky-600 shrink-0" />
    }
  }

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-white border-emerald-200 text-slate-900 shadow-md ring-1 ring-emerald-500/10'
      case 'error':
        return 'bg-white border-rose-200 text-slate-900 shadow-md ring-1 ring-rose-500/10'
      case 'warning':
        return 'bg-white border-amber-200 text-slate-900 shadow-md ring-1 ring-amber-500/10'
      case 'info':
        return 'bg-white border-sky-200 text-slate-900 shadow-md ring-1 ring-sky-500/10'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border text-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${getToastStyles(
              toast.type
            )}`}
          >
            <div className="mt-0.5">{getToastIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 leading-tight">{toast.title}</p>
              {toast.description && (
                <p className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      showToast: (title: string, description?: string) => {
        console.log(`[Toast] ${title} - ${description || ''}`)
      },
    }
  }
  return context
}
