// Simple dev-only logger; production is no-op except errors can optionally pass through
export const isDev = process.env.NODE_ENV !== "production"

export const log = (...args: any[]) => {
  if (isDev) console.log(...args)
}

export const warn = (...args: any[]) => {
  if (isDev) console.warn(...args)
}

export const error = (...args: any[]) => {
  // Keep errors visible in dev; in prod you might forward to telemetry instead
  console.error(...args)
}

const logger = { isDev, log, warn, error }

export default logger
