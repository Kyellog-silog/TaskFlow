"use client"

import * as React from "react"
import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { TaskCard } from "./TaskCard"
import { SortableTaskCard } from "./SortableTaskCard"
import { DroppableColumn } from "./DroppableColumn"
import { TaskModal } from "./TaskModal"
import { CreateTaskModal } from "./CreateTaskModal"
import { useToast } from "../hooks/use-toast"

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
  isLocked?: boolean
  canMoveTo?: string[]
}

interface Column {
  id: string
  title: string
  tasks: Task[]
  maxTasks?: number
  acceptsFrom?: string[]
  isLocked?: boolean
  color?: string
}

interface KanbanBoardProps {
  columns: Column[]
  onTaskMove: (taskId: string, sourceColumn: string, destColumn: string, position: number) => void
  onTaskUpdate: (task: Task) => void
  onTaskCreate: (taskData: any) => void
  userRole?: "admin" | "member"
}

// Custom collision detection algorithm
const customCollisionDetection: CollisionDetection = (args) => {
  const { active, droppableContainers } = args

  // First, let's see if there are any collisions with the pointer
  const pointerCollisions = pointerWithin(args)

  if (pointerCollisions.length > 0) {
    return pointerCollisions
  }

  // If there are no pointer collisions, use rectangle intersection
  const rectCollisions = rectIntersection(args)

  if (rectCollisions.length > 0) {
    return rectCollisions
  }

  // Fallback to closest center
  return closestCenter(args)
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onTaskMove,
  onTaskUpdate,
  onTaskCreate,
  userRole = "member",
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createColumnId, setCreateColumnId] = useState<string>("")
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dragConstraints, setDragConstraints] = useState<{
    allowedColumns: string[]
    blockedColumns: string[]
    reason?: string
  }>({ allowedColumns: [], blockedColumns: [] })

  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Calculate drag constraints based on task and user permissions
  const calculateDragConstraints = useCallback(
    (task: Task) => {
      const constraints = {
        allowedColumns: [] as string[],
        blockedColumns: [] as string[],
        reason: undefined as string | undefined,
      }

      // Check if task is locked
      if (task.isLocked && userRole !== "admin") {
        constraints.blockedColumns = columns.map((col) => col.id)
        constraints.reason = "Task is locked and requires admin permissions"
        return constraints
      }

      // Check task-specific movement restrictions
      if (task.canMoveTo && task.canMoveTo.length > 0) {
        constraints.allowedColumns = task.canMoveTo
        constraints.blockedColumns = columns.map((col) => col.id).filter((id) => !task.canMoveTo!.includes(id))
      } else {
        constraints.allowedColumns = columns.map((col) => col.id)
      }

      // Check column-specific restrictions
      columns.forEach((column) => {
        // Check if column is locked
        if (column.isLocked && userRole !== "admin") {
          constraints.blockedColumns.push(column.id)
          if (!constraints.reason) {
            constraints.reason = "Column is locked and requires admin permissions"
          }
        }

        // Check if column accepts tasks from current column
        if (column.acceptsFrom && !column.acceptsFrom.includes(task.status)) {
          constraints.blockedColumns.push(column.id)
          if (!constraints.reason) {
            constraints.reason = `Column "${column.title}" doesn't accept tasks from "${task.status}"`
          }
        }

        // Check column capacity
        if (column.maxTasks && column.tasks.length >= column.maxTasks && column.id !== task.status) {
          constraints.blockedColumns.push(column.id)
          if (!constraints.reason) {
            constraints.reason = `Column "${column.title}" has reached maximum capacity (${column.maxTasks})`
          }
        }
      })

      // Remove duplicates and ensure consistency
      constraints.allowedColumns = constraints.allowedColumns.filter((id) => !constraints.blockedColumns.includes(id))

      return constraints
    },
    [columns, userRole],
  )

  // Validate if a move is allowed
  const validateMove = useCallback(
    (taskId: string, sourceColumnId: string, targetColumnId: string): { allowed: boolean; reason?: string } => {
      const task = findTaskById(taskId)
      const targetColumn = columns.find((col) => col.id === targetColumnId)

      if (!task || !targetColumn) {
        return { allowed: false, reason: "Invalid task or column" }
      }

      // Same column moves are always allowed (reordering)
      if (sourceColumnId === targetColumnId) {
        return { allowed: true }
      }

      const constraints = calculateDragConstraints(task)

      // Check if target column is blocked
      if (constraints.blockedColumns.includes(targetColumnId)) {
        return { allowed: false, reason: constraints.reason }
      }

      // Check if target column is in allowed list
      if (constraints.allowedColumns.length > 0 && !constraints.allowedColumns.includes(targetColumnId)) {
        return { allowed: false, reason: "Move not allowed by task constraints" }
      }

      // Additional business logic constraints
      if (task.priority === "high" && targetColumnId === "done" && userRole !== "admin") {
        return { allowed: false, reason: "High priority tasks require admin approval to complete" }
      }

      // Check if moving backwards in workflow (optional constraint)
      const workflowOrder = ["todo", "in-progress", "review", "done"]
      const sourceIndex = workflowOrder.indexOf(sourceColumnId)
      const targetIndex = workflowOrder.indexOf(targetColumnId)

      if (sourceIndex > targetIndex && targetIndex !== -1 && sourceIndex !== -1) {
        if (userRole !== "admin") {
          return { allowed: false, reason: "Moving tasks backwards requires admin permissions" }
        }
      }

      return { allowed: true }
    },
    [columns, userRole, calculateDragConstraints],
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = findTaskById(active.id as string)

    if (task) {
      setActiveTask(task)
      const constraints = calculateDragConstraints(task)
      setDragConstraints(constraints)

      // Show constraints in toast if there are blocked columns
      if (constraints.blockedColumns.length > 0 && constraints.reason) {
        toast({
          title: "Drag Constraints Active",
          description: constraints.reason,
          variant: "default",
        })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !activeTask) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (!activeContainer || !overContainer) return

    // Validate the move
    const validation = validateMove(activeId, activeContainer, overContainer)

    if (!validation.allowed) {
      // Visual feedback for invalid move
      toast({
        title: "Move Not Allowed",
        description: validation.reason,
        variant: "destructive",
      })
      return
    }

    // Only proceed if move is valid
    if (activeContainer !== overContainer) {
      const activeIndex =
        columns.find((col) => col.id === activeContainer)?.tasks.findIndex((task) => task.id === activeId) ?? -1

      const overIndex =
        columns.find((col) => col.id === overContainer)?.tasks.findIndex((task) => task.id === overId) ?? -1

      if (activeIndex !== -1) {
        onTaskMove(activeId, activeContainer, overContainer, overIndex >= 0 ? overIndex : 0)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setDragConstraints({ allowedColumns: [], blockedColumns: [] })

    if (!over || !activeTask) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (!activeContainer || !overContainer) return

    // Final validation before committing the move
    const validation = validateMove(activeId, activeContainer, overContainer)

    if (!validation.allowed) {
      toast({
        title: "Move Rejected",
        description: validation.reason,
        variant: "destructive",
      })
      return
    }

    const activeColumn = columns.find((col) => col.id === activeContainer)
    const overColumn = columns.find((col) => col.id === overContainer)

    if (!activeColumn || !overColumn) return

    if (activeContainer === overContainer) {
      // Same column reordering
      const activeIndex = activeColumn.tasks.findIndex((task) => task.id === activeId)
      const overIndex = overColumn.tasks.findIndex((task) => task.id === overId)

      if (activeIndex !== overIndex) {
        onTaskMove(activeId, activeContainer, overContainer, overIndex)
      }
    } else {
      // Cross-column move - already handled in dragOver, but we can add final confirmation
      toast({
        title: "Task Moved",
        description: `Task moved from "${activeColumn.title}" to "${overColumn.title}"`,
        variant: "default",
      })
    }
  }

  const findContainer = (id: string): string | null => {
    // Check if it's a column
    if (columns.some((col) => col.id === id)) {
      return id
    }

    // Find which column contains this task
    for (const column of columns) {
      if (column.tasks.some((task) => task.id === id)) {
        return column.id
      }
    }

    return null
  }

  const findTaskById = (id: string): Task | null => {
    for (const column of columns) {
      const task = column.tasks.find((task) => task.id === id)
      if (task) return task
    }
    return null
  }

  const openTaskModal = (task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const openCreateModal = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId)

    // Check if column allows new tasks
    if (column?.isLocked && userRole !== "admin") {
      toast({
        title: "Access Denied",
        description: "This column is locked and requires admin permissions",
        variant: "destructive",
      })
      return
    }

    if (column?.maxTasks && column.tasks.length >= column.maxTasks) {
      toast({
        title: "Column Full",
        description: `Column "${column.title}" has reached maximum capacity (${column.maxTasks})`,
        variant: "destructive",
      })
      return
    }

    setCreateColumnId(columnId)
    setIsCreateModalOpen(true)
  }

  // Memoized modifiers for performance
  const dragModifiers = useMemo(() => [restrictToVerticalAxis, restrictToWindowEdges], [])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={dragModifiers}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              dragConstraints={dragConstraints}
              userRole={userRole}
              onCreateTask={() => openCreateModal(column.id)}
            >
              <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {column.tasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => openTaskModal(task)}
                      dragConstraints={dragConstraints}
                      isBlocked={dragConstraints.blockedColumns.includes(column.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay modifiers={dragModifiers}>
          {activeTask ? (
            <div className="transform rotate-3 opacity-90">
              <TaskCard task={activeTask} isDragging={true} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onUpdate={onTaskUpdate}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onTaskCreate}
        columnId={createColumnId}
      />
    </>
  )
}
