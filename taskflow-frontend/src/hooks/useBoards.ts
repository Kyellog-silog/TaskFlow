import { useQuery, useMutation, useQueryClient } from "react-query"
import { boardsAPI } from "../services/api"

export const useBoards = () => {
  const queryClient = useQueryClient()

  const boardsQuery = useQuery("boards", boardsAPI.getBoards)

  const createBoardMutation = useMutation(boardsAPI.createBoard, {
    onSuccess: () => {
      queryClient.invalidateQueries("boards")
    },
  })

  return {
    boards: boardsQuery.data,
    isLoading: boardsQuery.isLoading,
    error: boardsQuery.error,
    createBoard: createBoardMutation.mutate,
    isCreating: createBoardMutation.isLoading,
  }
}
