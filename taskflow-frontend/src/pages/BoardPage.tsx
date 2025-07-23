"use client"

import * as React from "react"
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
  assignee: {
    id: string
    name: string
    avatar: string
  }
  dueDate: string
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
  const { data: board, isLoading: boardLoading } = useQuery(["board", boardId], () => boardsAPI.getBoard(boardId!), {
    enabled: !!boardId,
  })

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery(
    ["tasks", boardId],
    () => tasksAPI.getTasks({ board_id: boardId }),
    {
      enabled: !!boardId,
    },
  )

  // Move task mutation
  const moveTaskMutation = useMutation(
    ({ taskId, moveData }: { taskId: string; moveData: any }) => tasksAPI.moveTask(taskId, moveData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks", boardId])
        toast({
          title: "Success",
          description: "Task moved successfully",
        })
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to move task",
          variant: "destructive",
        })
      },
    },
  )

  // Update task mutation
  const updateTaskMutation = useMutation(
    ({ taskId, taskData }: { taskId: string; taskData: any }) => tasksAPI.updateTask(taskId, taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks", boardId])
        toast({
          title: "Success",
          description: "Task updated successfully",
        })
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        })
      },
    },
  )

  // Create task mutation
  const createTaskMutation = useMutation((taskData: any) => tasksAPI.createTask(taskData), {
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", boardId])
      toast({
        title: "Success",
        description: "Task created successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    },
  })

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
      const tasksWithConstraints = tasksData.data.map((task: Task) => ({
        ...task,
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
      moveData: {
        column_id: destColumn,
        position,
      },
    })
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    updateTaskMutation.mutate({
      taskId: updatedTask.id,
      taskData: updatedTask,
    })
  }

  const handleTaskCreate = (taskData: any) => {
    createTaskMutation.mutate({
      ...taskData,
      board_id: boardId,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{board?.data?.name || "Board"}</h1>
          <p className="text-gray-600">
            {board?.data?.description || "Manage your team's tasks with drag-and-drop simplicity"}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{user?.role}</span>
          </div>
        </div>

        <KanbanBoard
          columns={columns}
          onTaskMove={handleTaskMove}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          userRole={user?.role}
        />
      </main>
    </div>
  )
}

export default BoardPage
