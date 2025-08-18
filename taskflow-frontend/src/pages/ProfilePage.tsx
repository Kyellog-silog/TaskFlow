"use client"

import { useState, useEffect } from "react"
import { useQuery } from "react-query"
import { API_BASE_URL, authAPI } from "../services/api"
import { Header } from "../components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../hooks/use-toast"
import { User, Edit, Save, Camera, Award, Target, TrendingUp, Clock, Sparkles } from "lucide-react"

const ProfilePage = () => {
  const { user, updateProfile, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    phone: user?.phone || "",
    website: user?.website || "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avatar upload handler
  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await authAPI.uploadAvatar(file)
      await refreshUser()
      toast({ title: "Avatar updated" })
    } catch (err) {
      toast({ title: "Upload failed", variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    try {
      await updateProfile(profileData)
      setIsEditing(false)
      toast({
        title: "Profile Updated! ✨",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Load stats from backend
  const { data: statsResp } = useQuery({
    queryKey: ['profile','stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/profile/stats`, { credentials: 'include' })
      return res.json()
    },
    staleTime: 60_000,
  })
  const stats = statsResp?.data || { tasksCompleted: 0, projectsActive: 0, teamCollaborations: 0, hoursWorked: 0 }

  // Achievements from backend
  const { data: achievementsResp } = useQuery({
    queryKey: ['profile','achievements'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/profile/achievements`, { credentials: 'include' })
      return res.json()
    },
    staleTime: 60_000,
  })
  const achievements = achievementsResp?.data || []

  const { data: activityResp } = useQuery({
    queryKey: ['profile','activity'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/profile/activity?limit=10`, { credentials: 'include' })
      return res.json()
    },
    staleTime: 30_000,
  })
  const recentActivity = (activityResp?.data || []).map((a: any) => ({
    id: a.id,
    action: a.action,
    item: a.task?.title || a.description,
    time: new Date(a.created_at).toLocaleString(),
    type: a.action === 'completed' ? 'completed' : a.action === 'created' ? 'created' : a.action === 'updated' ? 'updated' : 'joined',
  }))

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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div
              className={`mb-8 transform transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Profile Settings
              </h1>
              <p className="text-gray-600 text-lg">Manage your account and track your productivity journey</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Profile Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                        <User className="h-6 w-6 text-blue-500" />
                        <span>Personal Information</span>
                      </CardTitle>
                      <Button
                        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                        className={`${
                          isEditing
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        } text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                      >
                        {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                        {isEditing ? "Save Changes" : "Edit Profile"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                          <label className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center justify-center cursor-pointer">
                            <Camera className="h-4 w-4 text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                          </label>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                        <p className="text-gray-600">{user?.email}</p>
                        <Badge className="mt-2 bg-blue-100 text-blue-700">
                          <Award className="h-3 w-3 mr-1" />
                          {user?.role || "Member"}
                        </Badge>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Full Name</label>
                        <Input
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          disabled={!isEditing}
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Email</label>
                        <Input
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled={!isEditing}
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Location</label>
                        <Input
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          disabled={!isEditing}
                          placeholder="City, Country"
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Phone</label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          disabled={!isEditing}
                          placeholder="+1 (555) 123-4567"
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Website</label>
                        <Input
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          disabled={!isEditing}
                          placeholder="https://yourwebsite.com"
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-bold text-gray-800 mb-2 block">Bio</label>
                        <Textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="bg-white border-2 border-gray-200 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Dashboard */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                      <span>Productivity Stats</span>
                    </CardTitle>
                    <CardDescription>Your performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{stats.tasksCompleted}</div>
                        <div className="text-sm text-gray-600">Tasks Completed</div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">{stats.projectsActive}</div>
                        <div className="text-sm text-gray-600">Active Projects</div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: "60%" }}></div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                        <div className="text-2xl font-bold text-green-600">{stats.teamCollaborations}</div>
                        <div className="text-sm text-gray-600">Team Collaborations</div>
                        <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{stats.hoursWorked}</div>
                        <div className="text-sm text-gray-600">Hours Worked</div>
                        <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "90%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Achievements */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <span>Achievements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {achievements.map((achievement: any) => (
                      <div
                        key={achievement.id}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          achievement.earned
                            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                            : "bg-gray-50 border-gray-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">{achievement.title}</h4>
                            <p className="text-xs text-gray-600">{achievement.description}</p>
                            {achievement.target && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                  className="bg-yellow-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, Math.round((achievement.progress/achievement.target)*100))}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {achievement.earned && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Earned</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentActivity.map((activity: any) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === "completed"
                              ? "bg-green-100"
                              : activity.type === "joined"
                                ? "bg-blue-100"
                                : activity.type === "created"
                                  ? "bg-purple-100"
                                  : "bg-yellow-100"
                          }`}
                        >
                          {activity.type === "completed" && <Target className="h-4 w-4 text-green-600" />}
                          {activity.type === "joined" && <User className="h-4 w-4 text-blue-600" />}
                          {activity.type === "created" && <Sparkles className="h-4 w-4 text-purple-600" />}
                          {activity.type === "updated" && <Edit className="h-4 w-4 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action} <span className="font-bold">{activity.item}</span>
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/50 border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => (window.location.href = "/dashboard")}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/50 border-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                      onClick={() => (window.location.href = "/teams")}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Manage Teams
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/50 border-2 border-green-200 text-green-600 hover:bg-green-50"
                      onClick={() => (window.location.href = "/settings")}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
