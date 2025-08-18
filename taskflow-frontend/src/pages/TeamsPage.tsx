"use client"

import type React from "react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Header } from "../components/Header"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { boardsAPI, tasksAPI } from "../services/api"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Textarea } from "../components/ui/textarea"
import { TeamModal } from "../components/TeamModal"
import { teamsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"
import { Plus, Users, Settings, Crown, Sparkles, Target, TrendingUp, Eye, Edit, UserPlus, ExternalLink } from "lucide-react"

interface Team {
  id: string
  name: string
  description: string
  members: Array<{
    id: string
    name: string
    role: "admin" | "member"
    avatar: string
  }>
  boards: number
  tasks: number
  owner: {
    id: string
    name: string
  }
  createdAt: string
  color?: string
}

const TeamsPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newTeam, setNewTeam] = useState({ name: "", description: "" })

  // Fetch teams
  const { data: teams, isLoading } = useQuery(
    "teams",
    teamsAPI.getTeams,
    {
      // Make team membership changes propagate faster across tabs/sessions
      staleTime: 10 * 1000, // 10s
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 30 * 1000, // poll every 30s to catch remote updates
    }
  )

  // Create team mutation
  const createTeamMutation = useMutation(teamsAPI.createTeam, {
    onSuccess: () => {
      queryClient.invalidateQueries("teams")
      setIsCreateModalOpen(false)
      setNewTeam({ name: "", description: "" })
      toast({
        title: "Success",
        description: "Team created successfully! 🎉",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      })
    },
  })

  // Navigate to team boards
  const handleViewBoards = (teamId: string) => {
    window.location.href = `/boards?team=${teamId}`
  }

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

  // Handle team invitation
  const handleInviteMember = async (teamId: string) => {
    const email = prompt("Enter the email address of the person you want to invite:")
    if (!email) return

    try {
      await teamsAPI.inviteMember(teamId, email, "member")
      toast({
        title: "Success",
        description: "Invitation sent successfully! 📧",
      })
      queryClient.invalidateQueries("teams")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeam.name.trim()) return

    createTeamMutation.mutate(newTeam)
  }

  // Use actual teams data or empty array
  const allBoards = allBoardsData?.data || []

  // Calculate stats
  const actualTeams = teams?.data || []
  const totalTeams = actualTeams.length
  const totalMembers = actualTeams.reduce((acc: number, team: any) => acc + (team.members?.length || 0), 0)
  const totalBoards = allBoards.length
  const totalTasks = allBoards.reduce((acc: number, board: any) => acc + (board.tasks_count || 0), 0)
  
  const getTeamColorConfig = (color?: string) => {
    switch (color) {
      case "blue":
        return {
          gradient: "from-blue-500 to-cyan-500",
          bg: "from-blue-50 to-cyan-50",
          border: "border-blue-200",
          text: "text-blue-600",
        }
      case "purple":
        return {
          gradient: "from-purple-500 to-pink-500",
          bg: "from-purple-50 to-pink-50",
          border: "border-purple-200",
          text: "text-purple-600",
        }
      case "green":
        return {
          gradient: "from-green-500 to-emerald-500",
          bg: "from-green-50 to-emerald-50",
          border: "border-green-200",
          text: "text-green-600",
        }
      default:
        return {
          gradient: "from-gray-500 to-slate-500",
          bg: "from-gray-50 to-slate-50",
          border: "border-gray-200",
          text: "text-gray-600",
        }
    }
  }

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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Teams
                </h1>
                <p className="text-gray-600 text-lg">Manage your teams and collaborate with members across projects</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Active Teams</div>
                  <div className="text-2xl font-bold text-blue-600">{totalTeams}</div>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      data-create-team-button
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Create New Team
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam} className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Team Name</label>
                        <Input
                          value={newTeam.name}
                          onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                          placeholder="Enter team name"
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Description</label>
                        <Textarea
                          value={newTeam.description}
                          onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                          placeholder="Enter team description"
                          rows={3}
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateModalOpen(false)}
                          className="border-2 border-gray-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createTeamMutation.isLoading}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {createTeamMutation.isLoading ? "Creating..." : "Create Team"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Teams</p>
                    <p className="text-2xl font-bold">{totalTeams}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Team Members</p>
                    <p className="text-2xl font-bold">{totalMembers}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Active Boards</p>
                    <p className="text-2xl font-bold">{totalBoards}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Total Tasks</p>
                    <p className="text-2xl font-bold">{totalTasks}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-yellow-200" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <span>
                  Role: <span className="font-semibold capitalize text-blue-600">{user?.role}</span>
                </span>
                <span>•</span>
                <span>
                  Teams you own:{" "}
                  <span className="font-medium text-purple-600">
                    {actualTeams.filter((team: any) => team.owner?.id === user?.id).length}
                  </span>
                </span>
              </div>
              <div className="text-right">
                <span>
                  Last updated: <span className="font-medium">Just now</span>
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse bg-white/50 backdrop-blur-sm border-2 border-gray-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex space-x-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : actualTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actualTeams.map((team: any) => {
                const colorConfig = getTeamColorConfig(team.color)
                const userMember = (team.members || []).find((m: any) => m.id === user?.id)
                const canManage = team.owner?.id === user?.id || userMember?.role === "admin"
                return (
                  <Card
                    key={team.id}
                    className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 relative overflow-hidden cursor-pointer"
                    onClick={() => setSelectedTeam(team)}
                  >
                    {/* Background decoration */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorConfig.bg} rounded-full -translate-y-16 translate-x-16 opacity-50`}
                    ></div>
                    <div
                      className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${colorConfig.bg} rounded-full translate-y-12 -translate-x-12 opacity-30`}
                    ></div>

                    <CardContent className="p-6 relative z-10">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {team.name}
                              </h3>
                              {team.owner?.id === user?.id && (
                                <span title="You own this team">
                                  <Crown className="h-5 w-5 text-yellow-500" />
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{team.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTeam(team)
                            }}
                            disabled={!canManage}
                            title={!canManage ? "View-only: you can't manage this team" : undefined}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-3 gap-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{team.members?.length || 0}</div>
                            <div className="text-xs text-gray-600">Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{team.boards || 0}</div>
                            <div className="text-xs text-gray-600">Boards</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{team.tasks || 0}</div>
                            <div className="text-xs text-gray-600">Tasks</div>
                          </div>
                        </div>

                        {/* Team Members */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-800">Members</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInviteMember(team.id)
                              }}
                              disabled={!canManage}
                              title={!canManage ? "Only admins or the owner can invite" : undefined}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Invite
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            {(team.members || []).slice(0, 4).map((member: any) => (
                              <div key={member.id} className="relative">
                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold">
                                    {member.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {member.role === "admin" && (
                                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border-2 border-white flex items-center justify-center">
                                    <Crown className="h-2 w-2 text-white" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {(team.members?.length || 0) > 4 && (
                              <div className="h-10 w-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="text-xs font-bold text-gray-600">
                                  +{(team.members?.length || 0) - 4}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Member Roles */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {(team.members || []).slice(0, 3).map((member: any) => (
                              <Badge
                                key={member.id}
                                variant="secondary"
                                className={`text-xs ${member.role === "admin" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}
                              >
                                {member.name.split(" ")[0]}
                                {member.role === "admin" && " 👑"}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/50 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewBoards(team.id)
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Boards
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/50 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTeam(team)
                            }}
                            title={!canManage ? "Open to view; changes disabled" : undefined}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No teams yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first team to start collaborating with others and managing projects together!
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  data-create-team-button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onUpdate={(updatedTeam) => {
            // Handle team update
            setSelectedTeam(null)
          }}
        />
      )}
    </div>
  )
}

export default TeamsPage
