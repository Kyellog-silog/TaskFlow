"use client"

import { useState } from "react"
import { useQuery } from "react-query"
import { Link } from "react-router-dom"
import { Header } from "../components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { boardsAPI, tasksAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { BarChart3, Calendar, CheckCircle, Clock, Plus, TrendingUp, Users, AlertTriangle } from "lucide-react"
import * as React from "react"

const DashboardPage = () => {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  // Fetch dashboard data
  const { data: boards, isLoading: boardsLoading } = useQuery("boards", boardsAPI.getBoards)
  const { data: tasks, isLoading: tasksLoading } = useQuery("dashboard-tasks", () => tasksAPI.getTasks({ limit: 10 }))

  // Mock statistics data
  const stats = {
    totalTasks: 24,
    completedTasks: 18,
    inProgress: 4,
    overdue: 2,
    completionRate: 75,
    weeklyProgress: 12,
  }

  const recentTasks = [
    {
      id: "1",
      title: "Design user authentication flow",
      status: "in-progress",
      priority: "high",
      dueDate: "2024-01-15",
      assignee: { name: "Alice Johnson", avatar: "/placeholder.svg?height=32&width=32" },
    },
    {
      id: "2",
      title: "Implement drag and drop functionality",
      status: "review",
      priority: "medium",
      dueDate: "2024-01-14",
      assignee: { name: "Bob Smith", avatar: "/placeholder.svg?height=32&width=32" },
    },
    {
      id: "3",
      title: "Set up database schema",
      status: "done",
      priority: "high",
      dueDate: "2024-01-12",
      assignee: { name: "Carol Davis", avatar: "/placeholder.svg?height=32&width=32" },
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
          <p className="text-gray-600">Here's what's happening with your projects today.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">+{stats.weeklyProgress} from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">{stats.completionRate}% completion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Active tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Tasks</CardTitle>
                    <CardDescription>Your latest task activities</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {task.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {task.assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Boards & Quick Actions */}
          <div className="space-y-6">
            {/* My Boards */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Boards</CardTitle>
                    <CardDescription>Your active project boards</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {boardsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    boards?.data?.slice(0, 5).map((board: any) => (
                      <Link
                        key={board.id}
                        to={`/boards/${board.id}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{board.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{board.description}</p>
                          </div>
                          <Badge variant="secondary">{board.tasks_count || 0}</Badge>
                        </div>
                      </Link>
                    )) || (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No boards yet</p>
                        <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                          Create your first board
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Task
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>This Week's Progress</CardTitle>
                <CardDescription>Your productivity overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tasks Completed</span>
                      <span>
                        {stats.completedTasks}/{stats.totalTasks}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                      <div className="text-xs text-gray-500">In Progress</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
