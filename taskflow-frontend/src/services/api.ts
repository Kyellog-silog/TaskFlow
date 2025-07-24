import axios, { type AxiosResponse, type AxiosError } from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Global toast handler - will be set by App component
let globalToast: any = null

export const setGlobalToast = (toast: any) => {
  globalToast = toast
}

// Request interceptor - no longer need to add auth token as we're using cookies
api.interceptors.request.use(
  (config) => {
    // No need to add Authorization header with token
    // Cookies will be sent automatically with withCredentials: true
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as any

    // Handle different error types
    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid
        if (globalToast) {
          globalToast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          })
        }
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
        if (globalToast) {
          globalToast({
            title: "Access Denied",
            description: "You don't have permission to perform this action.",
            variant: "destructive",
          })
        }
        break

      case 404:
        // Not found
        if (globalToast) {
          globalToast({
            title: "Not Found",
            description: "The requested resource was not found.",
            variant: "destructive",
          })
        }
        break

      case 419:
        // CSRF token mismatch
        if (globalToast) {
          globalToast({
            title: "Session Error",
            description: "Your session has expired. Please refresh the page and try again.",
            variant: "destructive",
          })
        }
        break

      case 422:
        // Validation errors
        if (data?.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ")
          if (globalToast) {
            globalToast({
              title: "Validation Error",
              description: errorMessages,
              variant: "destructive",
            })
          }
        } else if (globalToast) {
          globalToast({
            title: "Validation Error",
            description: data?.message || "Please check your input and try again.",
            variant: "destructive",
          })
        }
        break

      case 429:
        // Too many requests
        if (globalToast) {
          globalToast({
            title: "Too Many Requests",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          })
        }
        break

      case 500:
        // Server error
        if (globalToast) {
          globalToast({
            title: "Server Error",
            description: "Something went wrong on our end. Please try again later.",
            variant: "destructive",
          })
        }
        break

      default:
        // Network or other errors
        if (!error.response) {
          // Network error
          if (globalToast) {
            globalToast({
              title: "Connection Error",
              description: "Unable to connect to the server. Please check your internet connection.",
              variant: "destructive",
            })
          }
        } else if (globalToast) {
          // Other HTTP errors
          globalToast({
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
    await axios.get(`${API_BASE_URL.replace('/api', '')}/sanctum/csrf-cookie`, {
      withCredentials: true,
    })
  },

  login: async (email: string, password: string) => {
    // First get the CSRF cookie
    await authAPI.getCsrfCookie()
    // Then attempt login
    const response = await api.post("/auth/login", { email, password })
    return response.data
  },

  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    // First get the CSRF cookie
    await authAPI.getCsrfCookie()
    // Then attempt registration
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      password_confirmation,
    })
    return response.data
  },

  logout: async () => {
    const response = await api.post("/auth/logout")
    return response.data
  },

  getUser: async () => {
    const response = await api.get("/user")
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email })
    return response.data
  },

  resetPassword: async (token: string, email: string, password: string, password_confirmation: string) => {
    const response = await api.post("/auth/reset-password", {
      token,
      email,
      password,
      password_confirmation,
    })
    return response.data
  },

  resendEmailVerification: async () => {
    const response = await api.post("/auth/email/verification-notification")
    return response.data
  },
}

// Tasks API
export const tasksAPI = {
  getTasks: async (boardId?: string) => {
    const url = boardId ? `/tasks?board_id=${boardId}` : "/tasks"
    const response = await api.get(url)
    return response.data
  },

  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  createTask: async (taskData: any) => {
    const response = await api.post("/tasks", taskData)
    return response.data
  },

  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData)
    return response.data
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  },

  moveTask: async (id: string, columnId: string, position: number) => {
    const response = await api.patch(`/tasks/${id}/move`, {
      column_id: columnId,
      position,
    })
    return response.data
  },

  assignTask: async (id: string, userId: string) => {
    const response = await api.post(`/tasks/${id}/assign`, { user_id: userId })
    return response.data
  },

  unassignTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}/assign`)
    return response.data
  },

  duplicateTask: async (id: string) => {
    const response = await api.post(`/tasks/${id}/duplicate`)
    return response.data
  },

  getTaskActivities: async (id: string) => {
    const response = await api.get(`/tasks/${id}/activities`)
    return response.data
  },
}

// Boards API
export const boardsAPI = {
  getBoards: async () => {
    const response = await api.get("/boards")
    return response.data
  },

  getBoard: async (id: string) => {
    const response = await api.get(`/boards/${id}`)
    return response.data
  },

  createBoard: async (boardData: any) => {
    const response = await api.post("/boards", boardData)
    return response.data
  },

  updateBoard: async (id: string, boardData: any) => {
    const response = await api.put(`/boards/${id}`, boardData)
    return response.data
  },

  deleteBoard: async (id: string) => {
    const response = await api.delete(`/boards/${id}`)
    return response.data
  },
}

// Teams API
export const teamsAPI = {
  getTeams: async () => {
    const response = await api.get("/teams")
    return response.data
  },

  getTeam: async (id: string) => {
    const response = await api.get(`/teams/${id}`)
    return response.data
  },

  createTeam: async (teamData: any) => {
    const response = await api.post("/teams", teamData)
    return response.data
  },

  updateTeam: async (id: string, teamData: any) => {
    const response = await api.put(`/teams/${id}`, teamData)
    return response.data
  },

  deleteTeam: async (id: string) => {
    const response = await api.delete(`/teams/${id}`)
    return response.data
  },

  addMember: async (teamId: string, email: string, role = "member") => {
    const response = await api.post(`/teams/${teamId}/members`, { email, role })
    return response.data
  },

  removeMember: async (teamId: string, userId: string) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`)
    return response.data
  },

  updateMemberRole: async (teamId: string, userId: string, role: string) => {
    const response = await api.patch(`/teams/${teamId}/members/${userId}`, { role })
    return response.data
  },
}

// Comments API
export const commentsAPI = {
  getComments: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/comments`)
    return response.data
  },

  createComment: async (taskId: string, content: string) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content })
    return response.data
  },

  deleteComment: async (taskId: string, commentId: string) => {
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`)
    return response.data
  },
}

export default api
