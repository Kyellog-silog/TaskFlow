class StorageService {
    // Local Storage methods
    setItem(key: string, value: any): void {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error("Error saving to localStorage:", error)
      }
    }
  
    getItem<T>(key: string): T | null {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.error("Error reading from localStorage:", error)
        return null
      }
    }
  
    removeItem(key: string): void {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error("Error removing from localStorage:", error)
      }
    }
  
    clear(): void {
      try {
        localStorage.clear()
      } catch (error) {
        console.error("Error clearing localStorage:", error)
      }
    }
  
    // Session Storage methods
    setSessionItem(key: string, value: any): void {
      try {
        sessionStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error("Error saving to sessionStorage:", error)
      }
    }
  
    getSessionItem<T>(key: string): T | null {
      try {
        const item = sessionStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.error("Error reading from sessionStorage:", error)
        return null
      }
    }
  
    removeSessionItem(key: string): void {
      try {
        sessionStorage.removeItem(key)
      } catch (error) {
        console.error("Error removing from sessionStorage:", error)
      }
    }
  
    // Utility methods
    isStorageAvailable(type: "localStorage" | "sessionStorage"): boolean {
      try {
        const storage = window[type]
        const test = "__storage_test__"
        storage.setItem(test, test)
        storage.removeItem(test)
        return true
      } catch {
        return false
      }
    }
  }
  
  export const storageService = new StorageService()
  