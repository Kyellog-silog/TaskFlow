import axios, { type AxiosResponse, type AxiosError } from "axios"
import logger from "../lib/logger"
import FrontendPerformanceMonitor from "../lib/performanceMonitor"

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
})

// Global toast handler - will be set by App component
let globalToast: any = null

export const setGlobalToast = (toast: any) => {
  globalToast = toast
}

// Safe toast function that checks if globalToast exists
const safeToast = (toastData: any) => {
  if (globalToast && typeof globalToast === "function") {
    globalToast(toastData)
  } else {
    // Fallback to console in dev only
    logger.warn("Toast not available:", toastData)
  }
}

// Request interceptor - log requests and start timing
api.interceptors.request.use(
  (config) => {
    // Start performance timer
    const startTime = performance.now()
    ;(config as any).startTime = startTime
    
    if (logger.isDev) logger.log(`Making ${config.method?.toUpperCase()} request to:`, config.url)
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling and performance logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const endTime = performance.now()
    const duration = endTime - ((response.config as any).startTime || endTime)
    
    // Log performance
    FrontendPerformanceMonitor.logApiCall(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      duration,
      response.status,
      JSON.stringify(response.data).length
    )
    
    if (logger.isDev) {
      logger.log(`Response from ${response.config.url}: ${response.status} (${Math.round(duration)}ms)`)
    }
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as any
    if (logger.isDev) {
      logger.error(`API Error ${status}:`, data)
    } else {
      logger.error(`API Error ${status || 'network'}`)
    }

    // Handle different error types
    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid
        safeToast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        // Save current path for redirect after login
        const currentPath = window.location.pathname
        if (currentPath !== "/login" && currentPath !== "/register") {
          localStorage.setItem("redirectPath", currentPath)
        }
        localStorage.removeItem("token")
        // Don't redirect here, let the auth context handle it
        break

      case 403:
        // Forbidden
        safeToast({
          title: "Access Denied",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        })
        break

      case 404:
        // Not found
        safeToast({
          title: "Not Found",
          description: "The requested resource was not found.",
          variant: "destructive",
        })
        break

      case 405:
        // Method Not Allowed
        safeToast({
          title: "Method Not Allowed",
          description: "The request method is not supported for this endpoint.",
          variant: "destructive",
        })
        break

      case 419:
        // CSRF token mismatch
        safeToast({
          title: "Session Error",
          description: "Your session has expired. Please refresh the page and try again.",
          variant: "destructive",
        })
        break

      case 422:
        // Validation errors
        if (data?.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ")
          safeToast({
            title: "Validation Error",
            description: errorMessages,
            variant: "destructive",
          })
        } else {
          // Handle authentication-specific messages for security
          let errorMessage = data?.message || "Please check your input and try again."
          
          // Security: Replace specific credential error messages with generic ones
          if (errorMessage.includes('These credentials do not match our records') || 
              errorMessage.includes('credentials do not match') ||
              errorMessage.includes('invalid credentials') ||
              errorMessage.toLowerCase().includes('credentials')) {
            errorMessage = 'Invalid email or password. Please try again.'
          }
          
          safeToast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
        break

      case 429:
        // Too many requests
        safeToast({
          title: "Too Many Requests",
          description: "Please wait a moment before trying again.",
          variant: "destructive",
        })
        break

      case 500:
        // Server error
        safeToast({
          title: "Server Error",
          description: "Something went wrong on our end. Please try again later.",
          variant: "destructive",
        })
        break

      default:
        // Network or other errors
        if (!error.response) {
          // Network error
          safeToast({
            title: "Connection Error",
            description: "Unable to connect to the server. Please check your internet connection.",
            variant: "destructive",
          })
        } else {
          // Other HTTP errors
          safeToast({
            title: "Error",
            description: data?.message || "An unexpected error occurred.",
            variant: "destructive",
          })
        }
        break
    }

    return Promise.reject(error)
  },
)

// Auth API - Using Sanctum cookie-based authentication
export const authAPI = {
  // Get CSRF cookie from Sanctum
  getCsrfCookie: async () => {
  logger.log("Getting CSRF cookie...")
    await api.get("/sanctum/csrf-cookie")
  logger.log("CSRF cookie obtained")
  },

  login: async (email: string, password: string) => {
    logger.log("Logging in user:", email)
    try {
      await authAPI.getCsrfCookie()
      const response = await api.post("/auth/login", { email, password })
      logger.log("Login successful")
      
      // Success toast
      safeToast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      // Let the interceptor handle the error, but don't show success message
      throw error
    }
  },

  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    logger.log("Registering user:", email)
    try {
      await authAPI.getCsrfCookie()
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation,
      })
      logger.log("Registration successful")
      
      // Success toast
      safeToast({
        title: "Account Created!",
        description: "Your account has been successfully created. Welcome to TaskFlow!",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      throw error
    }
  },

  logout: async () => {
    logger.log("Logging out user")
    try {
      await authAPI.getCsrfCookie()
      const response = await api.post("/auth/logout")
      logger.log("Logout successful")
      
      // Success toast
      safeToast({
        title: "Logged Out",
        description: "You have been successfully logged out. See you next time!",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      // Even if logout fails on server, we still want to clear local state
      logger.warn("Logout request failed but continuing with local logout")
      return {}
    }
  },

  getUser: async () => {
  logger.log("Fetching current user")
    const response = await api.get("/user")
  logger.log("User data retrieved")
    return response.data
  },

  forgotPassword: async (email: string) => {
    logger.log("Requesting password reset for:", email)
    try {
      await authAPI.getCsrfCookie()
      const response = await api.post("/auth/forgot-password", { email })
      logger.log("Password reset email sent")
      
      // Success toast
      safeToast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      throw error
    }
  },

  resetPassword: async (token: string, email: string, password: string, password_confirmation: string) => {
    logger.log("Resetting password for:", email)
    try {
      await authAPI.getCsrfCookie()
      const response = await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation,
      })
      logger.log("Password reset successful")
      
      // Success toast
      safeToast({
        title: "Password Reset Complete",
        description: "Your password has been successfully updated. You can now log in with your new password.",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      throw error
    }
  },

  resendEmailVerification: async () => {
    logger.log("Resending email verification")
    try {
      await authAPI.getCsrfCookie()
      const response = await api.post("/auth/email/verification-notification")
      logger.log("Verification email sent")
      
      // Success toast
      safeToast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your email address.",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      throw error
    }
  },

  updateProfile: async (profileData: any) => {
    logger.log("Updating profile with data:", profileData)
    try {
      await authAPI.getCsrfCookie()
      const response = await api.put("/user/profile", profileData)
      logger.log("Profile updated successfully")
      
      // Success toast
      safeToast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      throw error
    }
  },

  uploadAvatar: async (file: File) => {
    logger.log("Uploading avatar")
    try {
      await authAPI.getCsrfCookie()
      const form = new FormData()
      form.append('avatar', file)
      const response = await api.post(`/profile/avatar`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      logger.log("Avatar uploaded")
      
      // Success toast
      safeToast({
        title: "Avatar Updated",
        description: "Your profile picture has been successfully updated.",
        variant: "default",
      })
      
      return response.data
    } catch (error: any) {
      throw error
    }
  },
}

// Tasks API
export const tasksAPI = {
  getTasks: async (boardId?: string, opts?: { 
    page?: number; 
    limit?: number; 
    include_board?: boolean;
    include_column?: boolean;
    include_comments?: boolean;
  }) => {
    return FrontendPerformanceMonitor.measureAsync(
      'api_getTasks',
      async () => {
        const params = new URLSearchParams()
        if (boardId) params.append('board_id', String(boardId))
        if (opts?.page) params.append('page', String(opts.page))
        if (opts?.limit) params.append('limit', String(opts.limit))
        
        // Only include relationships when needed
        if (opts?.include_board) params.append('include_board', '1')
        if (opts?.include_column) params.append('include_column', '1') 
        if (opts?.include_comments) params.append('include_comments', '1')
        
        const url = `/tasks${params.toString() ? `?${params.toString()}` : ''}`
        logger.log(`Fetching tasks${boardId ? ` for board ${boardId}` : ''}`)
        const response = await api.get(url)
        logger.log("Tasks fetched successfully")
        return response.data
      },
      { 
        boardId, 
        limit: opts?.limit,
        include_relationships: !!(opts?.include_board || opts?.include_column || opts?.include_comments)
      }
    )
  },

  // Lightweight counters for dashboard widgets
  getDueTodayCount: async () => {
    const response = await api.get(`/tasks?due=today&uncompleted=1&only_count=1`)
    return response.data
  },
  getDueSoonCount: async (days = 3) => {
    const response = await api.get(`/tasks?due=soon&days=${days}&uncompleted=1&only_count=1`)
    return response.data
  },
  getOverdueCount: async () => {
    const response = await api.get(`/tasks?due=overdue&uncompleted=1&only_count=1`)
    return response.data
  },

  getTask: async (id: string) => {
  logger.log(`Fetching task ${id}`)
    const response = await api.get(`/tasks/${id}`)
  logger.log("Task fetched successfully")
    return response.data
  },

  createTask: async (taskData: any) => {
  logger.log("Creating task with data:", taskData)
    await authAPI.getCsrfCookie()

    // Ensure field names are correctly formatted
    const formattedData = {
      title: taskData.title,
      description: taskData.description || '',
      board_id: taskData.board_id || taskData.boardId,
      column_id: taskData.column_id || taskData.columnId, // Ensure column_id is set
      assignee_id: taskData.assignee_id || taskData.assigneeId || null,
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || taskData.dueDate || null,
    }

  logger.log("Formatted task data for API:", formattedData);
    
    // Verify important fields exist
    if (!formattedData.column_id) {
      logger.warn("column_id is missing in task data");
    }
    
    const response = await api.post("/tasks", formattedData);
    logger.log("Task created successfully");
    return response.data;
  },

  updateTask: async (id: string, taskData: any) => {
  logger.log(`Updating task ${id} with data:`, taskData)
    await authAPI.getCsrfCookie()

    // Format field names for consistency
    const formattedData = {
      ...(taskData.title !== undefined && { title: taskData.title }),
      ...(taskData.description !== undefined && { description: taskData.description }),
      ...(taskData.priority !== undefined && { priority: taskData.priority }),
      ...((taskData.due_date !== undefined || taskData.dueDate !== undefined) &&
          { due_date: taskData.due_date || taskData.dueDate }),
      ...((taskData.assignee_id !== undefined || taskData.assigneeId !== undefined) &&
          { assignee_id: taskData.assignee_id || taskData.assigneeId }),
    }

    const response = await api.put(`/tasks/${id}`, formattedData)
  logger.log("Task updated successfully")
    return response.data
  },

  deleteTask: async (id: string) => {
  logger.log(`Deleting task ${id}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/tasks/${id}`)
  logger.log("Task deleted successfully")
    return response.data
  },


  moveTask: async (id: string, columnId: string, position: number, metadata?: { operation_id?: string; client_timestamp?: number }) => {
    return FrontendPerformanceMonitor.measureAsync(
      'api_moveTask',
      async () => {
        logger.log(`Moving task ${id} to column ${columnId} at position ${position}`)
        await authAPI.getCsrfCookie()

        const response = await api.post(`/tasks/${id}/move`, {
          column_id: columnId,
          position,
          ...(metadata && {
            operation_id: metadata.operation_id,
            client_timestamp: metadata.client_timestamp
          })
        })
        logger.log("Task moved successfully")
        return response.data
      },
      { taskId: id, columnId, position, ...metadata }
    )
  },

  assignTask: async (id: string, userId: string) => {
  logger.log(`Assigning task ${id} to user ${userId}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/tasks/${id}/assign`, { user_id: userId })
  logger.log("Task assigned successfully")
    return response.data
  },

  unassignTask: async (id: string) => {
  logger.log(`Unassigning task ${id}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/tasks/${id}/assign`)
  logger.log("Task unassigned successfully")
    return response.data
  },

  duplicateTask: async (id: string) => {
  logger.log(`Duplicating task ${id}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/tasks/${id}/duplicate`)
  logger.log("Task duplicated successfully")
    return response.data
  },

  getTaskActivities: async (id: string) => {
  logger.log(`Fetching activities for task ${id}`)
    const response = await api.get(`/tasks/${id}/activities`)
  logger.log("Task activities fetched successfully")
    return response.data
  },
}

// Boards API
export const boardsAPI = {
  getBoards: async (type: 'active' | 'archived' | 'deleted' | 'recent' = 'active', limit?: number) => {
  logger.log(`Fetching ${type} boards...`)
    const params = new URLSearchParams({ type })
    if (limit) {
      params.append('limit', limit.toString())
    }
    const response = await api.get(`/boards?${params.toString()}`)
  logger.log("Boards fetched successfully")
    return response.data
  },

  getBoard: async (id: string) => {
  logger.log(`Fetching board ${id}...`)
    const response = await api.get(`/boards/${id}`)
  logger.log("Board fetched successfully")
    return response.data
  },

  createBoard: async (boardData: any) => {
  logger.log("Creating board with data:", boardData)
    await authAPI.getCsrfCookie()
    const response = await api.post("/boards", boardData)
  logger.log("Board created successfully")
    return response.data
  },

  updateBoard: async (id: string, boardData: any) => {
  logger.log(`Updating board ${id} with data:`, boardData)
    await authAPI.getCsrfCookie()
    const response = await api.put(`/boards/${id}`, boardData)
  logger.log("Board updated successfully")
    return response.data
  },

  deleteBoard: async (id: string) => {
  logger.log(`Deleting board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/boards/${id}`)
  logger.log("Board deleted successfully")
    return response.data
  },

  archiveBoard: async (id: string) => {
  logger.log(`Archiving board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${id}/archive`)
  logger.log("Board archived successfully")
    return response.data
  },

  unarchiveBoard: async (id: string) => {
  logger.log(`Unarchiving board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${id}/unarchive`)
  logger.log("Board unarchived successfully")
    return response.data
  },

  restoreBoard: async (id: string) => {
  logger.log(`Restoring board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${id}/restore`)
  logger.log("Board restored successfully")
    return response.data
  },

  // Add team to board
  addTeamToBoard: async (boardId: string, teamId: string) => {
  logger.log(`Adding team ${teamId} to board ${boardId}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${boardId}/teams/${teamId}`)
  logger.log("Team added to board successfully")
    return response.data
  },

  // Remove team from board
  removeTeamFromBoard: async (boardId: string, teamId: string) => {
  logger.log(`Removing team ${teamId} from board ${boardId}...`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/boards/${boardId}/teams/${teamId}`)
  logger.log("Team removed from board successfully")
    return response.data
  },

  // Get board teams
  getBoardTeams: async (boardId: string) => {
  logger.log(`Getting teams for board ${boardId}...`)
    const response = await api.get(`/boards/${boardId}/teams`)
  logger.log("Board teams fetched successfully")
    return response.data
  },
}

// Teams API
export const teamsAPI = {
  getTeams: async () => {
  logger.log("Fetching teams...")
    const response = await api.get("/teams")
  logger.log("Teams fetched successfully")
    return response.data
  },

  getTeam: async (id: string) => {
  logger.log(`Fetching team ${id}...`)
    const response = await api.get(`/teams/${id}`)
  logger.log("Team fetched successfully")
    return response.data
  },

  createTeam: async (teamData: any) => {
  logger.log("Creating team with data:", teamData)
    await authAPI.getCsrfCookie()
    const response = await api.post("/teams", teamData)
  logger.log("Team created successfully")
    return response.data
  },

  updateTeam: async (id: string, teamData: any) => {
  logger.log(`Updating team ${id} with data:`, teamData)
    await authAPI.getCsrfCookie()
    const response = await api.put(`/teams/${id}`, teamData)
  logger.log("Team updated successfully")
    return response.data
  },

  deleteTeam: async (id: string) => {
  logger.log(`Deleting team ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/teams/${id}`)
  logger.log("Team deleted successfully")
    return response.data
  },

  addMember: async (teamId: string, email: string, role = "member") => {
  logger.log(`Adding member ${email} to team ${teamId} with role ${role}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/teams/${teamId}/members`, { email, role })
  logger.log("Team member added successfully")
    return response.data
  },

  removeMember: async (teamId: string, userId: string) => {
  logger.log(`Removing member ${userId} from team ${teamId}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/teams/${teamId}/members/${userId}`)
  logger.log("Team member removed successfully")
    return response.data
  },

  updateMemberRole: async (teamId: string, userId: string, role: string) => {
  logger.log(`Updating role for member ${userId} in team ${teamId} to ${role}`)
    await authAPI.getCsrfCookie()
    const response = await api.put(`/teams/${teamId}/members/${userId}/role`, { role })
  logger.log("Member role updated successfully")
    return response.data
  },

  // Get team boards
  getTeamBoards: async (teamId: string) => {
  logger.log(`Fetching boards for team ${teamId}`)
    const response = await api.get(`/teams/${teamId}/boards`)
  logger.log("Team boards fetched successfully")
    return response.data
  },

  // Invite member by email (uses invitation system)
  inviteMember: async (teamId: string, email: string, role = "member") => {
  logger.log(`Inviting ${email} to team ${teamId} with role ${role}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/teams/${teamId}/invite`, { email, role })
  logger.log("Team invitation sent successfully")
    return response.data
  },
}

// Comments API
export const commentsAPI = {
  getComments: async (taskId: string) => {
  logger.log(`Fetching comments for task ${taskId}`)
    const response = await api.get(`/tasks/${taskId}/comments`)
  logger.log("Comments fetched successfully")
    return response.data
  },

  createComment: async (taskId: string, content: string, parentId?: string) => {
  logger.log(`Creating comment for task ${taskId}${parentId ? ` (reply to ${parentId})` : ''}`)
    await authAPI.getCsrfCookie()
    const payload: any = { content }
    if (parentId) payload.parent_id = parentId
    const response = await api.post(`/tasks/${taskId}/comments`, payload)
  logger.log("Comment created successfully")
    return response.data
  },

  deleteComment: async (taskId: string, commentId: string) => {
  logger.log(`Deleting comment ${commentId} from task ${taskId}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`)
  logger.log("Comment deleted successfully")
    return response.data
  },
}

// Notifications API
export const notificationsAPI = {
  list: async (limit = 10) => {
    const response = await api.get(`/notifications?limit=${limit}`)
    return response.data
  },
  getUnreadCount: async () => {
    const response = await api.get(`/notifications/unread-count`)
    return response.data
  },
  markRead: async (notificationId: string) => {
    await authAPI.getCsrfCookie()
    const response = await api.post(`/notifications/${notificationId}/read`)
    return response.data
  },
  markAllRead: async () => {
    await authAPI.getCsrfCookie()
    const response = await api.post(`/notifications/read-all`)
    return response.data
  },
}

export default api

// Profile API
export const profileAPI = {
  getActivity: async (limit = 10) => {
    const response = await api.get(`/profile/activity?limit=${limit}`)
    return response.data
  },
}
