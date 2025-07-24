"use client"

import type React from "react"
import { useDroppable } from "@dnd-kit/core"
import { Plus, Lock, AlertTriangle, Users } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

interface Column {
  id: string
  title: string
  tasks: any[]
  maxTasks?: number
  acceptsFrom?: string[]
  isLocked?: boolean
  color?: string
}

interface DroppableColumnProps {
  column: Column
  children: React.ReactNode
  dragConstraints: {
    allowedColumns: string[]
    blockedColumns: string[]
    reason?: string
  }
  userRole: "admin" | "member"
  onCreateTask: () => void
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  children,
  dragConstraints,
  userRole,
  onCreateTask,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  })

  const isBlocked = dragConstraints.blockedColumns.includes(column.id)
  const isAllowed = dragConstraints.allowedColumns.length === 0 || dragConstraints.allowedColumns.includes(column.id)
  const isNearCapacity = column.maxTasks && column.tasks.length >= column.maxTasks * 0.8
  const isAtCapacity = column.maxTasks && column.tasks.length >= column.maxTasks

  const getColumnStyle = () => {
    let baseStyle = "bg-white rounded-lg shadow-sm border transition-all duration-200"

    if (isOver && isAllowed && !isBlocked) {
      baseStyle += " ring-2 ring-blue-400 bg-blue-50 border-blue-300"
    } else if (isOver && isBlocked) {
      baseStyle += " ring-2 ring-red-400 bg-red-50 border-red-300"
    } else if (isBlocked && dragConstraints.allowedColumns.length > 0) {
      baseStyle += " opacity-60 bg-gray-100"
    }

    if (column.color) {
      baseStyle += ` border-l-4 border-l-${column.color}`
    }

    return baseStyle
  }

  const getHeaderStyle = () => {
    let style = "p-4 border-b"

    if (column.isLocked) {
      style += " bg-gray-50"
    } else if (isAtCapacity) {
      style += " bg-red-50"
    } else if (isNearCapacity) {
      style += " bg-yellow-50"
    }

    return style
  }

  return (
    <div className={getColumnStyle()}>
      <div className={getHeaderStyle()}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900">{column.title}</h2>
            {column.isLocked && <span title="Column is locked"><Lock className="h-4 w-4 text-gray-500" /></span>}
            {isAtCapacity && <span title="Column at capacity"><AlertTriangle className="h-4 w-4 text-red-500" /></span>}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {column.tasks.length}
              {column.maxTasks && `/${column.maxTasks}`}
            </Badge>
          </div>
        </div>

        {/* Column constraints info */}
        <div className="flex flex-wrap gap-1 text-xs text-gray-500">
          {column.acceptsFrom && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Accepts from: {column.acceptsFrom.join(", ")}</span>
            </div>
          )}
          {column.maxTasks && (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Max: {column.maxTasks} tasks</span>
            </div>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`p-4 min-h-[200px] ${isOver && isAllowed ? "bg-blue-25" : ""} ${
          isOver && isBlocked ? "bg-red-25" : ""
        }`}
      >
        {children}

        {/* Drop zone indicator */}
        {isOver && (
          <div
            className={`mt-3 p-4 border-2 border-dashed rounded-lg text-center ${
              isAllowed && !isBlocked
                ? "border-blue-300 bg-blue-50 text-blue-600"
                : "border-red-300 bg-red-50 text-red-600"
            }`}
          >
            {isAllowed && !isBlocked ? (
              <span>Drop task here</span>
            ) : (
              <span>{dragConstraints.reason || "Cannot drop here"}</span>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          className={`w-full justify-start text-gray-500 hover:text-gray-700 mt-3 ${
            (column.isLocked && userRole !== "admin") || isAtCapacity ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={onCreateTask}
          disabled={!!((column.isLocked && userRole !== "admin") || isAtCapacity)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a task
        </Button>
      </div>
    </div>
  )
}
