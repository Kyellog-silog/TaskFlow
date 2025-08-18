export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
    phone?: string
    location?: string
    bio?: string
    website?: string
    emailVerifiedAt?: string
    createdAt: string
    updatedAt: string
    teams?: TeamMembership[]
    ownedTeams?: Team[]
    assignedTasks?: Task[]
    createdTasks?: Task[]
  }
  
  export type UserRole = "admin" | "member"
  
  export interface TeamMembership {
    id: string
    teamId: string
    userId: string
    role: TeamRole
    joinedAt: string
    team?: Team
  }
  
  export type TeamRole = "admin" | "member" | "viewer"
  
  export interface Team {
    id: string
    name: string
    description?: string
    ownerId: string
    owner?: User
    createdAt: string
    updatedAt: string
    members?: TeamMembership[]
    boards?: Board[]
  }
  
  export interface UpdateProfileRequest {
    name?: string
    email?: string
    phone?: string
    location?: string
    bio?: string
    avatar?: string
  }
  
  export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
    newPasswordConfirmation: string
  }
  
  export interface UserPreferences {
    theme: "light" | "dark" | "system"
    notifications: {
      email: boolean
      push: boolean
      taskAssigned: boolean
      taskCompleted: boolean
      taskOverdue: boolean
      teamInvites: boolean
    }
    dashboard: {
      showCompletedTasks: boolean
      defaultView: "kanban" | "list" | "calendar"
      tasksPerPage: number
    }
  }
  
  interface Task {
    id: string
    title: string
    status: string
    priority: string
  }
  
  interface Board {
    id: string
    name: string
    description?: string
  }
  