"use client"

import { useState } from "react"

interface Toast {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const [toasts, setToast] = useState<Toast[]>([])

  const toast = (newToast: Toast) => {
    setToast((prev) => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToast((prev) => prev.slice(1))
    }, 5000)
  }

  return { toast, toasts }
}
