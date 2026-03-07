/**
 * Retry logic utilities for gamification operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryableError extends Error {
  constructor(message: string, public readonly isRetryable: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Execute an async operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      if (error instanceof RetryableError && !error.isRetryable) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      
      // Notify about retry
      onRetry?.(attempt, lastError);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Determine if an error is retryable based on its type
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableError) {
    return error.isRetryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return true;
    }

    // Client errors (4xx) are generally not retryable
    if (
      message.includes('400') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('404')
    ) {
      return false;
    }
  }

  // Default to retryable for unknown errors
  return true;
}

/**
 * Create a user-friendly error message for gamification operations
 */
export function formatGamificationError(error: unknown, context?: string): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message;

    // Network errors
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.';
    }

    // Timeout errors
    if (message.includes('timeout')) {
      return 'Операция заняла слишком много времени. Попробуйте снова.';
    }

    // Authentication errors
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Требуется авторизация. Пожалуйста, войдите в систему.';
    }

    // Permission errors
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'У вас нет прав для выполнения этой операции.';
    }

    // Not found errors
    if (message.includes('404') || message.includes('Not found')) {
      return context 
        ? `${context} не найден${context.endsWith('а') ? 'а' : ''}.`
        : 'Запрошенный ресурс не найден.';
    }

    // Server errors
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Ошибка сервера. Мы уже работаем над её исправлением.';
    }

    // Return original message if no specific pattern matched
    return message;
  }

  return 'Произошла неизвестная ошибка. Попробуйте снова.';
}

/**
 * Batch retry for multiple operations
 */
export async function batchWithRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<T | Error>> {
  const results = await Promise.allSettled(
    operations.map(op => withRetry(op, options))
  );

  return results.map(result => 
    result.status === 'fulfilled' ? result.value : result.reason
  );
}
