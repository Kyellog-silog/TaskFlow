// Mapping between database column IDs and frontend status values
export const COLUMN_STATUS_MAP: Record<string, string> = {
  // Database column ID -> Frontend status value
  "1": "todo",
  "2": "in-progress", 
  "3": "review",
  "4": "done",
  // Also support the reverse mapping for flexibility
  "todo": "todo",
  "in-progress": "in-progress",
  "review": "review", 
  "done": "done"
}

// Reverse mapping: Frontend status -> Database column ID
export const STATUS_COLUMN_MAP: Record<string, string> = {
  "todo": "1",
  "in-progress": "2",
  "review": "3", 
  "done": "4"
}

// Default column configurations
export const DEFAULT_COLUMNS = [
  { 
    id: "1", 
    frontendId: "todo",
    title: "To Do", 
    tasks: [], 
    maxTasks: 15, 
    color: "blue-500" 
  },
  { 
    id: "2", 
    frontendId: "in-progress",
    title: "In Progress", 
    tasks: [], 
    maxTasks: 8, 
    acceptsFrom: ["1"], 
    color: "yellow-500" 
  },
  { 
    id: "3", 
    frontendId: "review",
    title: "Review", 
    tasks: [], 
    maxTasks: 5, 
    acceptsFrom: ["2"], 
    color: "purple-500" 
  },
  { 
    id: "4", 
    frontendId: "done",
    title: "Done", 
    tasks: [], 
    acceptsFrom: ["3"], 
    color: "green-500" 
  },
]

// Helper functions
export const getStatusFromColumnId = (columnId: string): string => {
  return COLUMN_STATUS_MAP[columnId] || columnId
}

export const getColumnIdFromStatus = (status: string): string => {
  return STATUS_COLUMN_MAP[status] || status
}

export const getColumnTitle = (columnId: string): string => {
  const column = DEFAULT_COLUMNS.find(col => col.id === columnId || col.frontendId === columnId)
  return column?.title || "Unknown"
}
