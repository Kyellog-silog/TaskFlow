import { VALIDATION } from "./constants"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []

  if (!email) {
    errors.push("Email is required")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Please enter a valid email address")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []

  if (!password) {
    errors.push("Password is required")
  } else {
    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters long`)
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = []

  if (!name) {
    errors.push("Name is required")
  } else if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long")
  } else if (name.trim().length > 50) {
    errors.push("Name must be less than 50 characters long")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTaskTitle(title: string): ValidationResult {
  const errors: string[] = []

  if (!title) {
    errors.push("Task title is required")
  } else if (title.trim().length < 3) {
    errors.push("Task title must be at least 3 characters long")
  } else if (title.length > VALIDATION.MAX_TASK_TITLE_LENGTH) {
    errors.push(`Task title must be less than ${VALIDATION.MAX_TASK_TITLE_LENGTH} characters long`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTaskDescription(description: string): ValidationResult {
  const errors: string[] = []

  if (description.length > VALIDATION.MAX_TASK_DESCRIPTION_LENGTH) {
    errors.push(
      `Task description must be less than ${VALIDATION.MAX_TASK_DESCRIPTION_LENGTH} characters long`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
