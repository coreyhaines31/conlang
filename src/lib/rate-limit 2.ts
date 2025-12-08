// Simple in-memory rate limiter for serverless
// Note: Each serverless instance has its own memory, so this provides
// basic protection but isn't perfect for distributed environments.
// For production at scale, consider Upstash Redis.

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  
  lastCleanup = now
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

interface RateLimitConfig {
  limit: number      // Max requests
  windowMs: number   // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetIn: number    // Seconds until reset
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 10, windowMs: 60 * 1000 }
): RateLimitResult {
  cleanup()
  
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  // First request or window expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    }
  }
  
  // Within window
  const remaining = config.limit - record.count - 1
  const resetIn = Math.ceil((record.resetTime - now) / 1000)
  
  if (record.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetIn,
    }
  }
  
  record.count++
  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, remaining),
    resetIn,
  }
}

// Helper to get client IP from request headers
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback
  return 'unknown'
}

