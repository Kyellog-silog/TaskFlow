
import axios from "axios"

let toastHandler = {
  toast: (props: any) => {
    console.error("Toast not initialized", props)
  },
}

export const setToastHandler = (handler: any) => {
  toastHandler = handler
}


const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const SANCTUM_BASE_URL = process.env.REACT_APP_SANCTUM_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(async (config) => {
  if (config.url?.includes("sanctum/csrf-cookie")) return config;
  
  // Ensure CSRF token exists
  if (!document.cookie.includes("XSRF-TOKEN")) {
    await axios.get(`${SANCTUM_BASE_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  }
  
  // Add auth token if exists
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Create a default error message
    let errorTitle = "Error"
    let errorMessage = "An unexpected error occurred"

    // Handle specific error status codes
    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401: // Unauthorized
          errorTitle = "Session Expired"
          errorMessage = "Your session has expired. Please log in again."
          // Store the current path to redirect back after login
          localStorage.setItem("redirectAfterLogin", window.location.pathname)
          // Remove token but don't reload
          localStorage.removeItem("token")
          // We'll handle the redirect in the auth context
          break

        case 403: // Forbidden
          errorTitle = "Access Denied"
          errorMessage = "You don't have permission to perform this action"
          break

        case 404: // Not Found
          errorTitle = "Not Found"
          errorMessage = "The requested resource was not found"
          break

        case 419: // CSRF token mismatch
          errorTitle = "Session Expired"
          errorMessage = "Your session has expired. Please refresh the page."
          // Don't reload, just show the message
          break

        case 422: // Validation error
          errorTitle = "Validation Error"
          errorMessage = "Please check your input and try again"
          // If we have validation errors, show them
          if (error.response.data && error.response.data.errors) {
            const validationErrors = Object.values(error.response.data.errors).flat()
            if (validationErrors.length > 0) {
              errorMessage = validationErrors.join("\n")
            }
          }
          break

        case 429: // Too Many Requests
          errorTitle = "Too Many Requests"
          errorMessage = "Please slow down and try again later"
          break

        case 500: // Server Error
          errorTitle = "Server Error"
          errorMessage = "Something went wrong on our end. Please try again later."
          break

        default:
          errorTitle = `Error ${status}`
          errorMessage = error.response.data?.message || "An error occurred"
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorTitle = "Network Error"
      errorMessage = "Unable to connect to the server. Please check your internet connection."
    }

    // Show toast notification with the error
    toastHandler.toast({
      title: errorTitle,
      description: errorMessage,
      variant: "destructive",
    })

    // Return the rejected promise
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/login", { email, password })
    return response.data
  },

  register: async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const response = await api.post("/register", { 
      name, 
      email, 
      password,
      password_confirmation: passwordConfirmation
    });
    return response.data;
  },

  logout: async () => {
    await api.post("/logout")
  },

  getUser: async () => {
    const response = await api.get("/user")
    return response.data
  },
}

// Tasks API
export const tasksAPI = {
  getTasks: async (params?: any) => {
    const response = await api.get("/tasks", { params })
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

  moveTask: async (id: string, moveData: any) => {
    const response = await api.post(`/tasks/${id}/move`, moveData)
    return response.data
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`)
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
