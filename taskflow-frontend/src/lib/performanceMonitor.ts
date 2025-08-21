// Frontend Performance Monitor
class FrontendPerformanceMonitor {
  private static timers: Map<string, number> = new Map()
  private static enabled = true

  static setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  static startTimer(name: string, context?: any): void {
    if (!this.enabled) return
    
    this.timers.set(name, performance.now())
    
    if (context) {
      console.debug(`⏱️ Started ${name}:`, context)
    }
  }

  static endTimer(name: string, context?: any): number {
    if (!this.enabled || !this.timers.has(name)) return 0
    
    const startTime = this.timers.get(name)!
    const duration = performance.now() - startTime
    this.timers.delete(name)
    
    const logData = {
      operation: name,
      duration_ms: Math.round(duration * 100) / 100,
      memory_mb: this.getMemoryUsage(),
      ...(context || {})
    }
    
    if (duration > 1000) {
      console.warn('🐌 Slow operation detected:', logData)
    } else if (duration > 500) {
      console.log('⚠️ Performance warning:', logData)
    } else {
      console.debug('✅ Performance timing:', logData)
    }
    
    return duration
  }

  static async measureAsync<T>(
    name: string, 
    asyncOperation: () => Promise<T>, 
    context?: any
  ): Promise<T> {
    this.startTimer(name, context)
    try {
      const result = await asyncOperation()
      this.endTimer(name, { success: true, ...context })
      return result
    } catch (error) {
      this.endTimer(name, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context 
      })
      throw error
    }
  }

  static measure<T>(name: string, operation: () => T, context?: any): T {
    this.startTimer(name, context)
    try {
      const result = operation()
      this.endTimer(name, { success: true, ...context })
      return result
    } catch (error) {
      this.endTimer(name, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context 
      })
      throw error
    }
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      return Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100) / 100
    }
    return 0
  }

  static logApiCall(method: string, url: string, duration: number, status: number, responseSize?: number): void {
    if (!this.enabled) return
    
    const logData = {
      api_call: `${method} ${url}`,
      duration_ms: Math.round(duration * 100) / 100,
      status,
      response_size_kb: responseSize ? Math.round((responseSize / 1024) * 100) / 100 : undefined,
      memory_mb: this.getMemoryUsage()
    }
    
    if (duration > 2000) {
      console.warn('🐌 Slow API call:', logData)
    } else if (duration > 1000) {
      console.log('⚠️ API performance warning:', logData)
    } else {
      console.debug('📡 API call timing:', logData)
    }
  }
}

export default FrontendPerformanceMonitor
