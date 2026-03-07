/**
 * Rate Limiting Utilities
 * Implements rate limiting for API endpoints to prevent abuse
 * Requirements: 14.9
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
}

/**
 * In-memory rate limiter
 * For production, consider using Redis for distributed rate limiting
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Checks if request is allowed and updates counter
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Calculate reset time
    const oldestTimestamp = timestamps[0] || now;
    const resetAt = new Date(oldestTimestamp + this.config.windowMs);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        message: this.config.message || `Rate limit exceeded. Try again after ${resetAt.toISOString()}`
      };
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return {
      allowed: true,
      remaining: this.config.maxRequests - timestamps.length,
      resetAt
    };
  }

  /**
   * Gets current rate limit status without incrementing
   */
  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(ts => ts > windowStart);

    const oldestTimestamp = validTimestamps[0] || now;
    const resetAt = new Date(oldestTimestamp + this.config.windowMs);

    const remaining = Math.max(0, this.config.maxRequests - validTimestamps.length);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt
    };
  }

  /**
   * Resets rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Cleans up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart);

      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again in a minute.'
  },

  // Standard: 30 requests per minute
  STANDARD: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again in a minute.'
  },

  // Relaxed: 100 requests per minute
  RELAXED: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again in a minute.'
  },

  // AI Generation: 5 requests per hour (expensive operations)
  AI_GENERATION: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    message: 'AI generation limit reached. Please try again in an hour.'
  },

  // Authentication: 5 failed attempts per 15 minutes
  AUTH_FAILED: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many failed login attempts. Please try again in 15 minutes.'
  },

  // Registration: 3 registrations per hour per IP
  REGISTRATION: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Registration limit reached. Please try again in an hour.'
  },

  // Password Reset: 3 requests per hour
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Password reset limit reached. Please try again in an hour.'
  },

  // Quiz Generation: 10 per hour
  QUIZ_GENERATION: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    message: 'Quiz generation limit reached. Please try again in an hour.'
  },

  // Roadmap Generation: 5 per day
  ROADMAP_GENERATION: {
    maxRequests: 5,
    windowMs: 24 * 60 * 60 * 1000,
    message: 'Roadmap generation limit reached. Please try again tomorrow.'
  },

  // Chat Messages: 60 per minute
  CHAT_MESSAGES: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    message: 'Too many messages. Please slow down.'
  },

  // File Upload: 20 per hour
  FILE_UPLOAD: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
    message: 'File upload limit reached. Please try again in an hour.'
  }
};

/**
 * Global rate limiters for different endpoints
 */
export const rateLimiters = {
  standard: new RateLimiter(RateLimitPresets.STANDARD),
  strict: new RateLimiter(RateLimitPresets.STRICT),
  relaxed: new RateLimiter(RateLimitPresets.RELAXED),
  aiGeneration: new RateLimiter(RateLimitPresets.AI_GENERATION),
  authFailed: new RateLimiter(RateLimitPresets.AUTH_FAILED),
  registration: new RateLimiter(RateLimitPresets.REGISTRATION),
  passwordReset: new RateLimiter(RateLimitPresets.PASSWORD_RESET),
  quizGeneration: new RateLimiter(RateLimitPresets.QUIZ_GENERATION),
  roadmapGeneration: new RateLimiter(RateLimitPresets.ROADMAP_GENERATION),
  chatMessages: new RateLimiter(RateLimitPresets.CHAT_MESSAGES),
  fileUpload: new RateLimiter(RateLimitPresets.FILE_UPLOAD)
};

/**
 * Gets identifier for rate limiting (user ID or IP)
 */
export function getRateLimitIdentifier(
  userId?: string,
  ip?: string
): string {
  return userId || ip || 'anonymous';
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit<T extends any[], R>(
  limiter: RateLimiter,
  getIdentifier: (...args: T) => string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const identifier = getIdentifier(...args);
    const result = limiter.check(identifier);

    if (!result.allowed) {
      const error: any = new Error(result.message || 'Rate limit exceeded');
      error.rateLimitExceeded = true;
      error.resetAt = result.resetAt;
      error.remaining = result.remaining;
      throw error;
    }

    return handler(...args);
  };
}

/**
 * Creates rate limit error response
 */
export function createRateLimitErrorResponse(result: RateLimitResult) {
  return {
    error: 'Rate limit exceeded',
    message: result.message,
    resetAt: result.resetAt.toISOString(),
    remaining: result.remaining,
    timestamp: new Date().toISOString()
  };
}

/**
 * Logs rate limit violations
 */
export function logRateLimitViolation(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    identifier,
    endpoint,
    limit: config.maxRequests,
    window: config.windowMs,
    severity: 'MEDIUM',
    type: 'RATE_LIMIT_VIOLATION'
  };

  console.warn('[SECURITY] Rate Limit Violation:', logEntry);

  // In production, send to monitoring service
}

/**
 * Sliding window rate limiter (more accurate)
 */
export class SlidingWindowRateLimiter {
  private windows: Map<string, { count: number; startTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const window = this.windows.get(identifier);

    if (!window) {
      // First request in window
      this.windows.set(identifier, { count: 1, startTime: now });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now + this.config.windowMs)
      };
    }

    const elapsed = now - window.startTime;

    if (elapsed >= this.config.windowMs) {
      // Window expired, start new window
      this.windows.set(identifier, { count: 1, startTime: now });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now + this.config.windowMs)
      };
    }

    // Within window
    if (window.count >= this.config.maxRequests) {
      const resetAt = new Date(window.startTime + this.config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        message: this.config.message || `Rate limit exceeded. Try again after ${resetAt.toISOString()}`
      };
    }

    // Increment count
    window.count++;
    this.windows.set(identifier, window);

    return {
      allowed: true,
      remaining: this.config.maxRequests - window.count,
      resetAt: new Date(window.startTime + this.config.windowMs)
    };
  }

  reset(identifier: string): void {
    this.windows.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [identifier, window] of this.windows.entries()) {
      if (now - window.startTime >= this.config.windowMs) {
        this.windows.delete(identifier);
      }
    }
  }
}

/**
 * Token bucket rate limiter (allows bursts)
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private refillInterval: number; // ms

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.refillInterval = 1000; // 1 second

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  check(identifier: string, cost: number = 1): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(identifier);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(identifier, bucket);
    }

    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if enough tokens
    if (bucket.tokens < cost) {
      const tokensNeeded = cost - bucket.tokens;
      const timeToRefill = (tokensNeeded / this.refillRate) * this.refillInterval;
      const resetAt = new Date(now + timeToRefill);

      return {
        allowed: false,
        remaining: bucket.tokens,
        resetAt,
        message: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`
      };
    }

    // Consume tokens
    bucket.tokens -= cost;
    this.buckets.set(identifier, bucket);

    return {
      allowed: true,
      remaining: bucket.tokens,
      resetAt: new Date(now + ((this.maxTokens - bucket.tokens) / this.refillRate) * this.refillInterval)
    };
  }

  reset(identifier: string): void {
    this.buckets.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [identifier, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill >= maxAge) {
        this.buckets.delete(identifier);
      }
    }
  }
}

// Export rate limiting utilities
export const RateLimiting = {
  RateLimiter,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  RateLimitPresets,
  rateLimiters,
  getRateLimitIdentifier,
  withRateLimit,
  createRateLimitErrorResponse,
  logRateLimitViolation
};
