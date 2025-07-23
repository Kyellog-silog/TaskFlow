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

interface SortableTaskCardProps {
  task: Task
  onClick: () => void
  dragConstraints?: {
    allowedColumns: string[]
    blockedColumns: string[]
    reason?: string
  }
  isBlocked?: boolean
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onClick,
  dragConstraints,
  isBlocked = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: task.id,
    disabled: task.isLocked || isBlocked,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Add visual indicators for constraints
  const getCardClassName = () => {
    let className = ""

    if (task.isLocked) {
      className += " ring-1 ring-gray-300 bg-gray-50"
    }

    if (isBlocked && dragConstraints?.allowedColumns.length) {
      className += " opacity-60 grayscale"
    }

    if (isOver) {
      className += " ring-2 ring-blue-400"
    }

    return className
  }

  return (
    <div ref={setNodeRef} style={style} className={getCardClassName()} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        isDragging={isDragging}
        onClick={onClick}
        showConstraints={!!dragConstraints?.reason}
        constraintReason={dragConstraints?.reason}
      />
    </div>
  )
}
