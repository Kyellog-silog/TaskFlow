export interface Board {
    id: string
    name: string
    description?: string
    teamId: string
    team?: Team
    createdBy: string
    creator?: User
    createdAt: string
    updatedAt: string
    columns?: BoardColumn[]
    tasks?: Task[]
    members?: User[]
  }
  
  export interface BoardColumn {
    id: string
    boardId: string
    name: string
    position: number
    color?: string
    maxTasks?: number
    acceptsFrom?: string[]
    isLocked?: boolean
    createdAt: string
    updatedAt: string
    tasks?: Task[]
  }
  
  export interface CreateBoardRequest {
    name: string
    description?: string
    teamId: string
  }
  
  export interface UpdateBoardRequest {
    name?: string
    description?: string
  }
  
  export interface CreateColumnRequest {
    name: string
    position: number
    color?: string
    maxTasks?: number
    acceptsFrom?: string[]
  }
  
  export interface UpdateColumnRequest {
    name?: string
    position?: number
    color?: string
    maxTasks?: number
    acceptsFrom?: string[]
    isLocked?: boolean
  }
  
  interface Team {
    id: string
    name: string
    description?: string
  }
  
  interface User {
    id: string
    name: string
    email: string
    avatar?: string
  }
  
  interface Task {
    id: string
    title: string
    status: string
    priority: string
  }
  