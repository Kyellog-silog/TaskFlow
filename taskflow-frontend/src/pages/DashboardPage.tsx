"use client"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Header } from "../components/Header"
import { CreateBoardModal } from "../components/CreateBoardModal"
import { DeleteBoardModal } from "../components/DeleteBoardModal"
import { EditBoardModal } from "../components/EditBoardModal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu"
import { boardsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"
import { Calendar, Users, CheckSquare, Clock, MoreVertical, Folder, RefreshCw, Sparkles, Target, Edit, Trash2, Copy, ExternalLink, TrendingUp, Activity, Eye, Archive } from 'lucide-react'


const DashboardPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Modal states
  const [deleteBoard, setDeleteBoard] = useState<any>(null)
  const [editBoard, setEditBoard] = useState<any>(null)

  // Fetch recent boards (top 5 most recently visited)
  const {
    data: recentBoardsData,
    isLoading: recentBoardsLoading,
    error: recentBoardsError,
    refetch: refetchRecentBoards,
  } = useQuery(
    ["boards", "recent"],
    async () => {
      const response = await boardsAPI.getBoards("recent", 5)
      return response
    },
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
      onError: (error: any) => {
        console.error("Failed to fetch recent boards:", error)
        toast({
          title: "Error",
          description: "Failed to load recent boards",
          variant: "destructive",
        })
      },
    },
  )

  const estimateCompletionPercentage = (board: any) => {
    const totalTasks = board.tasks_count || 0;
    if (totalTasks === 0) return 0;
    
    if (board.columns && board.columns.length > 0) {
      const doneColumn = board.columns.find((col: any) => 
        col.name.toLowerCase() === 'done' || 
        col.name.toLowerCase().includes('complete')
      );
      
      if (doneColumn && doneColumn.tasks) {
        const completedTasks = doneColumn.tasks.length;
        return Math.round((completedTasks / totalTasks) * 100);
      }
    }
    return Math.min(100, Math.round(totalTasks > 0 ? 25 : 0));
  }

  // Fetch all active boards for stats
  const {
    data: allBoardsData,
    isLoading: allBoardsLoading,
  } = useQuery(
    ["boards", "active"],
    async () => {
      const response = await boardsAPI.getBoards("active")
      return response
    },
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    },
  )

  // Delete board mutation
  const deleteBoardMutation = useMutation(
    async (boardId: string) => {
      return await boardsAPI.deleteBoard(boardId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("boards")
        toast({
          title: "Success! 🗑️",
          description: "Board deleted successfully",
        })
        setDeleteBoard(null)
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete board",
          variant: "destructive",
        })
      },
    },
  )

  // Archive board mutation
  const archiveBoardMutation = useMutation(
    async (boardId: string) => {
      return await boardsAPI.archiveBoard(boardId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("boards")
        toast({
          title: "Success! 📦",
          description: "Board archived successfully",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to archive board",
          variant: "destructive",
        })
      },
    },
  )

  // Handle board creation success
  const handleBoardCreated = (newBoard: any) => {
    console.log("New board created:", newBoard)
    refetchRecentBoards()
    queryClient.invalidateQueries(["boards", "active"])
    toast({
      title: "Success! 🎉",
      description: "Board created successfully",
    })
  }

  // Handle board update success
  const handleBoardUpdated = (updatedBoard: any) => {
    console.log("Board updated:", updatedBoard)
    refetchRecentBoards()
    queryClient.invalidateQueries(["boards", "active"])
    setEditBoard(null)
    toast({
      title: "Success! ✨",
      description: "Board updated successfully",
    })
  }

  // Navigate to board
  const handleBoardClick = (boardId: string) => {
    navigate(`/boards/${boardId}`)
  }

  // Navigate to boards page
  const handleViewAllBoards = () => {
    navigate('/boards')
  }

  // Handle board actions
  const handleEditBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditBoard(board)
  }

  const handleDeleteBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteBoard(board)
  }

  const handleArchiveBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    archiveBoardMutation.mutate(board.id)
  }
  

  const handleDuplicateBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement board duplication
    toast({
      title: "Coming Soon! 🚀",
      description: "Board duplication feature is coming soon",
    })
  }

  // Get boards array from response
  const recentBoards = recentBoardsData?.data || []
  const allBoards = allBoardsData?.data || []

  // Calculate stats
  const totalTasks = allBoards.reduce((acc: number, board: any) => acc + (board.tasks_count || 0), 0)
  const totalBoards = allBoards.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8">
          {/* Enhanced Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 text-lg">Here's what's happening with your projects today.</p>
            </div>
            <CreateBoardModal onBoardCreated={handleBoardCreated} />
          </div>

          {/* Beautiful Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Boards</p>
                    <p className="text-3xl font-bold">{totalBoards}</p>
                    <p className="text-blue-200 text-xs mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Active projects
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Folder className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Tasks</p>
                    <p className="text-3xl font-bold">{totalTasks}</p>
                    <p className="text-green-200 text-xs mt-1">
                      <Activity className="h-3 w-3 inline mr-1" />
                      Across all boards
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <CheckSquare className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Recent Boards</p>
                    <p className="text-3xl font-bold">{recentBoards.length}</p>
                    <p className="text-purple-200 text-xs mt-1">
                      <Eye className="h-3 w-3 inline mr-1" />
                      Recently visited
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Due Today</p>
                    <p className="text-3xl font-bold">3</p>
                    <p className="text-orange-200 text-xs mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Need attention
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Boards Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Recently Visited Boards ⚡
              </h2>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleViewAllBoards}
                  className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Boards
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetchRecentBoards()}
                  disabled={recentBoardsLoading}
                  className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${recentBoardsLoading ? "animate-spin" : ""}`} />
                  {recentBoardsLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            {recentBoardsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
                        <div className="flex space-x-2">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentBoardsError ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-lg p-8 text-center">
                <div className="text-red-500 mb-4">
                  <Folder className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load recent boards</h3>
                <p className="text-gray-600 mb-4">There was an error loading your recent boards. Please try again.</p>
                <Button 
                  onClick={() => refetchRecentBoards()} 
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Again
                </Button>
              </Card>
            ) : recentBoards.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <Clock className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No recent boards yet! 🚀</h3>
                <p className="text-gray-600 mb-6 text-lg">Start by creating your first board or visit an existing one to see it here.</p>
                <div className="flex justify-center space-x-4">
                  <CreateBoardModal onBoardCreated={handleBoardCreated} />
                  <Button 
                    variant="outline"
                    onClick={handleViewAllBoards}
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All Boards
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentBoards.map((board: any) => (
                  <Card
                    key={board.id}
                    className="group bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden"
                    onClick={() => handleBoardClick(board.id)}
                  >
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3 group-hover:scale-110 transition-transform duration-200"></div>
                            {board.name}
                          </CardTitle>
                          <CardDescription className="text-gray-600 text-sm leading-relaxed">
                            {board.description || "No description provided"}
                          </CardDescription>
                        </div>
                        
                        {/* Enhanced 3-Dot Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 hover:scale-110 rounded-full" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-2xl rounded-xl">
                            <DropdownMenuItem 
                              className="text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                              onClick={(e) => handleEditBoard(board, e)}
                            >
                              <Edit className="h-4 w-4 mr-3" />
                              Edit Board
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-orange-600 hover:bg-orange-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                              onClick={(e) => handleArchiveBoard(board, e)}
                            >
                              <Archive className="h-4 w-4 mr-3" />
                              Archive Board
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-green-600 hover:bg-green-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                              onClick={(e) => handleDuplicateBoard(board, e)}
                            >
                              <Copy className="h-4 w-4 mr-3" />
                              Duplicate Board
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-purple-600 hover:bg-purple-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/boards/${board.id}`, '_blank')
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-3" />
                              Open in New Tab
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200 my-2" />
                            <DropdownMenuItem 
                              className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                              onClick={(e) => handleDeleteBoard(board, e)}
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Delete Board
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 relative z-10">
                      <div className="space-y-4">
                        {/* Enhanced Board Stats */}
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 text-blue-600">
                              <Target className="h-4 w-4" />
                              <span className="font-semibold text-sm">{board.columns?.length || 0}</span>
                              <span className="text-xs text-gray-600">columns</span>
                            </div>
                            <div className="w-1 h-4 bg-gray-300 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, (board.tasks_count || 0) * 10)}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckSquare className="h-4 w-4" />
                              <span className="font-semibold text-sm">{board.tasks_count || 0}</span>
                              <span className="text-xs text-gray-600">tasks</span>
                            </div>
                          </div>
                          
                          {/* Progress indicator */}
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                                style={{ width: `${estimateCompletionPercentage(board)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              {estimateCompletionPercentage(board)}%
                            </span>
                          </div>
                        </div>

                        {/* Team Info */}
                        {board.team && board.team.name && (
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 font-medium">
                              <Users className="h-3 w-3 mr-1" />
                              {board.team.name}
                            </Badge>
                          </div>
                        )}

                        {/* Enhanced Creator Info with Last Visited */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                              <AvatarImage src={board.created_by?.avatar || "/placeholder.svg?height=32&width=32"} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                {board.created_by?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {board.created_by?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">Creator</p>
                            </div>
                          </div>
                          
                          {/* Last Visited Date */}
                          <div className="text-right">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>Last visited</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {board.last_visited_at 
                                ? new Date(board.last_visited_at).toLocaleDateString() === new Date().toLocaleDateString()
                                  ? "Today"
                                  : `${Math.ceil((Date.now() - new Date(board.last_visited_at).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                : "Never"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Recent Activity */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Latest updates from your boards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <div className="h-3 w-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New board created: "Test board"</p>
                    <p className="text-xs text-gray-500 mt-1">Just now • by {user?.name}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                </div>
                
                <div className="flex items-start space-x-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="h-3 w-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Task completed in Development Board</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago • by Team Member</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                </div>
                
                <div className="flex items-start space-x-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New team member added</p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago • by Admin</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">Team</Badge>
                </div>
                
                {recentBoards.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-3">
                      <Activity className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-sm text-gray-500">No recent activity to show</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first board to get started!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modals */}
      {deleteBoard && (
        <DeleteBoardModal
          board={deleteBoard}
          isOpen={!!deleteBoard}
          onClose={() => setDeleteBoard(null)}
          onConfirm={() => deleteBoardMutation.mutate(deleteBoard.id)}
          isLoading={deleteBoardMutation.isLoading}
        />
      )}

      {editBoard && (
        <EditBoardModal
          board={editBoard}
          isOpen={!!editBoard}
          onClose={() => setEditBoard(null)}
          onBoardUpdated={handleBoardUpdated}
        />
      )}
    </div>
  )
}

export default DashboardPage