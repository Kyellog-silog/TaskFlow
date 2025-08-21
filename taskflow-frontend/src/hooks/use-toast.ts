"use client"

import { toast as sonnerToast } from "sonner"

interface ToastInput {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const toast = (data: ToastInput) => {
    if (data.variant === "destructive") {
      sonnerToast.error(data.title, {
        description: data.description,
      })
    } else {
      sonnerToast.success(data.title, {
        description: data.description,
      })
    }
  }

  // Return empty arrays for backward compatibility
  const toasts: any[] = []
  const removeToast = (id: string) => {}

  return { toast, toasts, removeToast }
}
