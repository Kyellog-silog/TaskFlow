"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authAPI } from "../services/api"





interface User {
  id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string)  => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getUser()
          setUser(userData)
        } catch (error) {
          localStorage.removeItem("token")
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [token])

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password)
    const { user: userData, token: authToken } = response

    localStorage.setItem("token", authToken)
    setToken(authToken)
    setUser(userData)
  }

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await authAPI.register(name, email, password, password_confirmation)
    const { user: userData, token: authToken } = response

    localStorage.setItem("token", authToken)
    setToken(authToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
