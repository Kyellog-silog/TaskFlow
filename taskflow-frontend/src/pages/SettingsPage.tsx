"use client"

import { useState } from "react"
import { Header } from "../components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Switch } from "../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Separator } from "../components/ui/separator"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { useToast } from "../hooks/use-toast"
import { Settings, Bell, Shield, Palette, Download, Trash2, Save } from "lucide-react"

const SettingsPage = () => {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskAssigned: true,
    taskCompleted: false,
    taskOverdue: true,
    teamInvites: true,
  })

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    defaultView: "kanban",
  })

  const handleSaveNotifications = () => {
    // Save notification preferences
    toast({
      title: "Success",
      description: "Notification preferences saved successfully",
    })
  }

  const handleSavePreferences = () => {
    // Save general preferences
    toast({
      title: "Success",
      description: "Preferences saved successfully",
    })
  }

  const handleExportData = () => {
    // Export user data
    toast({
      title: "Export Started",
      description: "Your data export will be emailed to you shortly",
    })
  }

  const handleDeleteAccount = () => {
    // Handle account deletion
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account",
      variant: "destructive",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <a
                  href="#general"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                  <span>General</span>
                </a>
                <a
                  href="#notifications"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </a>
                <a
                  href="#appearance"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Palette className="h-4 w-4" />
                  <span>Appearance</span>
                </a>
                <a
                  href="#security"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </a>
                <a
                  href="#data"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Data & Privacy</span>
                </a>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* General Settings */}
              <Card id="general">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>General Settings</span>
                  </CardTitle>
                  <CardDescription>Configure your general account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="defaultView">Default Board View</Label>
                      <Select
                        value={preferences.defaultView}
                        onValueChange={(value) => setPreferences({ ...preferences, defaultView: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kanban">Kanban</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                          <SelectItem value="calendar">Calendar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card id="notifications">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.push}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="task-assigned">Task Assigned</Label>
                        <p className="text-sm text-gray-600">When a task is assigned to you</p>
                      </div>
                      <Switch
                        id="task-assigned"
                        checked={notifications.taskAssigned}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, taskAssigned: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="task-completed">Task Completed</Label>
                        <p className="text-sm text-gray-600">When a task you created is completed</p>
                      </div>
                      <Switch
                        id="task-completed"
                        checked={notifications.taskCompleted}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, taskCompleted: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="task-overdue">Task Overdue</Label>
                        <p className="text-sm text-gray-600">When your tasks become overdue</p>
                      </div>
                      <Switch
                        id="task-overdue"
                        checked={notifications.taskOverdue}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, taskOverdue: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="team-invites">Team Invites</Label>
                        <p className="text-sm text-gray-600">When you're invited to join a team</p>
                      </div>
                      <Switch
                        id="team-invites"
                        checked={notifications.teamInvites}
                        onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, teamInvites: checked })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveNotifications}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card id="appearance">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Appearance</span>
                  </CardTitle>
                  <CardDescription>Customize how TaskFlow looks and feels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 mt-1">Choose your preferred theme or use system setting</p>
                  </div>
                </CardContent>
              </Card>

              {/* Data & Privacy */}
              <Card id="data">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Data & Privacy</span>
                  </CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Export Data</h4>
                        <p className="text-sm text-gray-600">Download a copy of your TaskFlow data</p>
                      </div>
                      <Button variant="outline" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
