"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard } from "./TaskCard"

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

interface SortableTaskCardProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  dragConstraints?: {
    allowedColumns: string[]
    blockedColumns: string[]
    reason?: string
  }
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  dragConstraints,
}) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging, 
    isOver,
    active
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  // Add visual indicators for constraints and drag state
  const getCardClassName = () => {
    let className = "relative"

    if (isDragging) {
      className += " z-50"
    }

    if (isOver) {
      className += " ring-2 ring-blue-400 ring-opacity-50"
    }

    // Add glow effect when dragging
    if (active && active.id === task.id) {
      className += " shadow-2xl"
    }

    return className
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={getCardClassName()}
      {...attributes} 
      {...listeners} // Apply drag listeners to the entire component
    >
      <TaskCard
        task={task}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        showConstraints={!!dragConstraints?.reason}
        constraintReason={dragConstraints?.reason}
      />
      
      {/* Drag overlay effect */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none"></div>
      )}
    </div>
  )
}