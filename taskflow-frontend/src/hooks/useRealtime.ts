"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "react-query"

interface UseRealtimeOptions {
  boardId?: string
  onTaskUpdate?: (task: any) => void
  onTaskMove?: (data: any) => void
}

export const useRealtime = ({ boardId, onTaskUpdate, onTaskMove }: UseRealtimeOptions = {}) => {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!boardId) return

    // Initialize WebSocket connection
    const ws = new WebSocket(`ws://localhost:8000/ws/board/${boardId}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "task_updated":
          onTaskUpdate?.(data.task)
          queryClient.invalidateQueries(["tasks", boardId])
          break
        case "task_moved":
          onTaskMove?.(data)
          queryClient.invalidateQueries(["tasks", boardId])
          break
        default:
          console.log("Unknown message type:", data.type)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return () => {
      ws.close()
    }
  }, [boardId, onTaskUpdate, onTaskMove, queryClient])

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { sendMessage }
}
