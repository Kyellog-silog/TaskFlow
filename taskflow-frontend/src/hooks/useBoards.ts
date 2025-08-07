import { useQuery, useMutation, useQueryClient } from "react-query"
import { boardsAPI } from "../services/api"

export const useBoards = (type: 'active' | 'archived' | 'deleted' | 'recent' = 'active', limit?: number) => {
  const queryClient = useQueryClient()

  const boardsQuery = useQuery(
    ["boards", type, limit], 
    () => boardsAPI.getBoards(type, limit),
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    }
  )

  const createBoardMutation = useMutation(boardsAPI.createBoard, {
    onSuccess: () => {
      queryClient.invalidateQueries("boards")
    },
  })

  const deleteBoardMutation = useMutation(boardsAPI.deleteBoard, {
    onSuccess: () => {
      queryClient.invalidateQueries("boards")
    },
  })

  const archiveBoardMutation = useMutation(boardsAPI.archiveBoard, {
    onSuccess: () => {
      queryClient.invalidateQueries("boards")
    },
  })

  const unarchiveBoardMutation = useMutation(boardsAPI.unarchiveBoard, {
    onSuccess: () => {
      queryClient.invalidateQueries("boards")
    },
  })

  const restoreBoardMutation = useMutation(boardsAPI.restoreBoard, {
    onSuccess: () => {
      queryClient.invalidateQueries("boards")
    },
  })

  return {
    boards: boardsQuery.data,
    isLoading: boardsQuery.isLoading,
    error: boardsQuery.error,
    refetch: boardsQuery.refetch,
    createBoard: createBoardMutation.mutate,
    deleteBoard: deleteBoardMutation.mutate,
    archiveBoard: archiveBoardMutation.mutate,
    unarchiveBoard: unarchiveBoardMutation.mutate,
    restoreBoard: restoreBoardMutation.mutate,
    isCreating: createBoardMutation.isLoading,
    isDeleting: deleteBoardMutation.isLoading,
    isArchiving: archiveBoardMutation.isLoading,
    isUnarchiving: unarchiveBoardMutation.isLoading,
    isRestoring: restoreBoardMutation.isLoading,
  }
}

// Convenience hooks for specific board types
export const useActiveBoards = (limit?: number) => useBoards('active', limit)
export const useArchivedBoards = (limit?: number) => useBoards('archived', limit)
export const useDeletedBoards = (limit?: number) => useBoards('deleted', limit)
export const useRecentBoards = (limit?: number) => useBoards('recent', limit)
