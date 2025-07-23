"use client"
import * as React from "react"
import { forwardRef } from "react"
import { MoreHorizontal, Calendar, MessageSquare, Lock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

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
  comments: any[]
  createdAt: string
  isLocked?: boolean
  canMoveTo?: string[]
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onClick: () => void
  showConstraints?: boolean
  constraintReason?: string
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, isDragging = false, onClick, showConstraints = false, constraintReason, ...props }, ref) => {
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

    const getCardStyle = () => {
      let style = "cursor-pointer hover:shadow-md transition-all duration-200"

      if (isDragging) {
        style += " shadow-lg rotate-3 scale-105"
      }

      if (task.isLocked) {
        style += " border-gray-300 bg-gray-50"
      }

      if (showConstraints) {
        style += " ring-1 ring-orange-300 bg-orange-50"
      }

      return style
    }

    return (
      <Card ref={ref} className={getCardStyle()} onClick={onClick} {...props}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1">
              <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
              {task.isLocked && (
                <span title="Task is locked">
                  <Lock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Delete</DropdownMenuItem>
                {task.isLocked && <DropdownMenuItem>Unlock</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>

          {/* Constraint warning */}
          {showConstraints && constraintReason && (
            <div className="flex items-center space-x-1 mb-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
              <AlertCircle className="h-3 w-3" />
              <span>{constraintReason}</span>
            </div>
          )}

          {/* Movement restrictions */}
          {task.canMoveTo && task.canMoveTo.length > 0 && (
            <div className="mb-2 text-xs text-gray-500">
              <span>Can move to: {task.canMoveTo.join(", ")}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {task.dueDate && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              {task.comments.length > 0 && (
                <div className="flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {task.comments.length}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {task.assignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">{task.assignee.name}</span>
          </div>
        </CardContent>
      </Card>
    )
  },
)

TaskCard.displayName = "TaskCard"
