"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "react-query"
  import logger from "../lib/logger"

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
      logger.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "task_updated":
          onTaskUpdate?.(data.task)
          // Update specific task instead of invalidating entire query
          queryClient.setQueryData(["tasks", boardId], (oldData: any) => {
            if (!oldData?.data) return oldData
            const updatedTasks = oldData.data.map((task: any) => 
              task.id === data.task.id ? { ...task, ...data.task } : task
            )
            return { ...oldData, data: updatedTasks }
          })
          break
        case "task_moved":
          onTaskMove?.(data)
          // Similar specific update for task moves
          queryClient.setQueryData(["tasks", boardId], (oldData: any) => {
            if (!oldData?.data) return oldData
            const updatedTasks = oldData.data.map((task: any) => 
              task.id === data.taskId 
                ? { ...task, column_id: data.toColumn, position: data.position }
                : task
            )
            return { ...oldData, data: updatedTasks }
          })
          break
        default:
          logger.log("Unknown message type:", data.type)
      }
    }

    ws.onclose = () => {
      logger.log("WebSocket disconnected")
    }

    ws.onerror = (error) => {
      logger.error("WebSocket error:", error)
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
