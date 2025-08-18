"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { MessageSquare, User, Clock, Tag, Calendar, Flag, Sparkles, Send, X, Save, CornerDownRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { commentsAPI } from "../services/api"
// SSE handled globally in App-level bridge
import { useAuth } from "../contexts/AuthContext"

interface Task {
  id: string
  title: string
  description: string
  status: string
  columnId: string // Add this line
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
  onMove?: (taskId: string, newColumnId: string) => void // Add move callback
}

export function TaskModal({ task, isOpen, onClose, onUpdate, onMove }: TaskModalProps) {
  const [editedTask, setEditedTask] = useState<Task>(task)
  const [newComment, setNewComment] = useState("")
  const [originalStatus, setOriginalStatus] = useState(task.status)
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Update editedTask when task prop changes
  useEffect(() => {
    console.log("TaskModal received task:", task)
    console.log("Task status:", task.status)
    setEditedTask(task)
    setOriginalStatus(task.status)
  }, [task])

  const handleSave = () => {
    console.log(`Saving task. Original status: ${originalStatus}, New status: ${editedTask.status}`)
    
    // Always update the task first
    onUpdate(editedTask)
    
    // Check if status changed and trigger move if needed
    if (editedTask.status !== originalStatus && onMove) {
      console.log(`Status changed from ${originalStatus} to ${editedTask.status}, triggering move`)
      // Small delay to ensure the update completes first
      setTimeout(() => {
        onMove(editedTask.id, editedTask.status)
      }, 100)
    }
    
    onClose()
  }

  const handleStatusChange = (newStatus: string) => {
    console.log(`Changing task status from ${editedTask.status} to ${newStatus}`)
    setEditedTask({ ...editedTask, status: newStatus })
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

  // Load comments for this task
  const { data: commentsData } = useQuery([
    "comments",
    task.id,
  ], () => commentsAPI.getComments(task.id), { enabled: !!task.id })

  // Keep editedTask.comments in sync with fetched comments
  useEffect(() => {
    if (commentsData?.data) {
      setEditedTask((prev) => ({ ...prev, comments: commentsData.data }))
    }
  }, [commentsData])

  // Post a new top-level comment
  const addCommentMutation = useMutation(
    async (content: string) => commentsAPI.createComment(task.id, content),
    {
      onSuccess: () => {
        setNewComment("")
        queryClient.invalidateQueries(["comments", task.id])
      },
    },
  )

  // Post a reply to a comment
  const addReplyMutation = useMutation(
    async ({ parentId, content }: { parentId: string; content: string }) =>
      commentsAPI.createComment(task.id, content, parentId),
    {
      onSuccess: (_res, vars) => {
        setReplyDrafts((d) => ({ ...d, [vars.parentId]: "" }))
        queryClient.invalidateQueries(["comments", task.id])
      },
    },
  )

  // Real-time updates handled by App-level SSE bridge which invalidates ["comments", taskId]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-0">
          <div className={`p-4 -m-6 mb-4 bg-gradient-to-r ${priorityConfig.bgColor} border-b-2 ${priorityConfig.borderColor} relative overflow-hidden`}>
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

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Task Title */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Task Title</span>
            </label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="text-lg font-semibold bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
              placeholder="Enter task title..."
            />
          </div>

          {/* Task Description */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800">Description</label>
            <Textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={4}
              className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
              placeholder="Describe what needs to be done..."
            />
          </div>

          {/* Task Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800">Status</label>
              <Select
                value={editedTask.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-blue-500 text-gray-900">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="todo" className="hover:bg-blue-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>To Do</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress" className="hover:bg-yellow-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="review" className="hover:bg-purple-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Review</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="done" className="hover:bg-green-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Done</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                <Flag className="h-4 w-4 text-purple-500" />
                <span>Priority</span>
              </label>
              <Select
                value={editedTask.priority}
                onValueChange={(value: "low" | "medium" | "high") => setEditedTask({ ...editedTask, priority: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200 focus:border-blue-500 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="low" className="hover:bg-green-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>🌱</span>
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="hover:bg-yellow-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high" className="hover:bg-red-50 text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>🔥</span>
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <span>Due Date</span>
              </label>
              <Input
                type="date"
                value={editedTask.dueDate || ""}
                onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900"
              />
            </div>
          </div>

          {/* Assignee Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800 flex items-center space-x-2">
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
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Comments ({editedTask.comments.length})
              </h3>
            </div>

            {/* Existing Comments (with replies) */}
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {(editedTask.comments || []).map((comment: any) => {
                const authorName = comment.user?.name || comment.author?.name || "User"
                const avatar = comment.user?.avatar || comment.author?.avatar || "/placeholder.svg"
                const createdAt = comment.created_at || comment.createdAt
                const replies = comment.replies || []
                return (
                  <div key={comment.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex space-x-3">
                      <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                          {authorName.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{authorName}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {createdAt ? new Date(createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-100">
                            {replies.map((rep: any) => {
                              const repName = rep.user?.name || "User"
                              const repAvatar = rep.user?.avatar || "/placeholder.svg"
                              const repAt = rep.created_at || rep.createdAt
                              return (
                                <div key={rep.id} className="flex space-x-3">
                                  <CornerDownRight className="h-4 w-4 text-gray-300 mt-3" />
                                  <Avatar className="h-8 w-8 ring-2 ring-gray-200">
                                    <AvatarImage src={repAvatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-xs">
                                      {repName.split(" ").map((n: string) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold text-gray-900 text-sm">{repName}</span>
                                      <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {repAt ? new Date(repAt).toLocaleString() : ""}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{rep.content}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Reply box */}
                        <div className="mt-3 pl-6">
                          {replyOpenFor === comment.id ? (
                            <div className="flex items-start space-x-2">
                              <Textarea
                                placeholder="Write a reply..."
                                value={replyDrafts[comment.id] || ""}
                                onChange={(e) => setReplyDrafts((d) => ({ ...d, [comment.id]: e.target.value }))}
                                rows={2}
                                className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                              />
                              <Button
                                onClick={() => {
                                  const content = (replyDrafts[comment.id] || "").trim()
                                  if (!content) return
                                  addReplyMutation.mutate({ parentId: comment.id, content })
                                  setReplyOpenFor(null)
                                }}
                                disabled={addReplyMutation.isLoading || !(replyDrafts[comment.id] || "").trim()}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Reply
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyOpenFor(comment.id)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              Reply
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
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
                    className="bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
                  />
                  <Button 
                    onClick={() => {
                      const content = newComment.trim()
                      if (!content) return
                      addCommentMutation.mutate(content)
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    disabled={!newComment.trim() || addCommentMutation.isLoading}
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
                  <p className="font-semibold text-gray-800">Created</p>
                  <p className="text-gray-600">{new Date(editedTask.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Tag className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Task ID</p>
                  <p className="text-gray-600 font-mono">#{editedTask.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
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
