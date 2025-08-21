"use client"

import React, { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  rectIntersection,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { DroppableColumn } from "./DroppableColumn"
import { SortableTaskCard } from "./SortableTaskCard"
import { TaskCard } from "./TaskCard"
import { CreateTaskModal } from "./CreateTaskModal"
import type { TeamPermissions } from "../hooks/useTeamPermissions"
import { TaskModal } from "./TaskModal"
import logger from "../lib/logger"

export interface Task {
  id: string
  title: string
  description: string
  status: string
  columnId: string
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

interface Column {
  id: string
  title: string
  tasks: Task[]
  maxTasks?: number
  acceptsFrom?: string[]
  color?: string
}

interface KanbanBoardProps {
  columns: Column[]
  onTaskMove: (taskId: string, sourceColumn: string, destColumn: string, position: number) => void
  onTaskUpdate: (task: Task) => void
  onTaskCreate: (taskData: any) => void
  onTaskDelete: (taskId: string) => void
  onTaskMoveFromModal?: (taskId: string, newStatus: string) => void
  userRole?: "admin" | "member"
  teamPermissions?: TeamPermissions
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onTaskMove,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskMoveFromModal,
  userRole = "member",
  teamPermissions,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createTaskColumn, setCreateTaskColumn] = useState<string | null>(null)

  // Configure sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = columns
      .flatMap(col => col.tasks)
      .find(task => task.id === active.id)
    
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Block moves for users without edit rights
    if (teamPermissions && !teamPermissions.canEditTasks) {
      setActiveTask(null)
      return
    }
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeTask = columns
      .flatMap(col => col.tasks)
      .find(task => task.id === active.id)

    if (!activeTask) return

    const sourceColumn = columns.find(col => 
      col.tasks.some(task => task.id === active.id)
    )
    
    const destColumn = columns.find(col => col.id === over.id) || 
                      columns.find(col => 
                        col.tasks.some(task => task.id === over.id)
                      )

    if (!sourceColumn || !destColumn) return

    // Don't move if it's the same position
    if (sourceColumn.id === destColumn.id && active.id === over.id) return

    // Check column acceptance rules
    if (destColumn.acceptsFrom && !destColumn.acceptsFrom.includes(sourceColumn.id)) {
  logger.log("Destination column doesn't accept from source column")
      return
    }

    // Check capacity
    if (destColumn.maxTasks && destColumn.tasks.length >= destColumn.maxTasks) {
  logger.log("Destination column is at capacity")
      return
    }

    // Calculate new position
    let newPosition = destColumn.tasks.length
    if (over.id !== destColumn.id) {
      // Dropping on a specific task
      const overTaskIndex = destColumn.tasks.findIndex(task => task.id === over.id)
      if (overTaskIndex !== -1) {
        newPosition = overTaskIndex
      }
    }

    onTaskMove(activeTask.id, sourceColumn.id, destColumn.id, newPosition)
  }

  const getDragConstraints = (task: Task) => {
    const sourceColumn = columns.find(col => 
      col.tasks.some(t => t.id === task.id)
    )

    if (!sourceColumn) {
      return { allowedColumns: [], blockedColumns: [], reason: "Source column not found" }
    }

    const allowedColumns: string[] = []
    const blockedColumns: string[] = []
    let reason = ""

    columns.forEach(col => {
      let canMove = true
      let blockReason = ""

      // Check column acceptance rules
      if (col.acceptsFrom && !col.acceptsFrom.includes(sourceColumn.id)) {
        canMove = false
        blockReason = `Only accepts from: ${col.acceptsFrom.join(", ")}`
      }
      // Check capacity
      else if (col.maxTasks && col.tasks.length >= col.maxTasks) {
        canMove = false
        blockReason = "Column at capacity"
      }

      if (canMove) {
        allowedColumns.push(col.id)
      } else {
        blockedColumns.push(col.id)
        if (!reason) reason = blockReason
      }
    })

    return { allowedColumns, blockedColumns, reason }
  }

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task)
  }

  const handleTaskMoveFromModal = (taskId: string, newStatus: string) => {
  logger.log(`Task status change requested: ${taskId} -> ${newStatus}`)
    
    // Map frontend status to column title
    const statusToTitleMap: Record<string, string> = {
      'todo': 'To Do',
      'in-progress': 'In Progress', 
      'review': 'Review',
      'done': 'Done'
    }
    
    const targetColumnTitle = statusToTitleMap[newStatus]
    if (!targetColumnTitle) {
  logger.error('Unknown status:', newStatus)
      return
    }
    
  logger.log(`Looking for column with title: ${targetColumnTitle}`)
    
    // Find current column of the task
    const currentColumn = columns.find(col => 
      col.tasks.some(task => task.id === taskId)
    )
    
    if (!currentColumn) {
  logger.error('Current column not found for task:', taskId)
      return
    }
    
    // Find target column by title
    const targetColumn = columns.find(col => col.title === targetColumnTitle)
    
    if (!targetColumn) {
  logger.error('Target column not found for title:', targetColumnTitle, 'Available columns:', columns.map(c => ({ id: c.id, title: c.title })))
      return
    }
    
    // Don't move if already in correct column
    if (currentColumn.id === targetColumn.id) {
  logger.log('Task already in correct column')
      return
    }
    
    // Calculate position (add to end of target column)
    const newPosition = targetColumn.tasks.length
    
    // Call the parent's move handler
    onTaskMove(taskId, currentColumn.id, targetColumn.id, newPosition)
  }
  
  const handleTaskDelete = (taskId: string) => {
    onTaskDelete(taskId)
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          {columns.map((column) => (
            <SortableContext
              key={column.id}
              items={column.tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn
                column={column}
                dragConstraints={activeTask ? getDragConstraints(activeTask) : { allowedColumns: [], blockedColumns: [] }}
                userRole={userRole}
                canCreate={teamPermissions ? teamPermissions.canCreateTasks : true}
                onCreateTask={() => setCreateTaskColumn(column.id)}
              >
                {column.tasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => setSelectedTask(task)}
                    onDelete={() => {
                      logger.log('Delete task:', task.id)
                      onTaskDelete(task.id)
                    }}
                    dragConstraints={getDragConstraints(task)}
                  />
                ))}
              </DroppableColumn>
            </SortableContext>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105">
              <TaskCard
                task={activeTask}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Creation Modal */}
      {createTaskColumn && (
        <CreateTaskModal
          isOpen={!!createTaskColumn}
          onClose={() => setCreateTaskColumn(null)}
          columnId={createTaskColumn}
          columnName={columns.find(col => col.id === createTaskColumn)?.title}
          onSubmit={(taskData: any) => {
            onTaskCreate({
              ...taskData,
              column_id: createTaskColumn,
            })
            setCreateTaskColumn(null)
          }}
        />
      )}

      {/* Task Detail Modal */}
    {selectedTask && (
      <TaskModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={(updatedTask) => {
          onTaskUpdate(updatedTask)
          setSelectedTask(null)
        }}
        onMove={handleTaskMoveFromModal}
      />
    )}
    </div>
  )
}
