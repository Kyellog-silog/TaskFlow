import { useQuery, useMutation, useQueryClient } from "react-query"
import { tasksAPI } from "../services/api"

export const useTasks = (boardId?: string) => {
  const queryClient = useQueryClient()

  const tasksQuery = useQuery(["tasks", boardId], () => tasksAPI.getTasks(boardId ? { board_id: boardId } : {}), {
    enabled: !!boardId,
  })

  const createTaskMutation = useMutation(tasksAPI.createTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", boardId])
    },
  })

  const updateTaskMutation = useMutation(({ id, data }: { id: string; data: any }) => tasksAPI.updateTask(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", boardId])
    },
  })

  const deleteTaskMutation = useMutation(tasksAPI.deleteTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", boardId])
    },
  })

  return {
    tasks: tasksQuery.data,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isLoading,
    isUpdating: updateTaskMutation.isLoading,
    isDeleting: deleteTaskMutation.isLoading,
  }
}
