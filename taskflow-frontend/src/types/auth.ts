export interface User {
    id: string
    name: string
    email: string
    role: "admin" | "member"
    avatar?: string
    createdAt: string
    updatedAt: string
  }
  
  export interface AuthResponse {
    user: User
    token: string
    tokenType: string
  }
  
  export interface LoginRequest {
    email: string
    password: string
  }
  
  export interface RegisterRequest {
    name: string
    email: string
    password: string
    passwordConfirmation: string
  }
  
  export interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => void
    isLoading: boolean
    isAuthenticated: boolean
  }
  