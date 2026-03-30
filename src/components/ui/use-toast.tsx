"use client"

import * as React from "react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toastWithId = { ...newToast, id }
    
    setToasts((prev) => [...prev, toastWithId])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 m-6 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[300px] rounded-lg border p-4 shadow-lg bg-white ${
              toast.variant === "destructive"
                ? "border-red-200 bg-red-50"
                : "border-gray-200"
            }`}
          >
            {toast.title && (
              <div className={`font-semibold ${
                toast.variant === "destructive" ? "text-red-900" : "text-gray-900"
              }`}>
                {toast.title}
              </div>
            )}
            {toast.description && (
              <div className={`text-sm mt-1 ${
                toast.variant === "destructive" ? "text-red-700" : "text-gray-600"
              }`}>
                {toast.description}
              </div>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}