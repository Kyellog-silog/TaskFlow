
class WebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 20
    private reconnectInterval = 1000
  
    connect(url: string, onMessage?: (data: any) => void) {
      try {
        this.ws = new WebSocket(url)
  
        this.ws.onopen = () => {
          console.log("WebSocket connected")
          this.reconnectAttempts = 0
        }
  
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        }
  
        this.ws.onclose = () => {
          console.log("WebSocket disconnected")
          this.handleReconnect(url, onMessage)
        }
  
        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
        }
      } catch (error) {
        console.error("Failed to connect WebSocket:", error)
      }
    }
  
    private handleReconnect(url: string, onMessage?: (data: any) => void) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          this.connect(url, onMessage)
        }, this.reconnectInterval * this.reconnectAttempts)
      }
    }
  
    send(data: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data))
      }
    }
  
    disconnect() {
      this.ws?.close()
      this.ws = null
    }
  }
  
  export const websocketService = new WebSocketService()
  