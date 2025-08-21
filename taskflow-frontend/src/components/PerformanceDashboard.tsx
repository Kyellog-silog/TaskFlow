import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import FrontendPerformanceMonitor from '../lib/performanceMonitor'

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  context?: any
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }

    // Listen for keyboard shortcut to toggle (Ctrl+Shift+P)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) {
    return null
  }

  const slowMetrics = metrics.filter(m => m.duration > 1000)
  const warningMetrics = metrics.filter(m => m.duration > 500 && m.duration <= 1000)
  const recentMetrics = metrics.slice(-10).reverse()

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-hidden z-50 bg-white border rounded-lg shadow-lg">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <CardDescription className="text-xs">
            Ctrl+Shift+P to toggle
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-2 max-h-64 overflow-y-auto">
          <div className="flex gap-2">
            <Badge variant="destructive" className="text-xs">
              Slow: {slowMetrics.length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Warning: {warningMetrics.length}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Total: {metrics.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <h4 className="font-semibold text-xs">Recent Operations:</h4>
            {recentMetrics.map((metric, index) => (
              <div 
                key={index} 
                className={`p-2 rounded text-xs ${
                  metric.duration > 1000 ? 'bg-red-100' : 
                  metric.duration > 500 ? 'bg-yellow-100' : 'bg-green-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono">{metric.name}</span>
                  <span className={`font-bold ${
                    metric.duration > 1000 ? 'text-red-600' : 
                    metric.duration > 500 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {Math.round(metric.duration)}ms
                  </span>
                </div>
                {metric.context && (
                  <div className="text-gray-600 mt-1">
                    {Object.entries(metric.context).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook to use performance monitoring
export const usePerformanceTracking = () => {
  const trackOperation = async <T,>(
    name: string,
    operation: () => Promise<T>,
    context?: any
  ): Promise<T> => {
    return FrontendPerformanceMonitor.measureAsync(name, operation, context)
  }

  const trackSync = <T,>(
    name: string,
    operation: () => T,
    context?: any
  ): T => {
    return FrontendPerformanceMonitor.measure(name, operation, context)
  }

  return { trackOperation, trackSync }
}
