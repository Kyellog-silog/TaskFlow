"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useNavigate } from "react-router-dom"
import { Header } from "../components/Header"
import { CreateBoardModal } from "../components/CreateBoardModal"
import { DeleteBoardModal } from "../components/DeleteBoardModal"
import { EditBoardModal } from "../components/EditBoardModal"
import { RestoreBoardModal } from "../components/RestoreBoardModal"
import { ArchiveBoardModal } from "../components/ArchiveBoardModal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu"
import { boardsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"
import { Calendar, Users, CheckSquare, Clock, MoreVertical, Folder, RefreshCw, Sparkles, Target, Edit, Trash2, Copy, ExternalLink, Archive, ArchiveRestore, Eye, ArrowLeft, Filter } from 'lucide-react'

const BoardsPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // State
  const [activeTab, setActiveTab] = useState("active")
  const [deleteBoard, setDeleteBoard] = useState<any>(null)
  const [editBoard, setEditBoard] = useState<any>(null)
  const [restoreBoard, setRestoreBoard] = useState<any>(null)
  const [archiveBoard, setArchiveBoard] = useState<any>(null)

  // Fetch active boards
  const {
    data: activeBoardsData,
    isLoading: activeBoardsLoading,
    error: activeBoardsError,
    refetch: refetchActiveBoards,
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

  // Fetch archived boards
  const {
    data: archivedBoardsData,
    isLoading: archivedBoardsLoading,
    error: archivedBoardsError,
    refetch: refetchArchivedBoards,
  } = useQuery(
    ["boards", "archived"],
    async () => {
      const response = await boardsAPI.getBoards("archived")
      return response
    },
    {
      enabled: activeTab === "archived",
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    },
  )

  // Fetch deleted boards
  const {
    data: deletedBoardsData,
    isLoading: deletedBoardsLoading,
    error: deletedBoardsError,
    refetch: refetchDeletedBoards,
  } = useQuery(
    ["boards", "deleted"],
    async () => {
      const response = await boardsAPI.getBoards("deleted")
      return response
    },
    {
      enabled: activeTab === "deleted",
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
    },
  )

  // Mutations
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
        setArchiveBoard(null)
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

  const unarchiveBoardMutation = useMutation(
    async (boardId: string) => {
      return await boardsAPI.unarchiveBoard(boardId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("boards")
        toast({
          title: "Success! 📤",
          description: "Board unarchived successfully",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to unarchive board",
          variant: "destructive",
        })
      },
    },
  )

  const restoreBoardMutation = useMutation(
    async (boardId: string) => {
      return await boardsAPI.restoreBoard(boardId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("boards")
        toast({
          title: "Success! ♻️",
          description: "Board restored successfully",
        })
        setRestoreBoard(null)
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to restore board",
          variant: "destructive",
        })
      },
    },
  )

  // Event handlers
  const handleBoardCreated = (newBoard: any) => {
    queryClient.invalidateQueries("boards")
    toast({
      title: "Success! 🎉",
      description: "Board created successfully",
    })
  }

  const handleBoardUpdated = (updatedBoard: any) => {
    queryClient.invalidateQueries("boards")
    setEditBoard(null)
    toast({
      title: "Success! ✨",
      description: "Board updated successfully",
    })
  }

  const handleBoardClick = (boardId: string) => {
    navigate(`/boards/${boardId}`)
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  // Board action handlers
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
    setArchiveBoard(board)
  }

  const handleUnarchiveBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    unarchiveBoardMutation.mutate(board.id)
  }

  const handleRestoreBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setRestoreBoard(board)
  }

  const handleDuplicateBoard = (board: any, e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Coming Soon! 🚀",
      description: "Board duplication feature is coming soon",
    })
  }

  // Get current boards based on active tab
  const getCurrentBoards = () => {
    switch (activeTab) {
      case "active":
        return activeBoardsData?.data || []
      case "archived":
        return archivedBoardsData?.data || []
      case "deleted":
        return deletedBoardsData?.data || []
      default:
        return []
    }
  }

  const getCurrentLoading = () => {
    switch (activeTab) {
      case "active":
        return activeBoardsLoading
      case "archived":
        return archivedBoardsLoading
      case "deleted":
        return deletedBoardsLoading
      default:
        return false
    }
  }

  const getCurrentError = () => {
    switch (activeTab) {
      case "active":
        return activeBoardsError
      case "archived":
        return archivedBoardsError
      case "deleted":
        return deletedBoardsError
      default:
        return null
    }
  }

  const handleRefresh = () => {
    switch (activeTab) {
      case "active":
        refetchActiveBoards()
        break
      case "archived":
        refetchArchivedBoards()
        break
      case "deleted":
        refetchDeletedBoards()
        break
    }
  }

  const currentBoards = getCurrentBoards()
  const currentLoading = getCurrentLoading()
  const currentError = getCurrentError()

  // Board card component
  const BoardCard = ({ board, type }: { board: any; type: 'active' | 'archived' | 'deleted' }) => (
    <Card
      className="group bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden"
      onClick={() => type === 'active' ? handleBoardClick(board.id) : undefined}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Status indicator */}
      {type === 'archived' && (
        <div className="absolute top-2 right-2 z-20">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <Archive className="h-3 w-3 mr-1" />
            Archived
          </Badge>
        </div>
      )}
      {type === 'deleted' && (
        <div className="absolute top-2 right-2 z-20">
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <Trash2 className="h-3 w-3 mr-1" />
            Deleted
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 group-hover:scale-110 transition-transform duration-200 ${
                type === 'active' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                type === 'archived' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                'bg-gradient-to-r from-red-500 to-pink-500'
              }`}></div>
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
              {type === 'active' && (
                <>
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
                </>
              )}
              
              {type === 'archived' && (
                <>
                  <DropdownMenuItem 
                    className="text-green-600 hover:bg-green-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                    onClick={(e) => handleUnarchiveBoard(board, e)}
                  >
                    <ArchiveRestore className="h-4 w-4 mr-3" />
                    Unarchive Board
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`/boards/${board.id}`, '_blank')
                    }}
                  >
                    <Eye className="h-4 w-4 mr-3" />
                    View Board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 my-2" />
                  <DropdownMenuItem 
                    className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                    onClick={(e) => handleDeleteBoard(board, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Delete Permanently
                  </DropdownMenuItem>
                </>
              )}
              
              {type === 'deleted' && (
                <>
                  <DropdownMenuItem 
                    className="text-green-600 hover:bg-green-50 cursor-pointer rounded-lg mx-1 my-1 font-medium"
                    onClick={(e) => handleRestoreBoard(board, e)}
                  >
                    <ArchiveRestore className="h-4 w-4 mr-3" />
                    Restore Board
                  </DropdownMenuItem>
                </>
              )}
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
                  style={{ width: `${Math.min(100, (board.tasks_count || 0) * 10)}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {Math.min(100, (board.tasks_count || 0) * 10)}%
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

          {/* Enhanced Creator Info with Status Date */}
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
            
            {/* Status Date */}
            <div className="text-right">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {type === 'archived' ? 'Archived' : 
                   type === 'deleted' ? 'Deleted' : 'Created'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {type === 'archived' && board.archived_at
                  ? new Date(board.archived_at).toLocaleDateString()
                  : type === 'deleted' && board.deleted_at
                  ? new Date(board.deleted_at).toLocaleDateString()
                  : new Date(board.created_at).toLocaleDateString()
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                All Boards 📋
              </h1>
              <p className="text-gray-600 text-lg">Manage all your boards in one place</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={currentLoading}
              className="bg-white/80 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${currentLoading ? "animate-spin" : ""}`} />
              {currentLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <CreateBoardModal onBoardCreated={handleBoardCreated} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white font-medium transition-all duration-200"
            >
              <Folder className="h-4 w-4 mr-2" />
              Active ({activeBoardsData?.data?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="archived"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white font-medium transition-all duration-200"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archived ({archivedBoardsData?.data?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="deleted"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-medium transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deleted ({deletedBoardsData?.data?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-8">
            {currentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
            ) : currentError ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-lg p-8 text-center">
                <div className="text-red-500 mb-4">
                  <Folder className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load active boards</h3>
                <p className="text-gray-600 mb-4">There was an error loading your active boards. Please try again.</p>
                <Button 
                  onClick={handleRefresh} 
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Again
                </Button>
              </Card>
            ) : currentBoards.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <Sparkles className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No active boards yet! 🚀</h3>
                <p className="text-gray-600 mb-6 text-lg">Create your first board to start organizing your tasks with style!</p>
                <CreateBoardModal onBoardCreated={handleBoardCreated} />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBoards.map((board: any) => (
                  <BoardCard key={board.id} board={board} type="active" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-8">
            {currentLoading ? (
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
            ) : currentError ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200 shadow-lg p-8 text-center">
                <div className="text-orange-500 mb-4">
                  <Archive className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load archived boards</h3>
                <p className="text-gray-600 mb-4">There was an error loading your archived boards. Please try again.</p>
                <Button 
                  onClick={handleRefresh} 
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Again
                </Button>
              </Card>
            ) : currentBoards.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <Archive className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No archived boards 📦</h3>
                <p className="text-gray-600 mb-6 text-lg">Boards you archive will appear here for easy access later.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBoards.map((board: any) => (
                  <BoardCard key={board.id} board={board} type="archived" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deleted" className="mt-8">
            {currentLoading ? (
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
            ) : currentError ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-lg p-8 text-center">
                <div className="text-red-500 mb-4">
                  <Trash2 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load deleted boards</h3>
                <p className="text-gray-600 mb-4">There was an error loading your deleted boards. Please try again.</p>
                <Button 
                  onClick={handleRefresh} 
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try Again
                </Button>
              </Card>
            ) : currentBoards.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-lg p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <Trash2 className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No deleted boards 🗑️</h3>
                <p className="text-gray-600 mb-6 text-lg">Deleted boards will appear here and can be restored within 30 days.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBoards.map((board: any) => (
                  <BoardCard key={board.id} board={board} type="deleted" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

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

      {restoreBoard && (
        <RestoreBoardModal
          board={restoreBoard}
          isOpen={!!restoreBoard}
          onClose={() => setRestoreBoard(null)}
          onConfirm={() => restoreBoardMutation.mutate(restoreBoard.id)}
          isLoading={restoreBoardMutation.isLoading}
        />
      )}

      {archiveBoard && (
        <ArchiveBoardModal
          board={archiveBoard}
          isOpen={!!archiveBoard}
          onClose={() => setArchiveBoard(null)}
          onConfirm={() => archiveBoardMutation.mutate(archiveBoard.id)}
          isLoading={archiveBoardMutation.isLoading}
        />
      )}
    </div>
  )
}

export default BoardsPage
