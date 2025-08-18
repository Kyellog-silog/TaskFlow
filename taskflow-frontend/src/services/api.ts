import axios, { type AxiosResponse, type AxiosError } from "axios"

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
    // Fallback to console.log if toast is not available
    console.warn("Toast not available:", toastData)
  }
}

// Request interceptor - log requests
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`Response from ${response.config.url}:`, response.data)
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as any
    console.error(`API Error ${status}:`, data)

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
          safeToast({
            title: "Validation Error",
            description: data?.message || "Please check your input and try again.",
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
    console.log("Getting CSRF cookie...")
    await api.get("/sanctum/csrf-cookie")
    console.log("CSRF cookie obtained")
  },

  login: async (email: string, password: string) => {
    console.log("Logging in user:", email)
    await authAPI.getCsrfCookie()
    const response = await api.post("/auth/login", { email, password })
    console.log("Login successful")
    return response.data
  },

  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    console.log("Registering user:", email)
    await authAPI.getCsrfCookie()
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      password_confirmation,
    })
    console.log("Registration successful")
    return response.data
  },

  logout: async () => {
    console.log("Logging out user")
    await authAPI.getCsrfCookie()
    const response = await api.post("/auth/logout")
    console.log("Logout successful")
    return response.data
  },

  getUser: async () => {
    console.log("Fetching current user")
    const response = await api.get("/user")
    console.log("User data retrieved")
    return response.data
  },

  forgotPassword: async (email: string) => {
    console.log("Requesting password reset for:", email)
    await authAPI.getCsrfCookie()
    const response = await api.post("/auth/forgot-password", { email })
    console.log("Password reset email sent")
    return response.data
  },

  resetPassword: async (token: string, email: string, password: string, password_confirmation: string) => {
    console.log("Resetting password for:", email)
    await authAPI.getCsrfCookie()
    const response = await api.post("/auth/reset-password", {
      token,
      email,
      password,
      password_confirmation,
    })
    console.log("Password reset successful")
    return response.data
  },

  resendEmailVerification: async () => {
    console.log("Resending email verification")
    await authAPI.getCsrfCookie()
    const response = await api.post("/auth/email/verification-notification")
    console.log("Verification email sent")
    return response.data
  },

  updateProfile: async (profileData: any) => {
    console.log("Updating profile with data:", profileData)
    await authAPI.getCsrfCookie()
    const response = await api.put("/user/profile", profileData)
    console.log("Profile updated successfully")
    return response.data
  },
  uploadAvatar: async (file: File) => {
    console.log("Uploading avatar")
    await authAPI.getCsrfCookie()
    const form = new FormData()
    form.append('avatar', file)
    const response = await api.post(`/profile/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    console.log("Avatar uploaded")
    return response.data
  },
}

// Tasks API
export const tasksAPI = {
  getTasks: async (boardId?: string) => {
    const url = boardId ? `/tasks?board_id=${boardId}` : "/tasks"
    console.log(`Fetching tasks${boardId ? ` for board ${boardId}` : ''}`)
    const response = await api.get(url)
    console.log("Tasks fetched successfully")
    return response.data
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
    console.log(`Fetching task ${id}`)
    const response = await api.get(`/tasks/${id}`)
    console.log("Task fetched successfully")
    return response.data
  },

  createTask: async (taskData: any) => {
    console.log("Creating task with data:", taskData)
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

    console.log("Formatted task data for API:", formattedData);
    
    // Verify important fields exist
    if (!formattedData.column_id) {
      console.error("Warning: column_id is missing in task data");
    }
    
    const response = await api.post("/tasks", formattedData);
    console.log("Task created successfully:", response.data);
    return response.data;
  },

  updateTask: async (id: string, taskData: any) => {
    console.log(`Updating task ${id} with data:`, taskData)
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
    console.log("Task updated successfully")
    return response.data
  },

  deleteTask: async (id: string) => {
    console.log(`Deleting task ${id}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/tasks/${id}`)
    console.log("Task deleted successfully")
    return response.data
  },


  moveTask: async (id: string, columnId: string, position: number, metadata?: { operation_id?: string; client_timestamp?: number }) => {
    console.log(`Moving task ${id} to column ${columnId} at position ${position}`)
    await authAPI.getCsrfCookie()

    const response = await api.post(`/tasks/${id}/move`, {
      column_id: columnId,
      position,
      ...(metadata && {
        operation_id: metadata.operation_id,
        client_timestamp: metadata.client_timestamp
      })
    })
    console.log("Task moved successfully")
    return response.data
  },

  assignTask: async (id: string, userId: string) => {
    console.log(`Assigning task ${id} to user ${userId}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/tasks/${id}/assign`, { user_id: userId })
    console.log("Task assigned successfully")
    return response.data
  },

  unassignTask: async (id: string) => {
    console.log(`Unassigning task ${id}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/tasks/${id}/assign`)
    console.log("Task unassigned successfully")
    return response.data
  },

  duplicateTask: async (id: string) => {
    console.log(`Duplicating task ${id}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/tasks/${id}/duplicate`)
    console.log("Task duplicated successfully")
    return response.data
  },

  getTaskActivities: async (id: string) => {
    console.log(`Fetching activities for task ${id}`)
    const response = await api.get(`/tasks/${id}/activities`)
    console.log("Task activities fetched successfully")
    return response.data
  },
}

// Boards API
export const boardsAPI = {
  getBoards: async (type: 'active' | 'archived' | 'deleted' | 'recent' = 'active', limit?: number) => {
    console.log(`Fetching ${type} boards...`)
    const params = new URLSearchParams({ type })
    if (limit) {
      params.append('limit', limit.toString())
    }
    const response = await api.get(`/boards?${params.toString()}`)
    console.log("Boards fetched successfully:", response.data)
    return response.data
  },

  getBoard: async (id: string) => {
    console.log(`Fetching board ${id}...`)
    const response = await api.get(`/boards/${id}`)
    console.log("Board fetched successfully:", response.data)
    return response.data
  },

  createBoard: async (boardData: any) => {
    console.log("Creating board with data:", boardData)
    await authAPI.getCsrfCookie()
    const response = await api.post("/boards", boardData)
    console.log("Board created successfully:", response.data)
    return response.data
  },

  updateBoard: async (id: string, boardData: any) => {
    console.log(`Updating board ${id} with data:`, boardData)
    await authAPI.getCsrfCookie()
    const response = await api.put(`/boards/${id}`, boardData)
    console.log("Board updated successfully:", response.data)
    return response.data
  },

  deleteBoard: async (id: string) => {
    console.log(`Deleting board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/boards/${id}`)
    console.log("Board deleted successfully:", response.data)
    return response.data
  },

  archiveBoard: async (id: string) => {
    console.log(`Archiving board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${id}/archive`)
    console.log("Board archived successfully:", response.data)
    return response.data
  },

  unarchiveBoard: async (id: string) => {
    console.log(`Unarchiving board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${id}/unarchive`)
    console.log("Board unarchived successfully:", response.data)
    return response.data
  },

  restoreBoard: async (id: string) => {
    console.log(`Restoring board ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${id}/restore`)
    console.log("Board restored successfully:", response.data)
    return response.data
  },

  // Add team to board
  addTeamToBoard: async (boardId: string, teamId: string) => {
    console.log(`Adding team ${teamId} to board ${boardId}...`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/boards/${boardId}/teams/${teamId}`)
    console.log("Team added to board successfully:", response.data)
    return response.data
  },

  // Remove team from board
  removeTeamFromBoard: async (boardId: string, teamId: string) => {
    console.log(`Removing team ${teamId} from board ${boardId}...`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/boards/${boardId}/teams/${teamId}`)
    console.log("Team removed from board successfully:", response.data)
    return response.data
  },

  // Get board teams
  getBoardTeams: async (boardId: string) => {
    console.log(`Getting teams for board ${boardId}...`)
    const response = await api.get(`/boards/${boardId}/teams`)
    console.log("Board teams fetched successfully:", response.data)
    return response.data
  },
}

// Teams API
export const teamsAPI = {
  getTeams: async () => {
    console.log("Fetching teams...")
    const response = await api.get("/teams")
    console.log("Teams fetched successfully")
    return response.data
  },

  getTeam: async (id: string) => {
    console.log(`Fetching team ${id}...`)
    const response = await api.get(`/teams/${id}`)
    console.log("Team fetched successfully")
    return response.data
  },

  createTeam: async (teamData: any) => {
    console.log("Creating team with data:", teamData)
    await authAPI.getCsrfCookie()
    const response = await api.post("/teams", teamData)
    console.log("Team created successfully", response.data)
    return response.data
  },

  updateTeam: async (id: string, teamData: any) => {
    console.log(`Updating team ${id} with data:`, teamData)
    await authAPI.getCsrfCookie()
    const response = await api.put(`/teams/${id}`, teamData)
    console.log("Team updated successfully")
    return response.data
  },

  deleteTeam: async (id: string) => {
    console.log(`Deleting team ${id}...`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/teams/${id}`)
    console.log("Team deleted successfully")
    return response.data
  },

  addMember: async (teamId: string, email: string, role = "member") => {
    console.log(`Adding member ${email} to team ${teamId} with role ${role}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/teams/${teamId}/members`, { email, role })
    console.log("Team member added successfully")
    return response.data
  },

  removeMember: async (teamId: string, userId: string) => {
    console.log(`Removing member ${userId} from team ${teamId}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/teams/${teamId}/members/${userId}`)
    console.log("Team member removed successfully")
    return response.data
  },

  updateMemberRole: async (teamId: string, userId: string, role: string) => {
    console.log(`Updating role for member ${userId} in team ${teamId} to ${role}`)
    await authAPI.getCsrfCookie()
    const response = await api.put(`/teams/${teamId}/members/${userId}/role`, { role })
    console.log("Member role updated successfully")
    return response.data
  },

  // Get team boards
  getTeamBoards: async (teamId: string) => {
    console.log(`Fetching boards for team ${teamId}`)
    const response = await api.get(`/teams/${teamId}/boards`)
    console.log("Team boards fetched successfully")
    return response.data
  },

  // Invite member by email (uses invitation system)
  inviteMember: async (teamId: string, email: string, role = "member") => {
    console.log(`Inviting ${email} to team ${teamId} with role ${role}`)
    await authAPI.getCsrfCookie()
    const response = await api.post(`/teams/${teamId}/invite`, { email, role })
    console.log("Team invitation sent successfully")
    return response.data
  },
}

// Comments API
export const commentsAPI = {
  getComments: async (taskId: string) => {
    console.log(`Fetching comments for task ${taskId}`)
    const response = await api.get(`/tasks/${taskId}/comments`)
    console.log("Comments fetched successfully")
    return response.data
  },

  createComment: async (taskId: string, content: string, parentId?: string) => {
    console.log(`Creating comment for task ${taskId}${parentId ? ` (reply to ${parentId})` : ''}`)
    await authAPI.getCsrfCookie()
    const payload: any = { content }
    if (parentId) payload.parent_id = parentId
    const response = await api.post(`/tasks/${taskId}/comments`, payload)
    console.log("Comment created successfully")
    return response.data
  },

  deleteComment: async (taskId: string, commentId: string) => {
    console.log(`Deleting comment ${commentId} from task ${taskId}`)
    await authAPI.getCsrfCookie()
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`)
    console.log("Comment deleted successfully")
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
