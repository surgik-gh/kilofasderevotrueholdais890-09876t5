/**
 * Supabase Error Handler
 * 
 * Provides centralized error handling for Supabase operations with:
 * - User-friendly error messages
 * - Retry logic for transient errors
 * - Error logging for critical issues
 * 
 * Usage in services:
 * 
 * 1. Import the utilities:
 *    import { handleSupabaseError, executeSupabaseOperation, withRetry } from '../utils/supabase-error-handler';
 * 
 * 2. Wrap Supabase operations:
 *    try {
 *      const result = await executeSupabaseOperation(
 *        async () => {
 *          const { data, error } = await supabase.from('table').select();
 *          if (error) throw error;
 *          return data;
 *        },
 *        'fetch_data',
 *        { retry: true, maxRetries: 3 }
 *      );
 *    } catch (error) {
 *      const userError = handleSupabaseError(error);
 *      // Display userError.message to user
 *    }
 * 
 * 3. Or use withRetry directly for custom retry logic:
 *    const data = await withRetry(async () => {
 *      const { data, error } = await supabase.from('table').select();
 *      if (error) throw error;
 *      return data;
 *    }, 3, 1000);
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  code: string;
  retryable?: boolean;
}

export class SupabaseError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'SupabaseError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Convert Supabase errors to user-friendly messages
 */
export function handleSupabaseError(error: any): UserFriendlyError {
  // Handle PostgreSQL errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          title: 'Дубликат данных',
          message: 'Запись с такими данными уже существует',
          code: 'DUPLICATE_ENTRY',
          retryable: false,
        };

      case '23503': // Foreign key violation
        return {
          title: 'Ошибка связи данных',
          message: 'Связанные данные не найдены',
          code: 'FOREIGN_KEY_VIOLATION',
          retryable: false,
        };

      case '42P01': // Undefined table
        return {
          title: 'Ошибка базы данных',
          message: 'Таблица не найдена. Выполните миграции базы данных.',
          code: 'TABLE_NOT_FOUND',
          retryable: false,
        };

      case 'PGRST116': // Not found
        return {
          title: 'Не найдено',
          message: 'Запрашиваемые данные не найдены',
          code: 'NOT_FOUND',
          retryable: false,
        };

      case 'PGRST301': // RLS violation
        return {
          title: 'Доступ запрещен',
          message: 'У вас нет прав для выполнения этой операции',
          code: 'ACCESS_DENIED',
          retryable: false,
        };
    }
  }

  // Handle auth errors
  if (error?.message) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
      return {
        title: 'Ошибка входа',
        message: 'Неверный email или пароль',
        code: 'INVALID_CREDENTIALS',
        retryable: false,
      };
    }

    if (message.includes('email not confirmed')) {
      return {
        title: 'Email не подтвержден',
        message: 'Проверьте почту и подтвердите email',
        code: 'EMAIL_NOT_CONFIRMED',
        retryable: false,
      };
    }

    if (message.includes('already registered') || message.includes('already exists')) {
      return {
        title: 'Email занят',
        message: 'Этот email уже зарегистрирован',
        code: 'EMAIL_ALREADY_EXISTS',
        retryable: false,
      };
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        title: 'Слишком много запросов',
        message: 'Подождите немного перед следующей попыткой',
        code: 'RATE_LIMIT',
        retryable: true,
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Ошибка сети',
        message: 'Проверьте подключение к интернету',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }

    if (message.includes('timeout')) {
      return {
        title: 'Превышено время ожидания',
        message: 'Сервер не ответил вовремя. Попробуйте еще раз.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }

    if (message.includes('invalid api key')) {
      return {
        title: 'Ошибка конфигурации',
        message: 'Неверный API ключ Supabase. Обратитесь к администратору.',
        code: 'INVALID_API_KEY',
        retryable: false,
      };
    }
  }

  // Log unexpected errors for debugging
  console.error('Unexpected Supabase error:', error);

  // Generic error
  return {
    title: 'Произошла ошибка',
    message: error?.message || 'Не удалось выполнить операцию. Попробуйте позже.',
    code: 'UNKNOWN_ERROR',
    retryable: false,
  };
}

/**
 * Retry logic for transient errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const userError = handleSupabaseError(error);

      // Don't retry if error is not retryable
      if (!userError.retryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log critical errors for admin review
 */
export function logCriticalError(
  operation: string,
  error: any,
  context?: Record<string, any>
): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    operation,
    error: {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    },
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  // Log to console in development
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.error('Critical error:', errorLog);
  }

  // In production, you would send this to a logging service
  // Example: Sentry, LogRocket, or custom logging endpoint
  // sendToLoggingService(errorLog);
}

/**
 * Wrapper for Supabase operations with error handling and retry
 */
export async function executeSupabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: {
    retry?: boolean;
    maxRetries?: number;
    logCritical?: boolean;
  } = {}
): Promise<T> {
  const { retry = false, maxRetries = 3, logCritical = true } = options;

  try {
    if (retry) {
      return await withRetry(operation, maxRetries);
    } else {
      return await operation();
    }
  } catch (error) {
    // Log critical errors
    if (logCritical) {
      logCriticalError(operationName, error);
    }

    // Convert to user-friendly error
    const userError = handleSupabaseError(error);
    throw new SupabaseError(userError.message, userError.code, error);
  }
}
