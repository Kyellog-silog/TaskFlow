"use client"

import * as React from "react"
import { useState } from "react"
import { MessageSquare, User, Clock, Tag, Calendar, Flag, Sparkles, Send, X, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: "low" | "medium" | "high"
  assignee?: {
    id: string
    name: string
    avatar: string
  }
  dueDate?: string
  comments: Comment[]
  createdAt: string
}

interface Comment {
  id: string
  content: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string
}

interface TaskModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onUpdate: (task: Task) => void
}

export function TaskModal({ task, isOpen, onClose, onUpdate }: TaskModalProps) {
  const [editedTask, setEditedTask] = useState<Task>(task)
  const [newComment, setNewComment] = useState("")

  const handleSave = () => {
    onUpdate(editedTask)
    onClose()
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        content: newComment,
        author: {
          name: "Current User",
          avatar: "/placeholder.svg?height=24&width=24",
        },
        createdAt: new Date().toISOString(),
      }

      setEditedTask({
        ...editedTask,
        comments: [...editedTask.comments, comment],
      })
      setNewComment("")
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          color: "bg-gradient-to-r from-red-500 to-pink-500 text-white",
          bgColor: "from-red-50 to-pink-50",
          borderColor: "border-red-200",
          icon: "🔥"
        }
      case "medium":
        return {
          color: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
          bgColor: "from-yellow-50 to-orange-50",
          borderColor: "border-yellow-200",
          icon: "⚡"
        }
      case "low":
        return {
          color: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
          bgColor: "from-green-50 to-emerald-50",
          borderColor: "border-green-200",
          icon: "🌱"
        }
      default:
        return {
          color: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
          bgColor: "from-gray-50 to-slate-50",
          borderColor: "border-gray-200",
          icon: "📋"
        }
    }
  }

  const priorityConfig = getPriorityConfig(editedTask.priority)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-0">
          <div className={`p-6 -m-6 mb-6 bg-gradient-to-r ${priorityConfig.bgColor} border-b-2 ${priorityConfig.borderColor} relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <DialogTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-800">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Tag className="h-6 w-6 text-gray-700" />
                </div>
                <span>Task Details</span>
                <div className="text-2xl">{priorityConfig.icon}</div>
              </DialogTitle>
              <p className="text-gray-600 mt-2">Task ID: #{editedTask.id.slice(-8)}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)] px-6 pb-6 space-y-8">
          {/* Task Title */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Task Title</span>
            </label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="text-lg font-semibold bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Enter task title..."
            />
          </div>

          {/* Task Description */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">Description</label>
            <Textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={4}
              className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="Describe what needs to be done..."
            />
          </div>

          {/* Task Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">Status</label>
              <Select
                value={editedTask.status}
                onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="todo" className="hover:bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>To Do</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress" className="hover:bg-yellow-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="review" className="hover:bg-purple-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Review</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="done" className="hover:bg-green-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Done</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                <Flag className="h-4 w-4 text-purple-500" />
                <span>Priority</span>
              </label>
              <Select
                value={editedTask.priority}
                onValueChange={(value: "low" | "medium" | "high") => setEditedTask({ ...editedTask, priority: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="low" className="hover:bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span>🌱</span>
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="hover:bg-yellow-50">
                    <div className="flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high" className="hover:bg-red-50">
                    <div className="flex items-center space-x-2">
                      <span>🔥</span>
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <span>Due Date</span>
              </label>
              <Input
                type="date"
                value={editedTask.dueDate || ""}
                onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>

          {/* Assignee Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center space-x-2">
              <User className="h-4 w-4 text-indigo-500" />
              <span>Assignee</span>
            </label>
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-gray-200">
              <Avatar className="h-12 w-12 ring-4 ring-white shadow-lg">
                <AvatarImage src={editedTask.assignee?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                  {editedTask.assignee?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "NA"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {editedTask.assignee?.name || "Unassigned"}
                </p>
                <p className="text-sm text-gray-600">
                  {editedTask.assignee ? "Task assignee" : "No one assigned yet"}
                </p>
              </div>
              <Badge className={`${priorityConfig.color} text-sm font-bold px-3 py-1 shadow-sm`}>
                {editedTask.priority.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Comments Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Comments ({editedTask.comments.length})
              </h3>
            </div>

            {/* Existing Comments */}
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {editedTask.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                      {comment.author.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">{comment.author.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Comment */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-blue-200">
              <div className="flex space-x-3">
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                    CU
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share your thoughts, updates, or questions..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  <Button 
                    onClick={handleAddComment} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Task Metadata */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Created</p>
                  <p className="text-gray-600">{new Date(editedTask.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Tag className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Task ID</p>
                  <p className="text-gray-600 font-mono">#{editedTask.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 pt-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
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
