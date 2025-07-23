
import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

// Fetch CSRF token before protected requests
api.interceptors.request.use(async (config) => {
  // Skip for CSRF endpoint itself
  if (config.url?.includes("sanctum/csrf-cookie")) return config;
  
  // Ensure CSRF token exists
  if (!document.cookie.includes("XSRF-TOKEN")) {
    await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
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
    if (error.response?.status === 419) { // CSRF token mismatch
      console.warn("CSRF token expired, refreshing...");
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  },
)

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    const response = await api.post("/login", { email, password })
    return response.data
  },

  register: async (name: string, email: string, password: string) => {
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    const response = await api.post("/register", { name, email, password })
    return response.data
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
