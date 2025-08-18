"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
type Theme = "light"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme] = useState<Theme>("light")
  const [actualTheme] = useState<"light">("light")

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark")
    root.classList.add("light")
  }, [])

  const handleSetTheme = () => {
    // no-op; light only
  }

  const value = { theme, setTheme: handleSetTheme, actualTheme }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
