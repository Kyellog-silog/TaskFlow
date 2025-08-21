"use client"

import * as React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider, setLogger } from "react-query"
import { ReactQueryDevtools } from "react-query/devtools"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { LoadingSpinner } from "./components/LoadingSpinner"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { useAuth } from "./contexts/AuthContext"
import { useToast } from "./hooks/use-toast"
import { setGlobalToast } from "./services/api"
import SSEClient from "./services/sse"
import { API_BASE_URL } from "./services/api"

// Pages
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import BoardPage from "./pages/BoardPage"
import BoardsPage from "./pages/BoardsPage"
import TeamsPage from "./pages/TeamsPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import NotFoundPage from "./pages/NotFoundPage"
import logger from "./lib/logger"

// Styles
import "./App.css"

// Create a client for React Query with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      suspense: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Silence react-query logs in production
if (process.env.NODE_ENV !== "development") {
  setLogger({
    log: () => {},
    warn: () => {},
    error: (error) => {
      logger.error(error)
    },
  })
}

function ToastInitializer({ children }: { children: React.ReactNode }) {
  const toastHandler = useToast()

  React.useEffect(() => {
    // Set global toast after the Toaster component is mounted
    setGlobalToast(toastHandler)
  }, [toastHandler])

  return <>{children}</>
}

function SSEBridge() {
  const { user } = useAuth()

  React.useEffect(() => {
    if (!user) return

    const base = API_BASE_URL.replace(/\/$/, "")
    const sseUrl = base.match(/\/api\/?$/) ? `${base}/events/stream` : `${base}/api/events/stream`
    const sse = new SSEClient(sseUrl)

    sse.connect({
      // Teams
      "team.updated": () => {
        queryClient.invalidateQueries(["teams"])
        queryClient.invalidateQueries(["user-teams", user.id])
        queryClient.invalidateQueries("board-teams")
        queryClient.refetchQueries("board-teams", { exact: false })
        queryClient.invalidateQueries("board")
        queryClient.refetchQueries("board", { exact: false })
      },
      // Boards lifecycle affecting visibility of tasks in counts
      "board.archived": () => {
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["boards"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "board.deleted": () => {
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["boards"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "board.unarchived": () => {
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["boards"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "board.restored": () => {
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["boards"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "board.created": () => {
        queryClient.invalidateQueries(["boards"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      // Tasks lifecycle
      "task.created": (d: any) => {
        if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "task.updated": (d: any) => {
        if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "task.moved": (d: any) => {
        if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      "task.deleted": (d: any) => {
        if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
        queryClient.invalidateQueries(["tasks", "due-today"])
        queryClient.invalidateQueries(["tasks", "due-soon"])
        queryClient.invalidateQueries(["profile", "activity"])
      },
      // Comments
      "comment.created": (d: any) => {
        if (d?.taskId) queryClient.invalidateQueries(["comments", String(d.taskId)])
      },
      "comment.deleted": (d: any) => {
        if (d?.taskId) queryClient.invalidateQueries(["comments", String(d.taskId)])
      },
      // Notifications
      "notification.created": () => {
        queryClient.invalidateQueries(["notifications", "unread-count"])
        queryClient.invalidateQueries(["notifications", "list"])
        try {
          const enabled = (window as any).localStorage
            ? JSON.parse(localStorage.getItem("notif_sound_enabled") || "true")
            : true
          const vol = (window as any).localStorage
            ? JSON.parse(localStorage.getItem("notif_sound_volume") || "70") / 100
            : 0.7
          if (enabled) {
            const audio = new Audio("/sounds/notify.mp3")
            audio.volume = vol
            audio.play().catch(() => {})
          }
        } catch {}
      },
    })

    return () => sse.close()
  }, [user])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <div className="App min-h-screen bg-background text-foreground">
                <ToastInitializer>
                  <Toaster />
                  <SSEBridge />
                  <Routes>
                    {/* Public Routes */}
                    <Route
                      path="/login"
                      element={
                        <PublicRoute>
                          <LoginPage />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicRoute>
                          <RegisterPage />
                        </PublicRoute>
                      }
                    />

                    {/* Protected Routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/boards"
                      element={
                        <ProtectedRoute>
                          <BoardsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/boards/:boardId"
                      element={
                        <ProtectedRoute>
                          <BoardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teams"
                      element={
                        <ProtectedRoute>
                          <TeamsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teams/:teamId"
                      element={
                        <ProtectedRoute>
                          <TeamsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch all route - 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </ToastInitializer>
              </div>
            </Router>
          </AuthProvider>
        </ThemeProvider>

        {/* React Query Devtools - only in development */}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

// Public Route Component - redirects to dashboard if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default App
