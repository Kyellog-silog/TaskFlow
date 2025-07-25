"use client"

import type React from "react"
import { useState, useEffect } from "react";
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
import { boardsAPI, teamsAPI } from "../services/api"
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
  const boardId = location.pathname.startsWith('/boards/')
    ? location.pathname.split('/')[2]
    : undefined
  
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
    queryKey: ['teams'],
    queryFn: teamsAPI.getTeams,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
        { title: "Done", id: "done", color: "green-500" }
      ]
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

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">TaskFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/boards"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Boards
            </Link>
            <Link
              to="/teams"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Create Button with Dropdown */}
            <DropdownMenu open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => {
                  setIsCreateTaskModalOpen(true)
                  setIsCreateMenuOpen(false)
                }}>
                  New Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setIsCreateBoardModalOpen(true)
                  setIsCreateMenuOpen(false)
                }}>
                  New Board
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  navigate('/teams')
                  // We'll use the existing create team functionality in TeamsPage
                  setTimeout(() => {
                    const createTeamButton = document.querySelector('[data-create-team-button]')
                    if (createTeamButton) {
                      (createTeamButton as HTMLButtonElement).click()
                    }
                  }, 100)
                  setIsCreateMenuOpen(false)
                }}>
                  New Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg?height=32&width=32"} alt={user?.name} />
                    <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/boards"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Boards
              </Link>
              <Link
                to="/teams"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Teams
              </Link>
              <div className="pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      setIsCreateTaskModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}>
                      New Task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setIsCreateBoardModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}>
                      New Board
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      navigate('/teams')
                      setIsMobileMenuOpen(false)
                      // We'll use the existing create team functionality in TeamsPage
                      setTimeout(() => {
                        const createTeamButton = document.querySelector('[data-create-team-button]')
                        if (createTeamButton) {
                          (createTeamButton as HTMLButtonElement).click()
                        }
                      }, 100)
                    }}>
                      New Team
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
            boardsAPI.getBoards().then(response => {
              if (response?.data?.length > 0) {
                // If boards exist, prompt to select one
                toast({
                  title: "Board Required",
                  description: "Please select a board to create a task",
                })
                navigate('/boards')
              } else {
                // If no boards exist, prompt to create one first
                toast({
                  title: "No Boards Found",
                  description: "You need to create a board before adding tasks",
                })
                setIsCreateBoardModalOpen(true)
              }
            }).catch(() => {
              // If API call fails, show generic message
              toast({
                title: "Board Required",
                description: "Please create or select a board first",
              })
              navigate('/boards')
            })
          }
        }}
        columnId="todo" // Default column for new tasks
      />
      
      {/* Create Board Modal */}
      <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateBoard} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="board-name" className="text-sm font-medium">
                Board Name
              </label>
              <Input
                id="board-name"
                value={newBoard.name}
                onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                placeholder="Enter board name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="board-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="board-description"
                value={newBoard.description}
                onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                placeholder="Enter board description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="team-id" className="text-sm font-medium">
                Team (Optional)
              </label>
              <select
                id="team-id"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    No team (Personal Board)
                  </option>
                  {teamsData?.data?.map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>  
                  ))}
                </select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateBoardModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBoardMutation.isLoading}>
                {createBoardMutation.isLoading ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
