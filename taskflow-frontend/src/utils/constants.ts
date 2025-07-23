export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export const TASK_STATUSES = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  REVIEW: "review",
  DONE: "done",
} as const

export const USER_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
} as const

export const BOARD_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
]

export const PRIORITY_COLORS = {
  [TASK_PRIORITIES.LOW]: "bg-green-100 text-green-800",
  [TASK_PRIORITIES.MEDIUM]: "bg-yellow-100 text-yellow-800",
  [TASK_PRIORITIES.HIGH]: "bg-red-100 text-red-800",
}

export const STATUS_COLORS = {
  [TASK_STATUSES.TODO]: "bg-gray-100 text-gray-800",
  [TASK_STATUSES.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [TASK_STATUSES.REVIEW]: "bg-purple-100 text-purple-800",
  [TASK_STATUSES.DONE]: "bg-green-100 text-green-800",
}

export const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000/ws"

export const PUSHER_CONFIG = {
    key:
      process.env.REACT_APP_PUSHER_KEY ||
      (process.env.NODE_ENV === "production"
        ? (() => {
            throw new Error("Missing Pusher key");
          })()
        : "development-key"),
    cluster: process.env.REACT_APP_PUSHER_CLUSTER || "mt1",
    encrypted: true,
  };
  

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
}

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TASK_TITLE_LENGTH: 255,
  MAX_TASK_DESCRIPTION_LENGTH: 1000,
  MAX_TEAM_NAME_LENGTH: 100,
  MAX_BOARD_NAME_LENGTH: 100,
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  SIDEBAR_COLLAPSED: "sidebar_collapsed",
}

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  BOARDS: "/boards",
  BOARD_DETAIL: "/boards/:id",
  TEAMS: "/teams",
  TEAM_DETAIL: "/teams/:id",
  PROFILE: "/profile",
  SETTINGS: "/settings",
}

