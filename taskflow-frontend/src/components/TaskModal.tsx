"use client"

import * as React from "react"
import { useState } from "react"
import { MessageSquare, User, Clock, Tag } from "lucide-react"
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
  assignee: {
    id: string
    name: string
    avatar: string
  }
  dueDate: string
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Task Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="text-lg font-medium"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
            <Textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Task Properties */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select
                value={editedTask.status}
                onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
              <Select
                value={editedTask.priority}
                onValueChange={(value: "low" | "medium" | "high") => setEditedTask({ ...editedTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
              <Input
                type="date"
                value={editedTask.dueDate}
                onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Assignee</label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={editedTask.assignee.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {editedTask.assignee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{editedTask.assignee.name}</span>
              <Badge className={getPriorityColor(editedTask.priority)}>{editedTask.priority}</Badge>
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-medium">Comments ({editedTask.comments.length})</h3>
            </div>

            {/* Existing Comments */}
            <div className="space-y-4 mb-4">
              {editedTask.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {comment.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Comment */}
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>CU</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleAddComment} size="sm">
                  Add Comment
                </Button>
              </div>
            </div>
          </div>

          {/* Task Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(editedTask.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>ID: {editedTask.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
