"use client"

import { useState } from "react"

interface Toast {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastInput {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (newToast: ToastInput) => {
    const toastWithId = {
      ...newToast,
      id: Math.random().toString(36).substring(2, 9),
    }
    
    setToasts((prev) => [...prev, toastWithId])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== toastWithId.id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }

  return { toast, toasts, removeToast }
}
