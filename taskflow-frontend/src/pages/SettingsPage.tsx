"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Header } from "../components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../hooks/use-toast"
import { Settings, LogOut, Shield, Bell, User, Sparkles, Volume2, Mail, Monitor } from 'lucide-react'
import { Switch } from "../components/ui/switch"
import { storageService } from "../services/storage"

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  
  const [soundEnabled, setSoundEnabled] = useState(storageService.getItem<boolean>('notif_sound_enabled') ?? true)
  const [emailEnabled, setEmailEnabled] = useState(storageService.getItem<boolean>('notif_email_enabled') ?? true)
  const [soundVolume, setSoundVolume] = useState<number[]>([storageService.getItem<number>('notif_sound_volume') ?? 70])

  useEffect(()=>{
    storageService.setItem('notif_sound_enabled', soundEnabled)
  },[soundEnabled])
  useEffect(()=>{
    storageService.setItem('notif_email_enabled', emailEnabled)
  },[emailEnabled])
  useEffect(()=>{
    storageService.setItem('notif_sound_volume', soundVolume[0])
  },[soundVolume])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out successfully! 👋",
        description: "See you next time!",
      })
    } catch (error) {
      console.error("Failed to log out", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div
              className={`mb-8 transform transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Settings ⚙️
              </h1>
              <p className="text-gray-600 text-lg">Customize your TaskFlow experience</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Settings */}
              <div className="lg:col-span-2 space-y-6">
                {/* Account Settings */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                      <User className="h-6 w-6 text-blue-500" />
                      <span>Account Settings</span>
                    </CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-500 rounded-full">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Profile Information</h4>
                          <p className="text-sm text-gray-600">Update your personal details</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-white/50 border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => window.location.href = '/profile'}
                      >
                        Edit Profile
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-red-500 rounded-full">
                          <LogOut className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Sign Out</h4>
                          <p className="text-sm text-gray-600">Sign out of your account</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleLogout}
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Appearance removed for light-only mode */}

                {/* Notifications */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                      <Bell className="h-6 w-6 text-yellow-500" />
                      <span>Notifications</span>
                    </CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-yellow-500 rounded-full">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch checked={emailEnabled} onCheckedChange={(v:boolean)=>setEmailEnabled(!!v)} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-500 rounded-full">
                          <Volume2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">Sound Notifications</h4>
                          <p className="text-sm text-gray-600">Play sounds for alerts</p>
                          <div className="mt-2 flex items-center space-x-3">
                            <Switch checked={soundEnabled} onCheckedChange={(v:boolean)=>setSoundEnabled(!!v)} />
                            <div className="w-40">
                              <input type="range" min={0} max={100} step={1} value={soundVolume[0]} onChange={(e)=>setSoundVolume([Number(e.target.value)])} className="w-full" />
                            </div>
                            <Button size="sm" variant="outline" onClick={()=>{
                              if(!soundEnabled) return
                              const audio = new Audio('/sounds/notify.mp3')
                              audio.volume = (soundVolume?.[0] ?? 70)/100
                              audio.play().catch(()=>{})
                            }}>Test</Button>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">{soundEnabled? 'Enabled':'Disabled'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* User Info */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">Account Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900">{user?.name}</h3>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-700">
                        <Shield className="h-3 w-3 mr-1" />
                        {user?.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/50 border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/50 border-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                      onClick={() => window.location.href = '/teams'}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Manage Teams
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/50 border-2 border-green-200 text-green-600 hover:bg-green-50"
                      onClick={() => window.location.href = '/profile'}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>

                {/* System Info */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version</span>
                      <span className="font-medium">v2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium">Today</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge className="bg-green-100 text-green-700 text-xs">Online</Badge>
                    </div>
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

export default SettingsPage