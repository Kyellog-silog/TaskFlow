class SSEClient {
  private es: EventSource | null = null
  private url: string

  constructor(url: string) {
    this.url = url
  }

  // Connect with a map of event handlers. Keys are event names, values receive parsed payloads.
  connect(handlers: Record<string, (payload: any) => void>) {
    if (this.es) return
    try {
      this.es = new EventSource(this.url, { withCredentials: true })

      const safeOn = (event: string, cb: (payload: any) => void) => {
        this.es!.addEventListener(event, (evt: MessageEvent) => {
          try {
            const data = JSON.parse(evt.data)
            cb(data)
          } catch {
            // ignore JSON parse errors
          }
        })
      }

      // Register provided handlers
      Object.entries(handlers || {}).forEach(([event, cb]) => safeOn(event, cb))

      // Heartbeat/error handling
      this.es.onerror = () => {
        this.close()
      }
    } catch (e) {
      // ignore
    }
  }

  close() {
    this.es?.close()
    this.es = null
  }
}

export default SSEClient
