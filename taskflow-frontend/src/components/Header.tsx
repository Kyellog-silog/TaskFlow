"use client"

import  React from "react"
import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Bell, Search, Plus, Menu, X } from "lucide-react"
import { CreateTaskModal } from "./CreateTaskModal"
import { useTasks } from "../hooks/useTasks"
import { useToast } from "../hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { boardsAPI, teamsAPI, notificationsAPI } from "../services/api"
import { storageService } from "../services/storage"
import { useQuery, useMutation, useQueryClient } from "react-query"

export const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false)
  const [newBoard, setNewBoard] = useState({ name: "", description: "" })

  // Extract boardId from URL if on a board page
  const boardId = location.pathname.startsWith("/boards/") ? location.pathname.split("/")[2] : undefined

  const { createTask } = useTasks(boardId)

  // Create board mutation
  const createBoardMutation = useMutation(boardsAPI.createBoard, {
    onSuccess: (data) => {
      queryClient.invalidateQueries("boards")
      setIsCreateBoardModalOpen(false)
      setNewBoard({ name: "", description: "" })
      toast({
        title: "Success",
        description: "Board created successfully with default columns",
      })
      // Navigate to the new board
      if (data?.id) {
        navigate(`/boards/${data.id}`)
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create board",
        variant: "destructive",
      })
    },
  })

  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: teamsAPI.getTeams,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Notifications state via react-query
  const prevUnreadRef = React.useRef<number>(0)
  const { data: unreadCountData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsAPI.getUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    onSuccess: (data) => {
      try {
        const current = data?.data?.count ?? 0
        const prev = prevUnreadRef.current
        // If unread increased, optionally play sound
        if (current > prev) {
          const soundOn = storageService.getItem<boolean>('notif_sound_enabled') ?? true
          const volume = (storageService.getItem<number>('notif_sound_volume') ?? 70) / 100
          if (soundOn) {
            const audio = new Audio('/sounds/notify.mp3')
            audio.volume = volume
            audio.play().catch(()=>{})
          }
        }
        prevUnreadRef.current = current
      } catch {}
    }
  })
  const unreadCount = unreadCountData?.data?.count ?? 0

  const { data: notificationsList } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsAPI.list(10),
    staleTime: 30 * 1000,
  })

  const markAllReadMutation = useMutation(notificationsAPI.markAllRead, {
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications", "unread-count"])
      queryClient.invalidateQueries(["notifications", "list"])
    },
  })

  // Add team selection state - now optional
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoard.name.trim()) return

    // Add default columns to the board data
    const boardData = {
      ...newBoard,
      ...(selectedTeamId && { team_id: selectedTeamId }),
      columns: [
        { title: "To Do", id: "todo", color: "blue-500" },
        { title: "In Progress", id: "in-progress", color: "yellow-500" },
        { title: "Review", id: "review", color: "purple-500" },
        { title: "Done", id: "done", color: "green-500" },
      ],
    }

    createBoardMutation.mutate(boardData)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const renderNotificationText = (n: any) => {
    const type = n.type
    const data = n.data || {}
    switch (type) {
      case "task.assigned":
        return <div>You've been assigned to a task.</div>
      case "task.completed":
        return <div>A task was marked as completed.</div>
      case "comment.created":
        return <div>New comment on a task you're involved in.</div>
      default:
        return <div>Update in your workspace.</div>
    }
  }

  return (
    <>
  <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                  TaskFlow
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-50"
              >
                Dashboard
              </Link>
              <Link
                to="/boards"
                className="text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-purple-50"
              >
                Boards
              </Link>
              <Link
                to="/teams"
                className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-green-50"
              >
                Teams
              </Link>
            </nav>

            {/* Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks, boards, or teams..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Create Button with Dropdown */}
              <DropdownMenu open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setIsCreateTaskModalOpen(true)
                      setIsCreateMenuOpen(false)
                    }}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>New Task</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsCreateBoardModalOpen(true)
                      setIsCreateMenuOpen(false)
                    }}
                    className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>New Board</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigate("/teams")
                      // We'll use the existing create team functionality in TeamsPage
                      setTimeout(() => {
                        const createTeamButton = document.querySelector("[data-create-team-button]")
                        if (createTeamButton) {
                          ;(createTeamButton as HTMLButtonElement).click()
                        }
                      }, 100)
                      setIsCreateMenuOpen(false)
                    }}
                    className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>New Team</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative hover:bg-blue-50 transition-colors">
                    <Bell className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                    <DropdownMenuLabel className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Notifications
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-blue-600 hover:text-purple-600 hover:underline font-medium transition-colors"
                        onClick={() => markAllReadMutation.mutate()}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {(notificationsList?.data?.length ?? 0) === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications</p>
                        <p className="text-xs text-gray-400">You're all caught up! 🎉</p>
                      </div>
                    ) : (
                      notificationsList?.data?.map((n: any) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-white/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-2 w-2 rounded-full ${n.read_at ? "bg-gray-300" : "bg-gradient-to-r from-blue-500 to-purple-500"} shadow-sm`}
                            />
                            <div className="flex-1">
                              <div className="text-sm text-gray-800 font-medium">{renderNotificationText(n)}</div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                <span>{new Date(n.created_at).toLocaleString()}</span>
                                {!n.read_at && <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-200 transition-all"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl"
                  align="end"
                  forceMount
                >
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                          {user?.name ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-gray-600 truncate">{user?.email || "user@example.com"}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="py-2">
                    <DropdownMenuItem
                      asChild
                      className="mx-2 mb-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
                    >
                      <Link to="/profile" className="flex items-center space-x-3 px-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Profile</span>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="mx-2 mb-1 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-200"
                    >
                      <Link to="/settings" className="flex items-center space-x-3 px-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Settings</span>
                          <p className="text-xs text-gray-500">Preferences & privacy</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="mx-2 mb-1 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all duration-200"
                    >
                      <Link to="/help" className="flex items-center space-x-3 px-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Help & Support</span>
                          <p className="text-xs text-gray-500">Get help and tutorials</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="mx-2 bg-gradient-to-r from-gray-200 to-gray-300" />

                  {/* Logout */}
                  <div className="py-2">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="mx-2 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 cursor-pointer transition-all duration-200 text-red-600 hover:text-red-700"
                    >
                      <div className="flex items-center space-x-3 px-3 py-2 w-full">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium">Sign Out</span>
                          <p className="text-xs text-gray-500">See you later! 👋</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden hover:bg-blue-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-600" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex flex-col space-y-2">
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/boards"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Boards
                </Link>
                <Link
                  to="/teams"
                  className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Teams
                </Link>
                <div className="pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setIsCreateBoardModalOpen(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>New Board</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          navigate("/teams")
                          setIsMobileMenuOpen(false)
                          // We'll use the existing create team functionality in TeamsPage
                          setTimeout(() => {
                            const createTeamButton = document.querySelector("[data-create-team-button]")
                            if (createTeamButton) {
                              ;(createTeamButton as HTMLButtonElement).click()
                            }
                          }, 100)
                        }}
                        className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>New Team</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={(taskData) => {
          // If we have a boardId (we're on a board page), use it
          if (boardId) {
            createTask({
              ...taskData,
              board_id: boardId,
            })
          } else {
            // Check if there are any boards
            boardsAPI
              .getBoards()
              .then((response) => {
                if (response?.data?.length > 0) {
                  // If boards exist, prompt to select one
                  toast({
                    title: "Board Required",
                    description: "Please select a board to create a task",
                  })
                  navigate("/boards")
                } else {
                  // If no boards exist, prompt to create one first
                  toast({
                    title: "No Boards Found",
                    description: "You need to create a board before adding tasks",
                  })
                  setIsCreateBoardModalOpen(true)
                }
              })
              .catch(() => {
                // If API call fails, show generic message
                toast({
                  title: "Board Required",
                  description: "Please create or select a board first",
                })
                navigate("/boards")
              })
          }
        }}
        columnId="todo" // Default column for new tasks
      />

      {/* Create Board Modal */}
      <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Board
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateBoard} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="board-name" className="text-sm font-bold text-gray-800">
                Board Name
              </label>
              <Input
                id="board-name"
                value={newBoard.name}
                onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                placeholder="Enter board name"
                className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="board-description" className="text-sm font-bold text-gray-800">
                Description
              </label>
              <Textarea
                id="board-description"
                value={newBoard.description}
                onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                placeholder="Enter board description"
                className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="team-id" className="text-sm font-bold text-gray-800">
                Team (Optional)
              </label>
              <select
                id="team-id"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No team (Personal Board)</option>
                {teamsData?.data?.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateBoardModalOpen(false)}
                className="border-2 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBoardMutation.isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {createBoardMutation.isLoading ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
