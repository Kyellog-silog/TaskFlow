// Enhanced task movement hook with operation tracking and conflict resolution
import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useToast } from './use-toast'
import { tasksAPI } from '../services/api'
import logger from '../lib/logger'

interface PendingOperation {
  id: string
  taskId: string
  timestamp: number
  type: 'move' | 'update'
  data: any
}

interface UseTaskOperationsProps {
  boardId: string | undefined
}

export const useTaskOperations = ({ boardId }: UseTaskOperationsProps) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(new Map())
  const operationCounter = useRef(0)
  const lastMoveTime = useRef<Record<string, number>>({})

  // Generate unique operation ID
  const generateOperationId = () => {
    operationCounter.current += 1
    return `op-${Date.now()}-${operationCounter.current}`
  }

  // Track pending operation
  const addPendingOperation = (taskId: string, type: 'move' | 'update', data: any) => {
    const operationId = generateOperationId()
    const operation: PendingOperation = {
      id: operationId,
      taskId,
      timestamp: Date.now(),
      type,
      data
    }
    
    setPendingOperations(prev => new Map(prev).set(operationId, operation))
    return operationId
  }

  // Remove pending operation
  const removePendingOperation = (operationId: string) => {
    setPendingOperations(prev => {
      const newMap = new Map(prev)
      newMap.delete(operationId)
      return newMap
    })
  }

  // Check if task has pending operations
  const hasPendingOperations = (taskId: string) => {
    return Array.from(pendingOperations.values()).some(op => op.taskId === taskId)
  }

  // Enhanced move task mutation with conflict resolution
  const moveTaskMutation = useMutation(
    async ({ 
      taskId, 
      columnId, 
      position, 
      operationId, 
      clientTimestamp 
    }: { 
      taskId: string
      columnId: string
      position: number
      operationId: string
      clientTimestamp: number
    }) => {
      return await tasksAPI.moveTask(taskId, columnId, position, {
        operation_id: operationId,
        client_timestamp: clientTimestamp
      })
    },
    {
      onSuccess: (data, variables) => {
        removePendingOperation(variables.operationId)
        
        // Only update cache if no newer operations are pending for this task
        if (!hasPendingOperations(variables.taskId)) {
          queryClient.setQueryData(["tasks", boardId], (oldData: any) => {
            if (!oldData?.data) return oldData
            
            return {
              ...oldData,
              data: oldData.data.map((task: any) => 
                task.id === variables.taskId ? { ...task, ...data.data } : task
              )
            }
          })
        }

        toast({
          title: "Success",
          description: "Task moved successfully! ✨",
        })
      },
      onError: (error: any, variables) => {
        removePendingOperation(variables.operationId)
        
        // Handle conflicts gracefully
        if (error.response?.status === 409 && error.response?.data?.conflict) {
          const conflictData = error.response.data
          logger.log('Conflict detected:', conflictData)
          
          // If time difference is small (< 2 seconds), it's likely our own rapid moves
          if (conflictData.time_difference && conflictData.time_difference < 2000) {
            // Don't show error for rapid moves, just refresh silently
            logger.log('Rapid move conflict, refreshing state silently')
            queryClient.invalidateQueries(["tasks", boardId])
            return
          }
          
          // Real conflict from another user
          toast({
            title: "Task Updated by Another User",
            description: "The task was moved by someone else. Refreshing...",
            variant: "default"
          })
          queryClient.invalidateQueries(["tasks", boardId])
          return
        }

        // Handle network or other errors
        if (!hasPendingOperations(variables.taskId)) {
          queryClient.invalidateQueries(["tasks", boardId])
        }

        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to move task",
          variant: "destructive",
        })
      },
    }
  )

  // Enhanced move handler with optimistic updates and operation tracking
  const handleTaskMove = useCallback((
    taskId: string, 
    sourceColumn: string, 
    destColumn: string, 
    position: number,
    optimisticUpdateFn: (taskId: string, sourceColumn: string, destColumn: string, position: number) => void
  ) => {
    const now = Date.now()
    const lastMove = lastMoveTime.current[taskId] || 0
    
    // Rate limiting: prevent moves faster than 100ms for the same task
    if (now - lastMove < 100) {
      logger.log('Rate limiting: move too fast, skipping API call')
      // Still do optimistic update for immediate UI feedback
      optimisticUpdateFn(taskId, sourceColumn, destColumn, position)
      return
    }
    
    lastMoveTime.current[taskId] = now
    
    // Track this operation
    const operationId = addPendingOperation(taskId, 'move', {
      sourceColumn,
      destColumn,
      position
    })

    // Immediate optimistic update
    optimisticUpdateFn(taskId, sourceColumn, destColumn, position)

    // Execute API call with operation tracking
    moveTaskMutation.mutate({
      taskId,
      columnId: destColumn,
      position,
      operationId,
      clientTimestamp: now
    })
  }, [moveTaskMutation])

  return {
    handleTaskMove,
    pendingOperations,
    hasPendingOperations,
    isLoading: moveTaskMutation.isLoading
  }
}
