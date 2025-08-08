"use client"

import type React from "react"
import { useDroppable } from "@dnd-kit/core"
import { Plus, AlertTriangle, Users, Sparkles, Target } from 'lucide-react'
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface Column {
  id: string
  title: string
  tasks: any[]
  maxTasks?: number
  acceptsFrom?: string[]
  color?: string
}

interface DroppableColumnProps {
  column: Column
  children: React.ReactNode
  dragConstraints?: {
    allowedColumns: string[]
    blockedColumns: string[]
    reason?: string
  }
  userRole?: "admin" | "member"
  onCreateTask: () => void
}

export function DroppableColumn({
  column,
  children,
  dragConstraints = { allowedColumns: [], blockedColumns: [] },
  userRole = "member",
  onCreateTask,
}: DroppableColumnProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    }
  })

  const isBlocked = dragConstraints.blockedColumns.includes(column.id)
  const isAllowed = dragConstraints.allowedColumns.length === 0 || dragConstraints.allowedColumns.includes(column.id)
  const isNearCapacity = column.maxTasks && column.tasks.length >= column.maxTasks * 0.8
  const isAtCapacity = !!(column.maxTasks && column.tasks.length >= column.maxTasks)

  const getColumnConfig = () => {
    const configs = {
      'todo': {
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-200',
        icon: '📋',
        accentColor: 'text-blue-600'
      },
      'in-progress': {
        gradient: 'from-yellow-500 to-orange-500',
        bgGradient: 'from-yellow-50 to-orange-50',
        borderColor: 'border-yellow-200',
        icon: '⚡',
        accentColor: 'text-yellow-600'
      },
      'review': {
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        borderColor: 'border-purple-200',
        icon: '👀',
        accentColor: 'text-purple-600'
      },
      'done': {
        gradient: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        icon: '✅',
        accentColor: 'text-green-600'
      }
    }
    
    // If column has custom color, use that instead
    if (column.color) {
      const colorMap: { [key: string]: any } = {
        'blue-500': {
          gradient: 'from-blue-500 to-blue-600',
          bgGradient: 'from-blue-50 to-blue-100',
          borderColor: 'border-blue-200',
          accentColor: 'text-blue-600'
        },
        'yellow-500': {
          gradient: 'from-yellow-500 to-orange-500',
          bgGradient: 'from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-200',
          accentColor: 'text-yellow-600'
        },
        'purple-500': {
          gradient: 'from-purple-500 to-pink-500',
          bgGradient: 'from-purple-50 to-pink-50',
          borderColor: 'border-purple-200',
          accentColor: 'text-purple-600'
        },
        'green-500': {
          gradient: 'from-green-500 to-emerald-500',
          bgGradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          accentColor: 'text-green-600'
        }
      };
      
      return colorMap[column.color] || configs.todo;
    }
    
    return configs[column.id as keyof typeof configs] || configs.todo
  }

  const config = getColumnConfig()

  const getColumnStyle = () => {
    let baseStyle = `bg-gradient-to-br ${config.bgGradient} rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg ${config.borderColor}`

    if (isOver && isAllowed && !isBlocked) {
      baseStyle += " ring-4 ring-blue-300 ring-opacity-50 shadow-xl scale-105 bg-gradient-to-br from-blue-50 to-indigo-50"
    } else if (isOver && isBlocked) {
      baseStyle += " ring-4 ring-red-300 ring-opacity-50 shadow-xl bg-gradient-to-br from-red-50 to-pink-50"
    } else if (isBlocked && dragConstraints.allowedColumns.length > 0) {
      baseStyle += " opacity-60 grayscale"
    }

    if (active) {
      baseStyle += " transform transition-transform duration-200"
    }

    return baseStyle
  }

  const getHeaderStyle = () => {
    return `p-4 rounded-t-xl bg-gradient-to-r ${config.gradient} text-white relative overflow-hidden`
  }

  const getCapacityColor = () => {
    if (isAtCapacity) return "text-red-600 bg-red-100"
    if (isNearCapacity) return "text-yellow-600 bg-yellow-100"
    return `${config.accentColor} bg-white/20`
  }

  return (
    <div className={getColumnStyle()}>
      {/* Header */}
      <div className={getHeaderStyle()}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{config.icon}</div>
              <div>
                <h2 className="font-bold text-lg text-white drop-shadow-sm">{column.title}</h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={`${getCapacityColor()} font-bold text-sm px-3 py-1 shadow-sm`}>
                {column.tasks.length}
                {column.maxTasks && `/${column.maxTasks}`}
              </Badge>
              {isAtCapacity && <AlertTriangle className="h-4 w-4 text-red-300" />}
            </div>
          </div>

          {/* Column constraints info */}
          <div className="flex flex-wrap gap-2 text-xs text-white/80">
            {column.acceptsFrom && (
              <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                <Users className="h-3 w-3" />
                <span>From: {column.acceptsFrom.join(", ")}</span>
              </div>
            )}
            {column.maxTasks && (
              <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                <Target className="h-3 w-3" />
                <span>Max: {column.maxTasks}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={setNodeRef}
        className={`p-4 min-h-[500px] space-y-3 ${
          isOver && isAllowed ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/50" : ""
        } ${isOver && isBlocked ? "bg-gradient-to-br from-red-50/50 to-pink-50/50" : ""}`}
      >
        {/* Drag constraints warning */}
        {isOver && isBlocked && dragConstraints?.reason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{dragConstraints.reason}</span>
            </div>
          </div>
        )}

        {children}

        {/* Drop zone indicator */}
        {isOver && (
          <div
            className={`p-6 border-2 border-dashed rounded-xl text-center transition-all duration-200 ${
              isAllowed && !isBlocked
                ? "border-blue-300 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700"
                : "border-red-300 bg-gradient-to-br from-red-100 to-pink-100 text-red-700"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              {isAllowed && !isBlocked ? (
                <>
                  <Sparkles className="h-8 w-8 text-blue-500" />
                  <span className="font-semibold">Drop task here</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <span className="font-semibold">{dragConstraints.reason || "Cannot drop here"}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Add Task Button */}
        <Button
          variant="ghost"
          className={`w-full justify-center text-gray-600 hover:text-white hover:bg-gradient-to-r ${config.gradient} border-2 border-dashed ${config.borderColor} hover:border-transparent rounded-xl py-6 transition-all duration-300 group ${
            isAtCapacity 
              ? "opacity-50 cursor-not-allowed hover:bg-gray-100 hover:text-gray-600" 
              : "hover:shadow-lg hover:scale-105"
          }`}
          onClick={onCreateTask}
          disabled={!!isAtCapacity}
        >
          <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold">{isAtCapacity ? "Column Full" : "Add a task"}</span>
        </Button>
      </div>
    </div>
  )
}