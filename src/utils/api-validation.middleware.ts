/**
 * API Validation Middleware
 * Provides validation middleware for API endpoints
 * Requirements: 14.1
 */

import { z } from 'zod';

export interface ValidationError {
  field?: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validates request data against a Zod schema
 * Returns structured validation result
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return {
        success: false,
        errors
      };
    }
    
    return {
      success: false,
      errors: [{ message: 'Validation failed' }]
    };
  }
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(errors: ValidationError[]) {
  return {
    error: 'Validation failed',
    details: errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates and returns data or throws error
 * Useful for API handlers that want to throw on validation failure
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string = 'Invalid request data'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      
      throw new Error(`${errorMessage}: ${errors.join(', ')}`);
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Validates query parameters
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: URLSearchParams | Record<string, string>
): ValidationResult<T> {
  const data: Record<string, any> = {};
  
  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => {
      // Try to parse numbers and booleans
      if (value === 'true') data[key] = true;
      else if (value === 'false') data[key] = false;
      else if (!isNaN(Number(value)) && value !== '') data[key] = Number(value);
      else data[key] = value;
    });
  } else {
    Object.assign(data, params);
  }
  
  return validateRequest(schema, data);
}

/**
 * Validates request headers
 */
export function validateHeaders(
  requiredHeaders: string[],
  headers: Headers | Record<string, string>
): ValidationResult<Record<string, string>> {
  const errors: ValidationError[] = [];
  const data: Record<string, string> = {};
  
  for (const header of requiredHeaders) {
    const value = headers instanceof Headers 
      ? headers.get(header)
      : headers[header];
    
    if (!value) {
      errors.push({
        field: header,
        message: `Missing required header: ${header}`
      });
    } else {
      data[header] = value;
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
}

/**
 * Validates authentication token
 */
export function validateAuthToken(
  authHeader: string | null
): ValidationResult<string> {
  if (!authHeader) {
    return {
      success: false,
      errors: [{ message: 'Missing authorization header' }]
    };
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return {
      success: false,
      errors: [{ message: 'Invalid authorization header format. Expected: Bearer <token>' }]
    };
  }
  
  const token = parts[1];
  
  if (!token || token.length === 0) {
    return {
      success: false,
      errors: [{ message: 'Empty authorization token' }]
    };
  }
  
  return { success: true, data: token };
}

/**
 * Validates file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult<File> {
  const errors: ValidationError[] = [];
  
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push({
      field: 'file',
      message: `File size exceeds maximum allowed size of ${options.maxSize} bytes`
    });
  }
  
  // Check MIME type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    });
  }
  
  // Check file extension
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push({
        field: 'file',
        message: `File extension .${extension} is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`
      });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: file };
}

/**
 * Combines multiple validation results
 */
export function combineValidationResults<T extends Record<string, any>>(
  results: Record<keyof T, ValidationResult<any>>
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  const data: any = {};
  
  for (const [key, result] of Object.entries(results)) {
    if (!result.success) {
      errors.push(...(result.errors || []));
    } else {
      data[key] = result.data;
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: data as T };
}

/**
 * Sanitizes input data by removing potentially dangerous content
 */
export function sanitizeInput<T extends Record<string, any>>(data: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove null bytes and control characters
      sanitized[key] = value
        .replace(/\0/g, '')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Rate limiting validation
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  /**
   * Checks if request is allowed under rate limit
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);
    
    return true;
  }
  
  /**
   * Gets remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    
    return Math.max(0, this.config.maxRequests - validTimestamps.length);
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
  cleanup(): void {
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

// Export validation utilities
export const ValidationMiddleware = {
  validateRequest,
  validateOrThrow,
  validateQueryParams,
  validateHeaders,
  validateAuthToken,
  validateFile,
  combineValidationResults,
  sanitizeInput,
  createValidationErrorResponse,
  RateLimiter
};
