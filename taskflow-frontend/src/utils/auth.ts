/**
 * Authentication utilities
 */

/**
 * Check if there are signs of an existing authentication session
 * This helps avoid unnecessary API calls when there's clearly no session
 */
export const hasAuthenticationCookies = (): boolean => {
  const cookies = document.cookie
  
  // Check for Laravel Sanctum related cookies
  const sanctumCookies = [
    'laravel_session',
    'XSRF-TOKEN', 
    'sanctum',
    'taskflow_session' // Add your app-specific session cookie name if different
  ]
  
  return sanctumCookies.some(cookieName => cookies.includes(cookieName))
}

/**
 * Check if we should attempt authentication verification
 * Combines cookie check with localStorage flag for better UX
 */
export const shouldAttemptAuthCheck = (): boolean => {
  // If we have auth cookies, we should check
  if (hasAuthenticationCookies()) {
    return true
  }
  
  // If user previously authenticated in this session, check once more
  // This handles cases where cookies might be cleared but session might still be valid
  const authAttempted = localStorage.getItem('auth_attempted') === 'true'
  if (authAttempted) {
    return true
  }
  
  return false
}

/**
 * Clear all authentication-related local state
 */
export const clearAuthState = (): void => {
  localStorage.removeItem('auth_attempted')
  // Add any other auth-related localStorage items you want to clear
}

/**
 * Mark that authentication has been attempted/successful
 */
export const setAuthAttempted = (): void => {
  localStorage.setItem('auth_attempted', 'true')
}
