"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authAPI } from "../services/api"
import logger from "../lib/logger"





interface User {
  id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string)  => Promise<void>
  logout: () => void
  updateProfile: (profileData: any) => Promise<void>
  refreshUser: () => Promise<void>
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async() => {
      try {
        const response = await authAPI.getUser();
        if (response.success && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // If error, user is not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    await authAPI.getCsrfCookie();
    const response = await authAPI.login(email, password);
    if (response.success && response.data && response.data.user) {
      setUser(response.data.user);
    }
    return response;
  }

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    const response = await authAPI.register(name, email, password, password_confirmation);
    if (response.success && response.data && response.data.user) {
      setUser(response.data.user);
    }
    return response;
  }

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      // Even if logout API fails, clear user state
      setUser(null);
    }
  }

  const updateProfile = async (profileData: any) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getUser();
      if (response.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      logger.error('Failed to refresh user data:', error);
      // Don't throw error as this is a background refresh
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
