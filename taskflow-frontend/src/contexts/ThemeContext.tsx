"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { storageService } from "../services/storage"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
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
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = storageService.getItem<Theme>("theme")
    return savedTheme || "system"
  })

  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        setActualTheme(systemTheme)
      } else {
        setActualTheme(theme)
      }
    }

    updateActualTheme()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", updateActualTheme)
      return () => mediaQuery.removeEventListener("change", updateActualTheme)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(actualTheme)
  }, [actualTheme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    storageService.setItem("theme", newTheme)
  }

  const value = {
    theme,
    setTheme: handleSetTheme,
    actualTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
