"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Header } from "../components/Header"
import { KanbanBoard } from "../components/KanbanBoard"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { boardsAPI, tasksAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: "low" | "medium" | "high"
  assignee?: {
    id: string
    name: string
    avatar: string
  }
  dueDate?: string
  comments: any[]
  createdAt: string
  isLocked?: boolean
  canMoveTo?: string[]
}

interface Column {
  id: string
  title: string
  tasks: Task[]
  maxTasks?: number
  acceptsFrom?: string[]
  isLocked?: boolean
  color?: string
}

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [columns, setColumns] = useState<Column[]>([])

  // Fetch board data
  const { data: board, isLoading: boardLoading } = useQuery(
    ["board", boardId],
    async () => {
      const response = await boardsAPI.getBoard(boardId!)
      return response
    },
    {
      enabled: !!boardId,
      onError: (error: any) => {
        toast({
          title: "Error",
          description: "Failed to load board data",
          variant: "destructive",
        })
      },
    },
  )

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery(
    ["tasks", boardId],
    async () => {
      const response = await tasksAPI.getTasks(boardId)
      return response
    },
    {
      enabled: !!boardId,
      onError: (error: any) => {
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        })
      },
    },
  )

  // Move task mutation
  const moveTaskMutation = useMutation(
    async ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) => {
      return await tasksAPI.moveTask(taskId, columnId, position)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks", boardId])
        toast({
          title: "Success",
          description: "Task moved successfully",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to move task",
          variant: "destructive",
        })
        // Revert optimistic update
        queryClient.invalidateQueries(["tasks", boardId])
      },
    },
  )

  // Update task mutation
  const updateTaskMutation = useMutation(
    async ({ taskId, taskData }: { taskId: string; taskData: any }) => {
      return await tasksAPI.updateTask(taskId, taskData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks", boardId])
        toast({
          title: "Success",
          description: "Task updated successfully",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update task",
          variant: "destructive",
        })
      },
    },
  )

  // Create task mutation
  const createTaskMutation = useMutation(
    async (taskData: any) => {
      return await tasksAPI.createTask({
        ...taskData,
        board_id: boardId,
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks", boardId])
        toast({
          title: "Success",
          description: "Task created successfully",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create task",
          variant: "destructive",
        })
      },
    },
  )

  // Transform tasks data into columns with constraints
  useEffect(() => {
    if (tasksData?.data) {
      const defaultColumns: Column[] = [
        {
          id: "todo",
          title: "To Do",
          tasks: [],
          maxTasks: 10,
          color: "blue-500",
        },
        {
          id: "in-progress",
          title: "In Progress",
          tasks: [],
          maxTasks: 5,
          acceptsFrom: ["todo"],
          color: "yellow-500",
        },
        {
          id: "review",
          title: "Review",
          tasks: [],
          maxTasks: 3,
          acceptsFrom: ["in-progress"],
          isLocked: user?.role !== "admin", // Only admins can add directly to review
          color: "purple-500",
        },
        {
          id: "done",
          title: "Done",
          tasks: [],
          acceptsFrom: ["review"],
          color: "green-500",
        },
      ]

      // Add sample constraints to tasks
      const tasksWithConstraints = (Array.isArray(tasksData.data) ? tasksData.data : []).map((task: any) => ({
        id: task.id?.toString() || "",
        title: task.title || "Untitled Task",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assignee: task.assignee
          ? {
              id: task.assignee.id?.toString() || "",
              name: task.assignee.name || "Unknown",
              avatar: task.assignee.avatar || "/placeholder.svg?height=32&width=32",
            }
          : undefined,
        dueDate: task.due_date || task.dueDate,
        comments: task.comments || [],
        createdAt: task.created_at || task.createdAt || new Date().toISOString(),
        isLocked: task.priority === "high" && user?.role !== "admin",
        canMoveTo: task.priority === "high" ? ["todo", "in-progress", "review"] : undefined,
      }))

      const columnsWithTasks = defaultColumns.map((column) => ({
        ...column,
        tasks: tasksWithConstraints.filter((task: Task) => task.status === column.id),
      }))

      setColumns(columnsWithTasks)
    }
  }, [tasksData, user?.role])

  const handleTaskMove = (taskId: string, sourceColumn: string, destColumn: string, position: number) => {
    // Optimistic update
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]
      const sourceCol = newColumns.find((col) => col.id === sourceColumn)
      const destCol = newColumns.find((col) => col.id === destColumn)

      if (!sourceCol || !destCol) return prevColumns

      const taskIndex = sourceCol.tasks.findIndex((task) => task.id === taskId)
      if (taskIndex === -1) return prevColumns

      const [task] = sourceCol.tasks.splice(taskIndex, 1)
      task.status = destColumn
      destCol.tasks.splice(position, 0, task)

      return newColumns
    })

    // API call
    moveTaskMutation.mutate({
      taskId,
      columnId: destColumn,
      position,
    })
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    updateTaskMutation.mutate({
      taskId: updatedTask.id,
      taskData: {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate,
        assignee_id: updatedTask.assignee?.id,
      },
    })
  }

  const handleTaskCreate = (taskData: any) => {
    createTaskMutation.mutate({
      title: taskData.title,
      description: taskData.description || "",
      priority: taskData.priority || "medium",
      column_id: taskData.columnId,
      due_date: taskData.dueDate,
      assignee_id: taskData.assigneeId,
    })
  }

  if (boardLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!board?.data && !boardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Board Not Found</h2>
            <p className="text-gray-600">The board you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{board?.data?.name || board?.name || "Board"}</h1>
          <p className="text-gray-600">
            {board?.data?.description || board?.description || "Manage your team's tasks with drag-and-drop simplicity"}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{user?.role}</span>
            {columns.length > 0 && (
              <span className="ml-4">
                Total Tasks:{" "}
                <span className="font-medium">{columns.reduce((acc, col) => acc + col.tasks.length, 0)}</span>
              </span>
            )}
          </div>
        </div>

        {columns.length > 0 ? (
          <KanbanBoard
            columns={columns}
            onTaskMove={handleTaskMove}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            userRole={user?.role}
          />
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first task.</p>
              <button
                onClick={() =>
                  handleTaskCreate({
                    title: "Sample Task",
                    description: "This is a sample task to get you started",
                    columnId: "todo",
                    priority: "medium",
                  })
                }
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Sample Task
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default BoardPage
