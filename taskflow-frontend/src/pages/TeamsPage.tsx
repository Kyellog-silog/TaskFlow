"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { Header } from "../components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Textarea } from "../components/ui/textarea"
import { teamsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../contexts/AuthContext"
import { Plus, Users, Settings, Crown, Mail } from "lucide-react"

const TeamsPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: "", description: "" })

  // Fetch teams
  const { data: teams, isLoading } = useQuery("teams", teamsAPI.getTeams)

  // Create team mutation
  const createTeamMutation = useMutation(teamsAPI.createTeam, {
    onSuccess: () => {
      queryClient.invalidateQueries("teams")
      setIsCreateModalOpen(false)
      setNewTeam({ name: "", description: "" })
      toast({
        title: "Success",
        description: "Team created successfully",
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

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeam.name.trim()) return

    createTeamMutation.mutate(newTeam)
  }

  const mockTeams = [
    {
      id: "1",
      name: "Development Team",
      description: "Main development team for TaskFlow application",
      members: [
        { id: "1", name: "Alice Johnson", role: "admin", avatar: "/placeholder.svg?height=32&width=32" },
        { id: "2", name: "Bob Smith", role: "member", avatar: "/placeholder.svg?height=32&width=32" },
        { id: "3", name: "Carol Davis", role: "member", avatar: "/placeholder.svg?height=32&width=32" },
      ],
      boards: 3,
      tasks: 24,
      owner: { id: "1", name: "Alice Johnson" },
    },
    {
      id: "2",
      name: "Design Team",
      description: "UI/UX design and creative team",
      members: [
        { id: "4", name: "David Wilson", role: "admin", avatar: "/placeholder.svg?height=32&width=32" },
        { id: "5", name: "Eva Brown", role: "member", avatar: "/placeholder.svg?height=32&width=32" },
      ],
      boards: 2,
      tasks: 12,
      owner: { id: "4", name: "David Wilson" },
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
            <p className="text-gray-600">Manage your teams and collaborate with members</p>
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Team Name</label>
                  <Input
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Enter team description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTeamMutation.isLoading}>
                    {createTeamMutation.isLoading ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTeams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{team.name}</span>
                        {team.owner.id === user?.id && (
                          <span title="You own this team">
                            <Crown className="h-4 w-4 text-yellow-500" />
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{team.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Team Stats */}
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{team.members.length} members</span>
                      </div>
                      <div className="flex space-x-4">
                        <span>{team.boards} boards</span>
                        <span>{team.tasks} tasks</span>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Members</span>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-3 w-3 mr-1" />
                          Invite
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {team.members.slice(0, 4).map((member) => (
                          <div key={member.id} className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {member.role === "admin" && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full border border-white"></div>
                            )}
                          </div>
                        ))}
                        {team.members.length > 4 && (
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{team.members.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Roles */}
                    <div className="flex flex-wrap gap-1">
                      {team.members.slice(0, 3).map((member) => (
                        <Badge key={member.id} variant="secondary" className="text-xs">
                          {member.name.split(" ")[0]} ({member.role})
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        View Boards
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!teams?.data || teams.data.length === 0) && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-4">Create your first team to start collaborating with others.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default TeamsPage
