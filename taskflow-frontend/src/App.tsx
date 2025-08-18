"use client"

import * as React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "react-query"
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

// Styles
import "./App.css"

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  const toastHandler = useToast()
  const toastSetRef = React.useRef(false)
  
  // Set global toast immediately and only once
  if (!toastSetRef.current) {
    setGlobalToast(toastHandler)
    toastSetRef.current = true
  }
  
  // Also set it in useEffect as backup
  React.useEffect(() => {
    setGlobalToast(toastHandler)
  }, [toastHandler])

  // Bridge component to keep a single SSE connection while authenticated
  const SSEBridge: React.FC = () => {
    const { user } = useAuth()
    React.useEffect(() => {
      if (!user) return
  const base = API_BASE_URL.replace(/\/$/, "")
  // If base already contains /api, don't double it
  const sseUrl = base.match(/\/api\/?$/) ? `${base}/events/stream` : `${base}/api/events/stream`
  const sse = new SSEClient(sseUrl)
      sse.connect({
        // Teams
        'team.updated': () => {
          // Invalidate team-related caches across the app
          queryClient.invalidateQueries(["teams"]) // Teams list
          queryClient.invalidateQueries(["user-teams", user.id])
          // IMPORTANT: use string key for partial match to invalidate all ["board-teams", boardId] queries
          queryClient.invalidateQueries('board-teams')
          // Optional eager refetch to reduce window of staleness
          queryClient.refetchQueries('board-teams', { exact: false })
          // Also refresh board data to update server-calculated permissions immediately
          queryClient.invalidateQueries('board')
          queryClient.refetchQueries('board', { exact: false })
        },
        // Boards lifecycle affecting visibility of tasks in counts
        'board.archived': () => {
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
          queryClient.invalidateQueries(["boards"]) // lists/cards
        },
        'board.deleted': () => {
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
          queryClient.invalidateQueries(["boards"]) 
        },
        'board.unarchived': () => {
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
          queryClient.invalidateQueries(["boards"]) 
        },
        'board.restored': () => {
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
          queryClient.invalidateQueries(["boards"]) 
        },
        // Tasks lifecycle
        'task.created': (d: any) => {
          if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
          // Update global due counters
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
        },
        'task.updated': (d: any) => {
          if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
        },
        'task.moved': (d: any) => {
          if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
        },
        'task.deleted': (d: any) => {
          if (d?.boardId) queryClient.invalidateQueries(["tasks", d.boardId])
          queryClient.invalidateQueries(["tasks", "due-today"]) 
          queryClient.invalidateQueries(["tasks", "due-soon"]) 
        },
        // Comments
        'comment.created': (d: any) => {
          if (d?.taskId) queryClient.invalidateQueries(["comments", String(d.taskId)])
        },
        'comment.deleted': (d: any) => {
          if (d?.taskId) queryClient.invalidateQueries(["comments", String(d.taskId)])
        },
        // Notifications
        'notification.created': () => {
          queryClient.invalidateQueries(['notifications', 'unread-count'])
          queryClient.invalidateQueries(['notifications', 'list'])
          // Fire-and-forget sound respecting user settings
          try {
            const enabled = (window as any).localStorage ? JSON.parse(localStorage.getItem('notif_sound_enabled') || 'true') : true
            const vol = (window as any).localStorage ? (JSON.parse(localStorage.getItem('notif_sound_volume') || '70')/100) : 0.7
            if (enabled) {
              const audio = new Audio('/sounds/notify.mp3')
              audio.volume = vol
              audio.play().catch(()=>{})
            }
          } catch {}
        },
      })
      return () => sse.close()
    }, [user])
    return null
  }
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <div className="App min-h-screen bg-background text-foreground">
                {/* Global SSE bridge for real-time cache invalidation */}
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

                {/* Global Toast Notifications */}
                <Toaster />
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
