import logger from "../lib/logger"

interface TaskMoveEvent {
  type: 'task.moved'
  data: {
    taskId: string
    boardId: string
    userId: string
    fromColumn: string
    toColumn: string
    position: number
    timestamp: number
  }
}

interface WebSocketEventHandlers {
  onTaskMove?: (data: TaskMoveEvent['data']) => void
  onUserJoined?: (data: any) => void
  onUserLeft?: (data: any) => void
}

class WebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5  // Reduced from 20 to 5
    private reconnectInterval = 1000
    private currentBoardId: string | null = null
    private eventHandlers: WebSocketEventHandlers = {}
    private messageQueue: any[] = []
    private isConnecting = false
    private isEnabled = false  // Add flag to enable/disable WebSocket
  
    // Enable WebSocket functionality (call this when you have a WebSocket server)
    enable() {
      this.isEnabled = true
    }

    // Disable WebSocket functionality (graceful degradation)
    disable() {
      this.isEnabled = false
      this.disconnect()
    }

    connect(url: string, onMessage?: (data: any) => void) {
      // Skip connection if WebSocket is disabled or server is unavailable
      if (!this.isEnabled) {
  logger.log("WebSocket is disabled - running in offline mode")
        return
      }

      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
  logger.log("WebSocket connection already in progress")
        return
      }

      this.isConnecting = true
      
      try {
        this.ws = new WebSocket(url)
  
        this.ws.onopen = () => {
          logger.log("WebSocket connected")
          this.reconnectAttempts = 0
          this.isConnecting = false
          
          // Send queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()
            this.send(message)
          }
          
          // Re-subscribe to current board if we were connected to one
          if (this.currentBoardId) {
            this.subscribeToBoard(this.currentBoardId)
          }
        }
  
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
          onMessage?.(data)
        }
  
        this.ws.onclose = () => {
          logger.log("WebSocket disconnected")
          this.isConnecting = false
          this.handleReconnect(url, onMessage)
        }
  
        this.ws.onerror = (error) => {
          logger.error("WebSocket error:", error)
          this.isConnecting = false
          // Disable WebSocket after repeated failures
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.log("WebSocket server unavailable - switching to offline mode")
            this.disable()
          }
        }
      } catch (error) {
  logger.error("Failed to connect WebSocket:", error)
        this.isConnecting = false
        this.disable()
      }
    }

    private handleMessage(data: any) {
      switch (data.type) {
        case 'task.moved':
          this.eventHandlers.onTaskMove?.(data.data)
          break
        case 'user.joined':
          this.eventHandlers.onUserJoined?.(data.data)
          break
        case 'user.left':
          this.eventHandlers.onUserLeft?.(data.data)
          break
        default:
          logger.log('Unhandled WebSocket message:', data)
      }
    }

    setEventHandlers(handlers: WebSocketEventHandlers) {
      this.eventHandlers = handlers
    }

    subscribeToBoard(boardId: string) {
      this.currentBoardId = boardId
      if (this.isEnabled) {
        this.send({
          type: 'subscribe',
          channel: `board.${boardId}`
        })
      }
    }

    unsubscribeFromBoard(boardId: string) {
      if (this.currentBoardId === boardId) {
        this.currentBoardId = null
      }
      if (this.isEnabled) {
        this.send({
          type: 'unsubscribe',
          channel: `board.${boardId}`
        })
      }
    }

    broadcastTaskMove(taskId: string, boardId: string, fromColumn: string, toColumn: string, position: number) {
      if (this.isEnabled) {
        this.send({
          type: 'task.move',
          data: {
            taskId,
            boardId,
            fromColumn,
            toColumn,
            position,
            timestamp: Date.now()
          }
        })
      }
    }
  
    private handleReconnect(url: string, onMessage?: (data: any) => void) {
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.isEnabled) {
        this.reconnectAttempts++
        setTimeout(() => {
          logger.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          this.connect(url, onMessage)
        }, this.reconnectInterval * this.reconnectAttempts)
      } else {
  logger.log("Max reconnect attempts reached or WebSocket disabled")
        this.disable()
      }
    }
  
    send(data: any) {
      if (!this.isEnabled) {
        return // Silently ignore if WebSocket is disabled
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data))
      } else {
        // Only queue if we're still trying to connect
        if (this.isConnecting || this.reconnectAttempts < this.maxReconnectAttempts) {
          logger.log('WebSocket not connected, queuing message:', data)
          this.messageQueue.push(data)
        }
      }
    }
  
    disconnect() {
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
    }

    isConnected(): boolean {
      return this.isEnabled && this.ws?.readyState === WebSocket.OPEN
    }
}

export default new WebSocketService()
  