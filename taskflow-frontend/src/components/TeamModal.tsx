"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Users, Settings, Crown, Mail, Calendar, Target, Sparkles, Send, X, Save, UserPlus, UserMinus, Shield, Trash2, Edit, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface TeamMember {
  id: string
  name: string
  role: "admin" | "member"
  avatar: string
  email?: string
  joinedAt?: string
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

interface TeamModalProps {
  team: Team
  isOpen: boolean
  onClose: () => void
  onUpdate: (team: Team) => void
}

export function TeamModal({ team, isOpen, onClose, onUpdate }: TeamModalProps) {
  const [editedTeam, setEditedTeam] = useState<Team>(team)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    setEditedTeam(team)
  }, [team])

  const handleSave = () => {
    onUpdate(editedTeam)
    onClose()
  }

  const getTeamColorConfig = (color?: string) => {
    switch (color) {
      case "blue":
        return {
          gradient: "from-blue-500 to-cyan-500",
          bg: "from-blue-50 to-cyan-50",
          border: "border-blue-200",
          text: "text-blue-600"
        }
      case "purple":
        return {
          gradient: "from-purple-500 to-pink-500",
          bg: "from-purple-50 to-pink-50",
          border: "border-purple-200",
          text: "text-purple-600"
        }
      case "green":
        return {
          gradient: "from-green-500 to-emerald-500",
          bg: "from-green-50 to-emerald-50",
          border: "border-green-200",
          text: "text-green-600"
        }
      default:
        return {
          gradient: "from-gray-500 to-slate-500",
          bg: "from-gray-50 to-slate-50",
          border: "border-gray-200",
          text: "text-gray-600"
        }
    }
  }

  const colorConfig = getTeamColorConfig(editedTeam.color)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-0">
          <div className={`p-4 -m-6 mb-4 bg-gradient-to-r ${colorConfig.bg} border-b-2 ${colorConfig.border} relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <DialogTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-800">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>
                <span>{editedTeam.name}</span>
                <Crown className="h-6 w-6 text-yellow-500" />
              </DialogTitle>
              <p className="text-gray-600 mt-2">{editedTeam.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Team Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Team Members</p>
                        <p className="text-2xl font-bold">{editedTeam.members.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Active Boards</p>
                        <p className="text-2xl font-bold">{editedTeam.boards}</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Tasks</p>
                        <p className="text-2xl font-bold">{editedTeam.tasks}</p>
                      </div>
                      <Sparkles className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                </div>

                {/* Team Description */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">About This Team</h3>
                  <p className="text-gray-600 leading-relaxed">{editedTeam.description}</p>
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(editedTeam.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Crown className="h-4 w-4" />
                      <span>Owned by {editedTeam.owner.name}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Members */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Team Members</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editedTeam.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            {member.role === "admin" && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={member.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-6 mt-0">
                {/* Invite New Member */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Invite New Member</h3>
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="flex-1 bg-white border-2 border-gray-200 focus:border-blue-500"
                    />
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Send className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-4">
                  {editedTeam.members.map((member) => (
                    <div key={member.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            {member.role === "admin" && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{member.email || `${member.name.toLowerCase().replace(' ', '.')}@example.com`}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select value={member.role}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                {/* Team Settings */}
                <div className="space-y-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Team Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Team Name</label>
                        <Input
                          value={editedTeam.name}
                          onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                          className="bg-white border-2 border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Description</label>
                        <Textarea
                          value={editedTeam.description}
                          onChange={(e) => setEditedTeam({ ...editedTeam, description: e.target.value })}
                          rows={3}
                          className="bg-white border-2 border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Team Color</label>
                        <Select 
                          value={editedTeam.color} 
                          onValueChange={(value) => setEditedTeam({ ...editedTeam, color: value })}
                        >
                          <SelectTrigger className="bg-white border-2 border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
                    <h3 className="text-lg font-bold text-red-800 mb-4">Danger Zone</h3>
                    <div className="space-y-3">
                      <p className="text-red-600 text-sm">
                        Once you delete a team, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive" className="bg-gradient-to-r from-red-600 to-pink-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <UserPlus className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Alice Johnson joined the team</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">New board "Project Alpha" created</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="p-2 bg-purple-500 rounded-full">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Team settings updated</p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
