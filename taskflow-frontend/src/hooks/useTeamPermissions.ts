import { useMemo } from "react"

export interface TeamMember {
  id: string
  name: string
  role: "admin" | "member" | "viewer"
  avatar?: string
  email?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  owner?: {
    id: string
    name: string
  }
  [key: string]: any
}

export interface TeamPermissions {
  canViewBoard: boolean
  canEditTasks: boolean
  canCreateTasks: boolean
  canDeleteTasks: boolean
  canManageBoard: boolean
  canManageTeam: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  userRole: string | null
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
  isViewer: boolean
}

/**
 * Custom hook to determine user permissions within a team context
 */
export function useTeamPermissions(
  team: Team | null, 
  userId: string | undefined
): TeamPermissions {
  
  return useMemo(() => {
    if (!team || !userId) {
      return {
        canViewBoard: false,
        canEditTasks: false,
        canCreateTasks: false,
        canDeleteTasks: false,
        canManageBoard: false,
        canManageTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        userRole: null,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      }
    }

    // Check if user is team owner
    const isOwner = team.owner?.id === userId
    
    // Find user's role in team
    const member = team.members?.find(m => m.id === userId)
    const userRole = isOwner ? 'owner' : (member?.role || null)

    // Role booleans
    const isAdmin = userRole === 'admin'
    const isMember = userRole === 'member'
    const isViewer = userRole === 'viewer'

    // Permission calculations based on role
    const canViewBoard = isOwner || isAdmin || isMember || isViewer
    const canEditTasks = isOwner || isAdmin || isMember
    const canCreateTasks = isOwner || isAdmin || isMember
    const canDeleteTasks = isOwner || isAdmin || isMember
    const canManageBoard = isOwner || isAdmin
    const canManageTeam = isOwner || isAdmin
    const canInviteMembers = isOwner || isAdmin
    const canRemoveMembers = isOwner || isAdmin

    return {
      canViewBoard,
      canEditTasks,
      canCreateTasks,
      canDeleteTasks,
      canManageBoard,
      canManageTeam,
      canInviteMembers,
      canRemoveMembers,
      userRole,
      isOwner,
      isAdmin,
      isMember,
      isViewer,
    }
  }, [team, userId])
}

/**
 * Get the highest permission level across multiple teams
 */
export function useMultiTeamPermissions(
  teams: Team[], 
  userId: string | undefined
): TeamPermissions {
  
  return useMemo(() => {
    if (!teams.length || !userId) {
      return {
        canViewBoard: false,
        canEditTasks: false,
        canCreateTasks: false,
        canDeleteTasks: false,
        canManageBoard: false,
        canManageTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        userRole: null,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: false,
      }
    }

    // Calculate permissions for each team manually to avoid hook calls in callback
    const allPermissions = teams.map(team => {
      if (!team || !userId) {
        return {
          canViewBoard: false,
          canEditTasks: false,
          canCreateTasks: false,
          canDeleteTasks: false,
          canManageBoard: false,
          canManageTeam: false,
          canInviteMembers: false,
          canRemoveMembers: false,
          userRole: null,
          isOwner: false,
          isAdmin: false,
          isMember: false,
          isViewer: false,
        }
      }

      // Check if user is team owner
      const isOwner = team.owner?.id === userId
      
      // Find user's role in team
      const member = team.members?.find(m => m.id === userId)
      const userRole = isOwner ? 'owner' : (member?.role || null)

      // Role booleans
      const isAdmin = userRole === 'admin'
      const isMember = userRole === 'member'
      const isViewer = userRole === 'viewer'

      // Permission calculations based on role
      const canViewBoard = isOwner || isAdmin || isMember || isViewer
      const canEditTasks = isOwner || isAdmin || isMember
      const canCreateTasks = isOwner || isAdmin || isMember
      const canDeleteTasks = isOwner || isAdmin || isMember
      const canManageBoard = isOwner || isAdmin
      const canManageTeam = isOwner || isAdmin
      const canInviteMembers = isOwner || isAdmin
      const canRemoveMembers = isOwner || isAdmin

      return {
        canViewBoard,
        canEditTasks,
        canCreateTasks,
        canDeleteTasks,
        canManageBoard,
        canManageTeam,
        canInviteMembers,
        canRemoveMembers,
        userRole,
        isOwner,
        isAdmin,
        isMember,
        isViewer,
      }
    })
    
    // Aggregate permissions (if user has permission in ANY team, they have it overall)
    return {
      canViewBoard: allPermissions.some(p => p.canViewBoard),
      canEditTasks: allPermissions.some(p => p.canEditTasks),
      canCreateTasks: allPermissions.some(p => p.canCreateTasks),
      canDeleteTasks: allPermissions.some(p => p.canDeleteTasks),
      canManageBoard: allPermissions.some(p => p.canManageBoard),
      canManageTeam: allPermissions.some(p => p.canManageTeam),
      canInviteMembers: allPermissions.some(p => p.canInviteMembers),
      canRemoveMembers: allPermissions.some(p => p.canRemoveMembers),
      userRole: allPermissions.find(p => p.isOwner)?.userRole || 
                allPermissions.find(p => p.isAdmin)?.userRole ||
                allPermissions.find(p => p.isMember)?.userRole ||
                allPermissions.find(p => p.isViewer)?.userRole ||
                null,
      isOwner: allPermissions.some(p => p.isOwner),
      isAdmin: allPermissions.some(p => p.isAdmin),
      isMember: allPermissions.some(p => p.isMember),
      isViewer: allPermissions.every(p => p.isViewer), // Only viewer if ALL roles are viewer
    }
  }, [teams, userId])
}

/**
 * Utility function to get role display information
 */
export function getRoleDisplayInfo(role: string) {
  switch (role) {
    case 'owner':
      return { 
        label: 'Owner', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: '👑',
        description: 'Full control over team and all resources'
      }
    case 'admin':
      return { 
        label: 'Admin', 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: '⚡',
        description: 'Can manage team members and all team resources'
      }
    case 'member':
      return { 
        label: 'Member', 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: '👤',
        description: 'Can create, edit, and manage tasks and boards'
      }
    case 'viewer':
      return { 
        label: 'Viewer', 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: '👁️',
        description: 'Can only view boards and tasks, no editing allowed'
      }
    default:
      return { 
        label: role || 'Unknown', 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: '❓',
        description: 'Role permissions unclear'
      }
  }
}
