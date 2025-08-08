"use client"
import * as React from "react"
import { forwardRef } from "react"
import { MoreHorizontal, Calendar, MessageSquare, AlertCircle, Clock, User, Flag, Edit, Trash2, GripVertical } from 'lucide-react'
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu"

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
  comments: any[]
  createdAt: string
  canMoveTo?: string[]
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onEdit?: () => void
  onDelete?: () => void
  showConstraints?: boolean
  constraintReason?: string
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, isDragging = false, onEdit, onDelete, showConstraints = false, constraintReason, ...props }, ref) => {
    const getPriorityConfig = (priority: string) => {
      switch (priority) {
        case "high":
          return {
            color: "bg-gradient-to-r from-red-500 to-pink-500 text-white",
            icon: "🔥",
            border: "border-red-200",
            bg: "bg-red-50"
          }
        case "medium":
          return {
            color: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
            icon: "⚡",
            border: "border-yellow-200",
            bg: "bg-yellow-50"
          }
        case "low":
          return {
            color: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
            icon: "🌱",
            border: "border-green-200",
            bg: "bg-green-50"
          }
        default:
          return {
            color: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
            icon: "📋",
            border: "border-gray-200",
            bg: "bg-gray-50"
          }
      }
    }

    const priorityConfig = getPriorityConfig(task.priority)

    const getCardStyle = () => {
      let style = "group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden"

      if (isDragging) {
        style += " shadow-2xl rotate-2 scale-105 ring-4 ring-blue-200 bg-gradient-to-br from-blue-50 to-white z-50"
      }

      style += ` ${priorityConfig.border}`

      if (showConstraints) {
        style += " ring-2 ring-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50"
      }

      return style
    }

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

    return (
      <Card ref={ref} className={getCardStyle()} {...props}>

        <CardContent className="p-4 pl-8 space-y-3">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1 min-w-0">
              <div className="text-lg">{priorityConfig.icon}</div>
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h3>
            </div>
            
            {/* 3-Dot Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-full" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-2 border-gray-200 shadow-xl rounded-xl">
                <DropdownMenuItem 
                  className="text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg mx-1 my-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.()
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem 
                  className="text-red-600 hover:bg-red-50 cursor-pointer rounded-lg mx-1 my-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Constraint warning */}
          {showConstraints && constraintReason && (
            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg text-xs text-orange-800 border border-orange-200">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium">{constraintReason}</span>
            </div>
          )}

          {/* Priority badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${priorityConfig.color} text-xs font-semibold px-2 py-1 shadow-sm`}>
              {task.priority.toUpperCase()}
            </Badge>
            
            {/* Metadata */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {task.dueDate && (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  {isOverdue && <Clock className="h-3 w-3 text-red-500" />}
                </div>
              )}
              {task.comments.length > 0 && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <MessageSquare className="h-3 w-3" />
                  <span className="font-medium">{task.comments.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                <AvatarImage src={task.assignee?.avatar || "/placeholder.svg?height=24&width=24"} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {task.assignee?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "NA"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-gray-700">
                {task.assignee?.name || "Unassigned"}
              </span>
            </div>
            
            {/* Task ID */}
            <span className="text-xs text-gray-400 font-mono">#{task.id.slice(-4)}</span>
          </div>

          {/* Movement restrictions indicator */}
          {task.canMoveTo && task.canMoveTo.length > 0 && (
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
              <span className="font-medium text-blue-700">Restricted:</span> Can only move to {task.canMoveTo.join(", ")}
            </div>
          )}
        </CardContent>
      </Card>
    )
  },
)

TaskCard.displayName = "TaskCard"
