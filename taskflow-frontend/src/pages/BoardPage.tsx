"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Header } from "../components/Header"
import { KanbanBoard } from "../components/KanbanBoard"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { TeamSidebar } from "../components/TeamSidebar"
import { boardsAPI, tasksAPI, teamsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"
import { useTaskOperations } from "../hooks/useTaskOperations"
import { useMultiTeamPermissions, useTeamPermissions } from "../hooks/useTeamPermissions"
import webSocketService from "../services/websocket"
import { Sparkles, Users, Target, Clock, ChevronLeft } from "lucide-react"
import { Button } from "../components/ui/button"

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Use our enhanced task operations hook
  const {
    handleTaskMove: enhancedHandleTaskMove,
    hasPendingOperations,
    isLoading: isMoveLoading,
  } = useTaskOperations({ boardId })

  // WebSocket real-time sync - with graceful degradation
  useEffect(() => {
    if (!boardId || !user) return

    // Only try to connect WebSocket if we have a WebSocket server
    // For now, we'll disable WebSocket to avoid connection errors
    // You can enable this later when you set up a WebSocket server
    const enableWebSocket = process.env.REACT_APP_ENABLE_WEBSOCKET === "true"

    if (enableWebSocket) {
      // Connect WebSocket if not already connected
      if (!webSocketService.isConnected()) {
        // Enable WebSocket functionality
        webSocketService.enable()

        // You can replace this with your actual WebSocket server URL
        const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:8080"
        webSocketService.connect(wsUrl)
      }

      // Set up WebSocket event handlers
      webSocketService.setEventHandlers({
        onTaskMove: (data: any) => {
          // Only update if this move wasn't initiated by the current user
          if (data.userId !== user.id && !hasPendingOperations(data.taskId)) {
            console.log("Received remote task move:", data)
            // Update local state to reflect remote changes
            setColumns((prevColumns) => {
              const newColumns = [...prevColumns]
              const sourceCol = newColumns.find((col) => col.id === data.fromColumn)
              const destCol = newColumns.find((col) => col.id === data.toColumn)

              if (sourceCol && destCol) {
                const taskIndex = sourceCol.tasks.findIndex((task) => task.id === data.taskId)
                if (taskIndex !== -1) {
                  const [task] = sourceCol.tasks.splice(taskIndex, 1)
                  task.status = data.toColumn
                  task.columnId = data.toColumn
                  destCol.tasks.splice(data.position, 0, task)
                }
              }
              return newColumns
            })

            toast({
              title: "Task Updated",
              description: "Another user moved a task",
              variant: "default",
            })
          }
        },
      })

      // Subscribe to board updates
      webSocketService.subscribeToBoard(boardId)

      return () => {
        webSocketService.unsubscribeFromBoard(boardId)
      }
    } else {
      console.log("WebSocket is disabled - running in offline mode")
      // Disable WebSocket to prevent connection attempts
      webSocketService.disable()
    }

  // SSE moved to a global App-level bridge
  }, [boardId, user, hasPendingOperations, toast])

  // Simplified default columns without locking
  const defaultColumns: Column[] = [
    {
      id: "todo",
      title: "To Do",
      tasks: [],
      maxTasks: 15,
      color: "blue-500",
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [],
      maxTasks: 8,
      acceptsFrom: ["todo"],
      color: "yellow-500",
    },
    {
      id: "review",
      title: "Review",
      tasks: [],
      maxTasks: 5,
      acceptsFrom: ["in-progress"],
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

  // Fetch board data (includes server-calculated permissions)
  const { data: board, isLoading: boardLoading } = useQuery(
    ["board", boardId],
    async () => {
      const response = await boardsAPI.getBoard(boardId!)
      return response
    },
    {
      enabled: !!boardId,
      staleTime: 60 * 1000,
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load board data",
          variant: "destructive",
        })
      },
    },
  )

  // Fetch user's teams for team management
  const { data: userTeams, isLoading: teamsLoading } = useQuery(
    ["user-teams", user?.id],
    async () => {
      const response = await teamsAPI.getTeams()
      return response
    },
    {
      enabled: !!user?.id,
      staleTime: 60 * 1000,
      refetchInterval: 30000, // Refetch every 30 seconds to catch role changes
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load teams",
          variant: "destructive",
        })
      },
    },
  )

  // Fetch board teams (teams already added to this board)
  const { data: boardTeams, isLoading: boardTeamsLoading } = useQuery(
    ["board-teams", boardId],
    async () => {
      const response = await boardsAPI.getBoardTeams(boardId!)
      return response
    },
    {
      enabled: !!boardId,
      staleTime: 60 * 1000,
      refetchInterval: 30000, // Refetch every 30 seconds to catch role changes
      onError: (error: any) => {
        console.log("No teams found for this board or error loading board teams")
      },
    },
  )

  const getColumnByTitle = (title: string) => {
    // First try exact match
    let column = columns.find((col) => col.title === title)

    // If not found, try case-insensitive match
    if (!column) {
      column = columns.find((col) => col.title.toLowerCase() === title.toLowerCase())
    }

    // If still not found, try with partial match
    if (!column) {
      column = columns.find((col) => col.title.toLowerCase().includes(title.toLowerCase()))
    }

    return column
  }

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

  // Calculate permissions: prefer server-calculated from board.show
  const currentBoardTeams = boardTeams?.data || []
  const boardTeam = currentBoardTeams[0] || null
  const clientTeamPerms = useTeamPermissions(boardTeam, user?.id)
  const serverPerms = board?.data?.permissions
  const permissions = serverPerms
    ? {
        canViewBoard: !!serverPerms.can_view_board,
        canEditTasks: !!serverPerms.can_edit_tasks,
        canCreateTasks: !!serverPerms.can_create_tasks,
        canDeleteTasks: !!serverPerms.can_delete_tasks,
        canManageBoard: !!serverPerms.can_manage_board,
        canManageTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        userRole: serverPerms.effective_role || serverPerms.user_role || null,
        isOwner: (serverPerms.effective_role || serverPerms.user_role) === 'owner',
        isAdmin: (serverPerms.effective_role || serverPerms.user_role) === 'admin',
        isMember: (serverPerms.effective_role || serverPerms.user_role) === 'member',
        isViewer: !!serverPerms.is_viewer,
      }
    : clientTeamPerms

  // Show permission status in console for debugging
  console.log("User permissions for board:", {
    userRole: permissions.userRole,
    canEditTasks: permissions.canEditTasks,
    canCreateTasks: permissions.canCreateTasks,
    canManageBoard: permissions.canManageBoard,
    isViewer: permissions.isViewer,
  })

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
    },
  )

  // Simplified handler that uses the mutation defined above
  const handleTaskDelete = (taskId: string) => {
    deleteTaskMutation.mutate(taskId)
  }

  const handleTaskMoveFromModal = (taskId: string, newStatus: string) => {
    console.log(`Moving task ${taskId} to status ${newStatus} from modal`)

    // Map frontend status to column title, then find the actual column
    const statusToTitleMap: Record<string, string> = {
      todo: "To Do",
      "in-progress": "In Progress",
      review: "Review",
      done: "Done",
    }

    const targetColumnTitle = statusToTitleMap[newStatus]
    if (!targetColumnTitle) {
      console.error("Unknown status:", newStatus)
      return
    }

    console.log(`Looking for column with title: ${targetColumnTitle}`)

    // Find the task and its current column
    const currentTask = columns.flatMap((col) => col.tasks).find((task) => task.id === taskId)
    const currentColumn = columns.find((col) => col.tasks.some((task) => task.id === taskId))
    const targetColumn = columns.find((col) => col.title === targetColumnTitle)

    if (!currentTask || !currentColumn || !targetColumn) {
      console.error("Task, current column, or target column not found", {
        currentTask: !!currentTask,
        currentColumn: !!currentColumn,
        targetColumn: !!targetColumn,
        targetColumnTitle,
        availableColumns: columns.map((c) => ({ id: c.id, title: c.title })),
      })
      return
    }

    // Don't move if it's already in the correct column
    if (currentColumn.id === targetColumn.id) {
      console.log("Task is already in the correct column")
      return
    }

    // Check if the move is allowed based on column constraints
    if (targetColumn.acceptsFrom && !targetColumn.acceptsFrom.includes(currentColumn.id)) {
      toast({
        title: "Move Restricted",
        description: `Tasks can only be moved to ${targetColumn.title} from: ${targetColumn.acceptsFrom.map((id) => columns.find((c) => c.id === id)?.title).join(", ")}`,
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
          const column = columnsToUse.find((col) => col.id === columnId.toString())
          if (!column) return "todo"

          const titleToStatusMap: Record<string, string> = {
            "To Do": "todo",
            "In Progress": "in-progress",
            Review: "review",
            Done: "done",
          }

          return titleToStatusMap[column.title] || "todo"
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
        tasks: tasksWithoutLocking.filter(
          (task: Task) =>
            // Use both status and columnId to match tasks to columns
            task.status === column.id || task.columnId === column.id,
        ),
      }))

      setColumns(columnsWithTasks)
    }
  }, [board, tasksData])

  const handleTaskMove = (taskId: string, sourceColumn: string, destColumn: string, position: number) => {
    console.log(`Moving task ${taskId} from ${sourceColumn} to ${destColumn} at position ${position}`)

    // Optimistic update function
    const performOptimisticUpdate = (taskId: string, sourceColumn: string, destColumn: string, position: number) => {
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
    }

    // Use enhanced task move with conflict resolution
    enhancedHandleTaskMove(taskId, sourceColumn, destColumn, position, performOptimisticUpdate)

    // Broadcast real-time update to other users (only if WebSocket is enabled)
    if (webSocketService.isConnected()) {
      const now = Date.now()
      const lastBroadcastTime = (window as any).lastBroadcastTime || 0
      if (now - lastBroadcastTime > 100) {
        webSocketService.broadcastTaskMove(taskId, boardId!, sourceColumn, destColumn, position)
        ;(window as any).lastBroadcastTime = now
      }
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 animate-spin"
            style={{ animationDuration: "20s" }}
          ></div>
        </div>

        <div className="relative z-10">
          <Header />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600 animate-pulse">Loading your awesome board...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!board?.data && !boardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 animate-spin"
            style={{ animationDuration: "20s" }}
          ></div>
        </div>

        <div className="relative z-10">
          <Header />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Board Not Found</h2>
              <p className="text-gray-600">
                The board you're looking for doesn't exist or you don't have access to it.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0)
  const completedTasks = getColumnByTitle("Done")?.tasks.length || 0
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const inProgressTasks = getColumnByTitle("In Progress")?.tasks.length || 0
  const reviewTasks = getColumnByTitle("Review")?.tasks.length || 0

  // Filter teams where user has admin privileges or is owner
  const availableTeams = (userTeams?.data || []).filter((team: any) => {
    const userMember = team.members?.find((member: any) => member.id === user?.id)
    return team.owner?.id === user?.id || userMember?.role === "admin"
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      <div className="relative z-10 flex">
        {/* Team Sidebar */}
        <TeamSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          boardId={boardId!}
          availableTeams={availableTeams}
          currentBoardTeams={currentBoardTeams}
          user={user}
          onTeamUpdate={() => {
            console.log("Invalidating team queries after update...")

            // Invalidate all team-related queries
            queryClient.invalidateQueries(["board-teams", boardId])
            queryClient.invalidateQueries(["user-teams", user?.id])
            queryClient.invalidateQueries("teams")

            // Force immediate refetch
            queryClient.refetchQueries(["board-teams", boardId])
            queryClient.refetchQueries(["user-teams", user?.id])

            // Additional delay refetch to ensure consistency
            setTimeout(() => {
              queryClient.invalidateQueries(["board-teams", boardId])
              queryClient.refetchQueries(["board-teams", boardId])
            }, 1000)
          }}
        />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
          <Header />

          <main className="container mx-auto px-4 py-8">
            {/* Enhanced Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {/* Team Sidebar Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                  >
                    {isSidebarOpen ? (
                      <>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Hide Teams
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Show Teams ({currentBoardTeams.length})
                      </>
                    )}
                  </Button>

                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {board?.data?.name || board?.name || "Board"}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {board?.data?.description ||
                        board?.description ||
                        "Manage your team's tasks with drag-and-drop simplicity"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Permission Indicator */}
                  {permissions.userRole && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Your Access</div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold text-blue-600">
                          {permissions.userRole === "owner" && "👑 Owner"}
                          {permissions.userRole === "admin" && "⚡ Admin"}
                          {permissions.userRole === "member" && "👤 Member"}
                          {permissions.userRole === "viewer" && "👁️ Viewer"}
                        </span>
                        {permissions.isViewer && <span className="text-xs text-gray-500">(Read-only)</span>}
                      </div>
                    </div>
                  )}

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
                  <span>
                    Role: <span className="font-semibold capitalize text-blue-600">{user?.role}</span>
                  </span>
                  <span>•</span>
                  <span>
                    Board ID: <span className="font-mono text-gray-800">#{boardId?.slice(-6)}</span>
                  </span>
                  <span>•</span>
                  <span>
                    Teams: <span className="font-medium text-purple-600">{currentBoardTeams.length}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span>
                    Last updated: <span className="font-medium">Just now</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Kanban Board */}
      {columns.length > 0 ? (
              <KanbanBoard
                columns={columns}
                onTaskMove={handleTaskMove}
                onTaskUpdate={handleTaskUpdate}
                onTaskCreate={handleTaskCreate}
                onTaskDelete={handleTaskDelete}
                onTaskMoveFromModal={handleTaskMoveFromModal}
                userRole={permissions.isAdmin || permissions.isOwner ? 'admin' : 'member'}
                // Pass permissions for UI gating
                // @ts-ignore
                teamPermissions={permissions}
              />
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                  <div className="text-6xl mb-4">🚀</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started?</h3>
                  <p className="text-gray-600 mb-6">
                    {permissions.canCreateTasks
                      ? "Create your first task and watch the magic happen with our beautiful drag-and-drop interface!"
                      : permissions.isViewer
                        ? "You have viewer access to this board. Ask an admin or owner to create tasks."
                        : "You need team access to create tasks on this board."}
                  </p>
                  {permissions.canCreateTasks ? (
                    <button
                      onClick={handleCreateSampleTask}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create Your First Task
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                      {permissions.isViewer ? "👁️ View-only access" : "🔒 No permission to create tasks"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default BoardPage
