"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "react-query"
import {
  Users,
  Plus,
  Crown,
  Settings,
  UserPlus,
  UserMinus,
  Trash2,
  ExternalLink,
  X,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { Collapsible, CollapsibleContent } from "./ui/collapsible"
import { boardsAPI, teamsAPI } from "../services/api"
import logger from "../lib/logger"
import { useToast } from "../hooks/use-toast"

interface TeamMember {
  id: string
  name: string
  role: "admin" | "member" | "viewer"
  avatar: string
  email?: string
}

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
  boards: number
  tasks: number
  owner: {
    id: string
    name: string
  }
  createdAt: string
  color?: string
}

interface TeamSidebarProps {
  isOpen: boolean
  onToggle: () => void
  boardId: string
  availableTeams: Team[]
  currentBoardTeams: Team[]
  user: any
  onTeamUpdate: () => void
}

export function TeamSidebar({
  isOpen,
  onToggle,
  boardId,
  availableTeams,
  currentBoardTeams,
  user,
  onTeamUpdate,
}: TeamSidebarProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Sync selectedTeam with updated team data from props
  useEffect(() => {
    if (selectedTeam) {
      // Find the updated team data from either availableTeams or currentBoardTeams
      const updatedTeam = 
        [...availableTeams, ...currentBoardTeams].find(team => team.id === selectedTeam.id)
      
      if (updatedTeam && JSON.stringify(updatedTeam) !== JSON.stringify(selectedTeam)) {
        logger.log('Updating selectedTeam with fresh data from props:', updatedTeam)
        setSelectedTeam(updatedTeam)
      }
    }
  }, [availableTeams, currentBoardTeams, selectedTeam])

  // Helper function to get the most up-to-date team data
  const getLatestTeamData = (teamId: string): Team | undefined => {
    // First check if this team is the selectedTeam and has been updated
    if (selectedTeam && selectedTeam.id === teamId) {
      return selectedTeam
    }
    
    // Otherwise, get from the props
    return [...availableTeams, ...currentBoardTeams].find(team => team.id === teamId)
  }

  // Add team to board mutation
  const addTeamToBoardMutation = useMutation(
    async (teamId: string) => {
      return await boardsAPI.addTeamToBoard(boardId, teamId)
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Team added to board successfully! 🎉",
        })
        onTeamUpdate()
        setIsAddTeamModalOpen(false)
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to add team to board",
          variant: "destructive",
        })
      },
    },
  )

  // Remove team from board mutation
  const removeTeamFromBoardMutation = useMutation(
    async (teamId: string) => {
      return await boardsAPI.removeTeamFromBoard(boardId, teamId)
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Team removed from board successfully",
        })
        onTeamUpdate()
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to remove team from board",
          variant: "destructive",
        })
      },
    },
  )

  // Invite member to team mutation
  const inviteMemberMutation = useMutation(
    async ({ teamId, email, role }: { teamId: string; email: string; role: string }) => {
      return await teamsAPI.inviteMember(teamId, email, role)
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Invitation sent successfully! 📧",
        })
        setNewMemberEmail("")
        setNewMemberRole("member")
        onTeamUpdate()
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to send invitation",
          variant: "destructive",
        })
      },
    },
  )

  // Remove member from team mutation
  const removeMemberMutation = useMutation(
    async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return await teamsAPI.removeMember(teamId, userId)
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Member removed successfully",
        })
        onTeamUpdate()
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to remove member",
          variant: "destructive",
        })
      },
    },
  )

  // Update member role mutation
  const updateMemberRoleMutation = useMutation(
    async ({ teamId, userId, role }: { teamId: string; userId: string; role: string }) => {
      return await teamsAPI.updateMemberRole(teamId, userId, role)
    },
    {
      onSuccess: (data, variables) => {
        // Immediately update selectedTeam if it's the team being modified
        if (selectedTeam && selectedTeam.id === variables.teamId) {
          const updatedSelectedTeam = {
            ...selectedTeam,
            members: selectedTeam.members.map(member =>
              member.id === variables.userId
                ? { ...member, role: variables.role as any }
                : member
            )
          }
          logger.log("Immediately updating selectedTeam with new role:", updatedSelectedTeam)
          setSelectedTeam(updatedSelectedTeam)
        }

        toast({
          title: "Success",
          description: "Member role updated successfully",
        })
  logger.log("Role update successful, invalidating all team caches...")
        // Invalidate all team-related caches aggressively
        queryClient.invalidateQueries({ queryKey: ["teams"] })
        queryClient.invalidateQueries({ queryKey: ["user-teams"] })
        queryClient.invalidateQueries({ queryKey: ["board-teams"] })
        // Force a complete refetch
        queryClient.refetchQueries({ queryKey: ["teams"] })
        queryClient.refetchQueries({ queryKey: ["board-teams", boardId] })
        onTeamUpdate()
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update member role",
          variant: "destructive",
        })
      },
    },
  )

  const handleAddTeamToBoard = (teamId: string) => {
    addTeamToBoardMutation.mutate(teamId)
  }

  const handleRemoveTeamFromBoard = (teamId: string) => {
    if (window.confirm("Are you sure you want to remove this team from the board?")) {
      removeTeamFromBoardMutation.mutate(teamId)
    }
  }

  const handleInviteMember = (teamId: string) => {
    if (!newMemberEmail.trim()) return

    inviteMemberMutation.mutate({
      teamId,
      email: newMemberEmail,
      role: newMemberRole,
    })
  }

  const handleRemoveMember = (teamId: string, memberId: string) => {
    if (window.confirm("Are you sure you want to remove this member from the team?")) {
      removeMemberMutation.mutate({
        teamId,
        userId: memberId,
      })
    }
  }

  const handleUpdateMemberRole = (teamId: string, memberId: string, newRole: string) => {
    updateMemberRoleMutation.mutate({
      teamId,
      userId: memberId,
      role: newRole,
    })
  }

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  // Permission helper functions
  const getUserRoleInTeam = (team: Team, userId: string): string | null => {
    if (team.owner?.id === userId) return 'owner'
    const member = team.members?.find(m => m.id === userId)
    return member?.role || null
  }

  const canUserManageTeam = (team: Team, userId: string): boolean => {
    const role = getUserRoleInTeam(team, userId)
    return role === 'owner' || role === 'admin'
  }

  const canUserEditTasks = (team: Team, userId: string): boolean => {
    const role = getUserRoleInTeam(team, userId)
    return role === 'owner' || role === 'admin' || role === 'member'
  }

  const canUserCreateBoards = (team: Team, userId: string): boolean => {
    const role = getUserRoleInTeam(team, userId)
    return role === 'owner' || role === 'admin' || role === 'member'
  }

  const isViewerOnly = (team: Team, userId: string): boolean => {
    const role = getUserRoleInTeam(team, userId)
    return role === 'viewer'
  }

  const getRoleDisplayInfo = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: 'bg-yellow-100 text-yellow-800', icon: '👑' }
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: '⚡' }
      case 'member':
        return { label: 'Member', color: 'bg-blue-100 text-blue-800', icon: '👤' }
      case 'viewer':
        return { label: 'Viewer', color: 'bg-gray-100 text-gray-800', icon: '👁️' }
      default:
        return { label: role, color: 'bg-gray-100 text-gray-800', icon: '?' }
    }
  }

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

  // Teams that can be added (not already on the board)
  const teamsToAdd = availableTeams.filter((team) => !currentBoardTeams.some((boardTeam) => boardTeam.id === team.id))

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm border-r-2 border-purple-200 shadow-2xl transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Team Management
              </h2>
              <Button variant="ghost" size="sm" onClick={onToggle} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm">Manage teams for this board</p>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Add Team Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Add Teams</h3>
                  <Dialog open={isAddTeamModalOpen} onOpenChange={setIsAddTeamModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        disabled={teamsToAdd.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gradient-to-br from-white via-purple-50 to-pink-50 border-2 border-purple-200">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Add Team to Board
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {teamsToAdd.length > 0 ? (
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {teamsToAdd.map((team) => {
                              const colorConfig = getTeamColorConfig(team.color)
                              return (
                                <div
                                  key={team.id}
                                  className={`p-3 bg-gradient-to-r ${colorConfig.bg} border ${colorConfig.border} rounded-lg flex items-center justify-between`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-gray-600" />
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">{team.name}</p>
                                      <p className="text-xs text-gray-600">{team.members.length} members</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddTeamToBoard(team.id)}
                                    disabled={addTeamToBoardMutation.isLoading}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs"
                                  >
                                    Add
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No teams available to add</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {teamsToAdd.length > 0 && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                    {teamsToAdd.length} team{teamsToAdd.length !== 1 ? "s" : ""} available to add
                  </div>
                )}
              </div>

              <Separator />

              {/* Current Board Teams */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Board Teams ({currentBoardTeams.length})</h3>

                {currentBoardTeams.length > 0 ? (
                  <div className="space-y-3">
                    {currentBoardTeams.map((originalTeam) => {
                      // Get the latest team data (updated roles if available)
                      const team = getLatestTeamData(originalTeam.id) || originalTeam
                      const colorConfig = getTeamColorConfig(team.color)
                      const userCanManage =
                        team.owner?.id === user?.id ||
                        team.members?.some((member) => member.id === user?.id && member.role === "admin")
                      const isExpanded = expandedTeams.has(team.id)
                      const userRole = getUserRoleInTeam(team, user?.id || '')
                      const canManageThisTeam = canUserManageTeam(team, user?.id || '')
                      const isUserViewer = isViewerOnly(team, user?.id || '')

                      return (
                        <Card key={team.id} className="bg-white/80 backdrop-blur-sm border border-gray-200">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`p-1 bg-gradient-to-r ${colorConfig.bg} rounded`}>
                                  <Users className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                                    <span>{team.name}</span>
                                    {team.owner?.id === user?.id && <Crown className="h-3 w-3 text-yellow-500" />}
                                  </CardTitle>
                                  <p className="text-xs text-gray-600">{team.members.length} members</p>
                                </div>
                              </div>

                                <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleTeamExpansion(team.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                                {canManageThisTeam && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTeamFromBoard(team.id)}
                                    className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                                    title="Remove team from board"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                                {/* Show user's permission level */}
                                {userRole && (
                                  <div className="text-xs text-gray-500 ml-1" title={`Your role: ${userRole}`}>
                                    {getRoleDisplayInfo(userRole).icon}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <Collapsible open={isExpanded}>
                            <CollapsibleContent>
                              <CardContent className="pt-0 space-y-3">
                                {/* Team Members */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-700">Members</span>
                                    {canManageThisTeam && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedTeam(team)}
                                        className="h-5 text-xs text-blue-600 hover:bg-blue-50 p-1"
                                      >
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        Invite
                                      </Button>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    {team.members.slice(0, 3).map((member) => {
                                      const memberRole = member.id === team.owner?.id ? 'owner' : member.role
                                      const roleInfo = getRoleDisplayInfo(memberRole)
                                      
                                      // Debug logging for sidebar display
                                      logger.log(`[SIDEBAR] Member ${member.name} (ID: ${member.id}) - Role: ${member.role}, Display: ${memberRole}`)
                                      
                                      return (
                                        <div
                                          key={member.id}
                                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                                {member.name
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <div className="flex items-center space-x-1">
                                                <p className="text-xs font-medium text-gray-900">{member.name}</p>
                                                {member.id === team.owner?.id && <Crown className="h-3 w-3 text-yellow-500" />}
                                              </div>
                                              <Badge
                                                variant="secondary"
                                                className={`text-xs ${roleInfo.color} flex items-center space-x-1`}
                                              >
                                                <span>{roleInfo.icon}</span>
                                                <span>{roleInfo.label}</span>
                                              </Badge>
                                            </div>
                                          </div>
                                          {/* Show permission level indicator */}
                                          <div className="text-xs text-gray-500">
                                            {memberRole === 'viewer' && '👁️'}
                                            {memberRole === 'member' && '✏️'}
                                            {(memberRole === 'admin' || memberRole === 'owner') && '⚙️'}
                                          </div>
                                        </div>
                                      )
                                    })}

                                    {team.members.length > 3 && (
                                      <div className="text-xs text-gray-500 text-center">
                                        +{team.members.length - 3} more members
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs bg-white/50 border border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => (window.location.href = `/teams/${team.id}`)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Team
                                  </Button>
                                  {canManageThisTeam && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 text-xs bg-white/50 border border-purple-200 text-purple-600 hover:bg-purple-50"
                                      onClick={() => setSelectedTeam(team)}
                                    >
                                      <Settings className="h-3 w-3 mr-1" />
                                      Manage
                                    </Button>
                                  )}
                                  {isUserViewer && (
                                    <div className="flex-1 text-xs text-gray-500 text-center py-2">
                                      👁️ View Only Access
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No teams added to this board</p>
                    <p className="text-gray-400 text-xs">Add teams to enable collaboration</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={onToggle} />}

                {/* Team Management Modal */}
      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-2xl h-[70vh] flex flex-col bg-gradient-to-br from-white via-purple-50 to-pink-50 border-2 border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>Manage {selectedTeam.name}</span>
                <div className="text-sm font-normal text-gray-600 ml-2">
                  (Your role: {getRoleDisplayInfo(getUserRoleInTeam(selectedTeam, user?.id || '') || '').label})
                </div>
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="space-y-6 p-1">
                {canUserManageTeam(selectedTeam, user?.id || '') && (
                  <>
                    {/* Invite New Member */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">Invite New Member</h3>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter email address"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="flex-1 bg-white border border-gray-200 focus:border-purple-500 text-sm"
                        />
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger className="w-28 bg-white border border-gray-200 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">👁️ Viewer</SelectItem>
                            <SelectItem value="member">👤 Member</SelectItem>
                            <SelectItem value="admin">⚡ Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => handleInviteMember(selectedTeam.id)}
                          disabled={inviteMemberMutation.isLoading}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {inviteMemberMutation.isLoading ? "..." : "Invite"}
                        </Button>
                      </div>
                      
                      {/* Permission explanation */}
                      <div className="mt-3 text-xs text-gray-600 bg-white/50 p-2 rounded">
                        <p><strong>Roles explained:</strong></p>
                        <p>👁️ <strong>Viewer:</strong> Can only view boards and tasks</p>
                        <p>👤 <strong>Member:</strong> Can create, edit, and manage tasks and boards</p>
                        <p>⚡ <strong>Admin:</strong> Full team management + all member permissions</p>
                      </div>
                    </div>
                  </>
                )}
                
                {!canUserManageTeam(selectedTeam, user?.id || '') && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      👁️ You have {getRoleDisplayInfo(getUserRoleInTeam(selectedTeam, user?.id || '') || '').label.toLowerCase()} access to this team.
                      {isViewerOnly(selectedTeam, user?.id || '') && " You can view content but cannot make changes."}
                    </p>
                  </div>
                )}

                {/* Members List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800">Team Members ({selectedTeam.members.length})</h3>
                  {selectedTeam.members.map((member) => {
                    const memberRole = member.id === selectedTeam.owner?.id ? 'owner' : member.role
                    const roleInfo = getRoleDisplayInfo(memberRole)
                    const canManageMember = canUserManageTeam(selectedTeam, user?.id || '') && 
                                          selectedTeam.owner?.id !== member.id
                    
                    // Debug logging
                    logger.log(`Member ${member.name} (ID: ${member.id}) - Role: ${member.role}, Display: ${memberRole}`)
                    
                    return (
                      <div
                        key={member.id}
                        className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              {member.id === selectedTeam.owner?.id && <Crown className="h-3 w-3 text-yellow-500" />}
                              <Badge className={`text-xs ${roleInfo.color} flex items-center space-x-1`}>
                                <span>{roleInfo.icon}</span>
                                <span>{roleInfo.label}</span>
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {member.email || `${member.name.toLowerCase().replace(" ", ".")}@example.com`}
                            </p>
                            {/* Show permissions for this role */}
                            <div className="text-xs text-gray-500 mt-1">
                              {memberRole === 'viewer' && "Can view boards and tasks"}
                              {memberRole === 'member' && "Can create and edit tasks & boards"}
                              {memberRole === 'admin' && "Full team management access"}
                              {memberRole === 'owner' && "Team owner - full control"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canManageMember ? (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => handleUpdateMemberRole(selectedTeam.id, member.id, newRole)}
                                disabled={updateMemberRoleMutation.isLoading}
                              >
                                <SelectTrigger className="w-24 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">👁️ Viewer</SelectItem>
                                  <SelectItem value="member">👤 Member</SelectItem>
                                  <SelectItem value="admin">⚡ Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                                disabled={removeMemberMutation.isLoading}
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-xs text-gray-400 px-2">
                              {member.id === selectedTeam.owner?.id ? "Owner" : "No permission to modify"}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
