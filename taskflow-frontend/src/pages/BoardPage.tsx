"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Header } from "../components/Header"
import { KanbanBoard } from "../components/KanbanBoard"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { boardsAPI, tasksAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"
import { Sparkles, Users, Target, Clock } from 'lucide-react'
import { getColumnIdFromStatus, getStatusFromColumnId } from "../utils/columnMapping"

export interface Task {
  id: string
  title: string
  description: string
  status: string
  columnId: string
  priority: "low" | "medium" | "high"
  assignee?: {
    id: string
    name: string
    avatar: string
  }
  dueDate?: string
  comments: any[]
  createdAt: string
  canMoveTo?: string[]
}

interface Column {
  id: string
  title: string
  tasks: Task[]
  maxTasks?: number
  acceptsFrom?: string[]
  color?: string
}

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [columns, setColumns] = useState<Column[]>([])

  // Simplified default columns without locking
  const defaultColumns: Column[] = [
    { 
      id: "todo", 
      title: "To Do", 
      tasks: [], 
      maxTasks: 15, 
      color: "blue-500" 
    },
    { 
      id: "in-progress", 
      title: "In Progress", 
      tasks: [], 
      maxTasks: 8, 
      acceptsFrom: ["todo"], 
      color: "yellow-500" 
    },
    { 
      id: "review", 
      title: "Review", 
      tasks: [], 
      maxTasks: 5, 
      acceptsFrom: ["in-progress"], 
      color: "purple-500" 
    },
    { 
      id: "done", 
      title: "Done", 
      tasks: [], 
      acceptsFrom: ["review"], 
      color: "green-500" 
    },
  ]

  // Fetch board data
  const { data: board, isLoading: boardLoading } = useQuery(
    ["board", boardId],
    async () => {
      const response = await boardsAPI.getBoard(boardId!)
      return response
    },
    {
      enabled: !!boardId,
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load board data",
          variant: "destructive",
        })
      },
    },
  )

  const getColumnByTitle = (title: string) => {
  // First try exact match
  let column = columns.find(col => col.title === title);
  
  // If not found, try case-insensitive match
  if (!column) {
    column = columns.find(col => 
      col.title.toLowerCase() === title.toLowerCase()
    );
  }
  
  // If still not found, try with partial match
  if (!column) {
    column = columns.find(col => 
      col.title.toLowerCase().includes(title.toLowerCase())
    );
  }
  
  return column;
};

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
          description: error.response?.data?.message || "Failed to load tasks",
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
          description: "Task moved successfully! ✨",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to move task",
          variant: "destructive",
        })
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
          description: "Task updated successfully! 🎉",
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
          description: "Task created successfully! 🚀",
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

  // Delete task mutation - MOVED TO TOP LEVEL
  const deleteTaskMutation = useMutation(
    async (id: string) => {
      return await tasksAPI.deleteTask(id)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["tasks", boardId])
        toast({
          title: "Success",
          description: "Task deleted successfully! 🗑️",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete task",
          variant: "destructive",
        })
      },
    }
  )
    
  // Simplified handler that uses the mutation defined above
  const handleTaskDelete = (taskId: string) => {
    deleteTaskMutation.mutate(taskId)
  }

  const handleTaskMoveFromModal = (taskId: string, newStatus: string) => {
    console.log(`Moving task ${taskId} to status ${newStatus} from modal`)
    
    // Map frontend status to column title, then find the actual column
    const statusToTitleMap: Record<string, string> = {
      'todo': 'To Do',
      'in-progress': 'In Progress', 
      'review': 'Review',
      'done': 'Done'
    }
    
    const targetColumnTitle = statusToTitleMap[newStatus]
    if (!targetColumnTitle) {
      console.error('Unknown status:', newStatus)
      return
    }
    
    console.log(`Looking for column with title: ${targetColumnTitle}`)
    
    // Find the task and its current column
    const currentTask = columns.flatMap(col => col.tasks).find(task => task.id === taskId)
    const currentColumn = columns.find(col => col.tasks.some(task => task.id === taskId))
    const targetColumn = columns.find(col => col.title === targetColumnTitle)
    
    if (!currentTask || !currentColumn || !targetColumn) {
      console.error('Task, current column, or target column not found', {
        currentTask: !!currentTask,
        currentColumn: !!currentColumn,
        targetColumn: !!targetColumn,
        targetColumnTitle,
        availableColumns: columns.map(c => ({ id: c.id, title: c.title }))
      })
      return
    }
    
    // Don't move if it's already in the correct column
    if (currentColumn.id === targetColumn.id) {
      console.log('Task is already in the correct column')
      return
    }
    
    // Check if the move is allowed based on column constraints
    if (targetColumn.acceptsFrom && !targetColumn.acceptsFrom.includes(currentColumn.id)) {
      toast({
        title: "Move Restricted",
        description: `Tasks can only be moved to ${targetColumn.title} from: ${targetColumn.acceptsFrom.map(id => columns.find(c => c.id === id)?.title).join(', ')}`,
        variant: "destructive",
      })
      return
    }
    
    // Check capacity
    if (targetColumn.maxTasks && targetColumn.tasks.length >= targetColumn.maxTasks) {
      toast({
        title: "Column Full",
        description: `${targetColumn.title} is at maximum capacity (${targetColumn.maxTasks} tasks)`,
        variant: "destructive",
      })
      return
    }
    
    // Perform the move - add to end of target column
    const newPosition = targetColumn.tasks.length
    handleTaskMove(taskId, currentColumn.id, targetColumn.id, newPosition)
  }

  // Transform tasks data into columns (simplified without locking logic)
  useEffect(() => {
    if (tasksData?.data) {
      let columnsToUse: Column[] = []

      // Use DB columns if available
      if (board?.data?.columns && board.data.columns.length > 0) {
        columnsToUse = board.data.columns.map((column: any) => ({
          id: column.id.toString(),
          title: column.name,
          tasks: [],
          maxTasks: column.max_tasks || undefined,
          color: column.color || undefined,
          acceptsFrom: column.accepts_from || undefined,
        }))
      } else {
        // Fallback to predefined defaults
        columnsToUse = defaultColumns
      }

      const tasksWithoutLocking = (Array.isArray(tasksData.data) ? tasksData.data : []).map((task: any) => {
        // Create dynamic status mapping based on column title
        const getStatusFromTitle = (columnId: string) => {
          const column = columnsToUse.find(col => col.id === columnId.toString())
          if (!column) return 'todo'
          
          const titleToStatusMap: Record<string, string> = {
            'To Do': 'todo',
            'In Progress': 'in-progress',
            'Review': 'review', 
            'Done': 'done'
          }
          
          return titleToStatusMap[column.title] || 'todo'
        }

        return {
          id: task.id?.toString() || "",
          title: task.title || "Untitled Task",
          description: task.description || "",
          status: getStatusFromTitle(task.column_id), // Use dynamic mapping
          columnId: task.column_id?.toString() || "", // Make sure to include columnId
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
        }
      })

      const columnsWithTasks = columnsToUse.map((column) => ({
        ...column,
        tasks: tasksWithoutLocking.filter((task: Task) => 
          // Use both status and columnId to match tasks to columns
          task.status === column.id || task.columnId === column.id
        ),
      }))

      setColumns(columnsWithTasks)
    }
  }, [board, tasksData])

  const handleTaskMove = (taskId: string, sourceColumn: string, destColumn: string, position: number) => {
    console.log(`Moving task ${taskId} from ${sourceColumn} to ${destColumn} at position ${position}`)
    
    // Optimistic update
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]
      const sourceCol = newColumns.find((col) => col.id === sourceColumn)
      const destCol = newColumns.find((col) => col.id === destColumn)

      if (!sourceCol || !destCol) {
        console.error("Source or destination column not found")
        return prevColumns
      }

      const taskIndex = sourceCol.tasks.findIndex((task) => task.id === taskId)
      if (taskIndex === -1) {
        console.error("Task not found in source column")
        return prevColumns
      }

      const [task] = sourceCol.tasks.splice(taskIndex, 1)
      
      // Update task's status to match the destination column
      task.status = destColumn
      task.columnId = destColumn
      
      // Insert at specified position
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
      column_id: taskData.column_id || taskData.columnId,
      due_date: taskData.due_date || taskData.dueDate,
      assignee_id: taskData.assignee_id || taskData.assigneeId,
    })
  }

  const handleCreateSampleTask = () => {
    const firstColumnId = columns.length > 0 ? columns[0].id : defaultColumns[0].id

    if (firstColumnId) {
      handleTaskCreate({
        title: "Welcome to TaskFlow! 🎉",
        description: "This is your first task. Drag it around to see the magic happen!",
        column_id: firstColumnId,
        priority: "medium",
      })
    } else {
      toast({
        title: "Error",
        description: "No columns available to create a task",
        variant: "destructive",
      })
    }
  }

  if (boardLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600 animate-pulse">Loading your awesome board...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!board?.data && !boardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Board Not Found</h2>
            <p className="text-gray-600">The board you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    )
  }

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0)
  const completedTasks = getColumnByTitle('Done')?.tasks.length || 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const inProgressTasks = getColumnByTitle('In Progress')?.tasks.length || 0;
  const reviewTasks = getColumnByTitle('Review')?.tasks.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {board?.data?.name || board?.name || "Board"}
              </h1>
              <p className="text-gray-600 text-lg">
                {board?.data?.description || board?.description || "Manage your team's tasks with drag-and-drop simplicity"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-2xl font-bold text-green-600">{progressPercentage}%</div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-green-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${progressPercentage}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">In Review</p>
                  <p className="text-2xl font-bold">{reviewTasks}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completed</p>
                  <p className="text-2xl font-bold">{completedTasks}</p>
                </div>
                <Sparkles className="h-8 w-8 text-green-200" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <span>Role: <span className="font-semibold capitalize text-blue-600">{user?.role}</span></span>
              <span>•</span>
              <span>Board ID: <span className="font-mono text-gray-800">#{boardId?.slice(-6)}</span></span>
            </div>
            <div className="text-right">
              <span>Last updated: <span className="font-medium">Just now</span></span>
            </div>
          </div>
        </div>

        {columns.length > 0 ? (
          <KanbanBoard
            columns={columns}
            onTaskMove={handleTaskMove}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskDelete={handleTaskDelete}
            onTaskMoveFromModal={handleTaskMoveFromModal} // Added this line
            userRole={user?.role}
          />
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started?</h3>
              <p className="text-gray-600 mb-6">Create your first task and watch the magic happen with our beautiful drag-and-drop interface!</p>
              <button
                onClick={handleCreateSampleTask}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Create Your First Task
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default BoardPage