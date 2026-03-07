import { useState, useCallback, useRef } from 'react';
import { withRetry, formatGamificationError, type RetryOptions } from '@/utils/gamification-retry';

interface UseGamificationAsyncOptions extends RetryOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  context?: string;
}

interface UseGamificationAsyncReturn<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  isLoading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
  retry: () => Promise<T | undefined>;
  retryCount: number;
}

/**
 * Enhanced async operation hook for gamification features
 * Includes automatic retry logic, error formatting, and loading states
 */
export function useGamificationAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseGamificationAsyncOptions = {}
): UseGamificationAsyncReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastArgsRef = useRef<any[]>([]);

  const {
    onSuccess,
    onError,
    context,
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = options;

  const executeWithRetry = useCallback(
    async (args: any[]): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await withRetry(
          () => asyncFunction(...args),
          {
            maxAttempts,
            delayMs,
            backoffMultiplier,
            onRetry: (attempt, err) => {
              setRetryCount(attempt);
              console.log(`Retry attempt ${attempt}/${maxAttempts} for ${context || 'operation'}:`, err.message);
            },
          }
        );

        setData(result);
        setRetryCount(0);
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const formattedError = formatGamificationError(error, context);
        
        setError(formattedError);
        setRetryCount(0);
        onError?.(error);
        
        // Log error for debugging
        console.error(`Error in ${context || 'gamification operation'}:`, error);
        
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction, onSuccess, onError, context, maxAttempts, delayMs, backoffMultiplier]
  );

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      lastArgsRef.current = args;
      return executeWithRetry(args);
    },
    [executeWithRetry]
  );

  const retry = useCallback(async (): Promise<T | undefined> => {
    if (lastArgsRef.current.length === 0) {
      console.warn('No previous arguments to retry with');
      return undefined;
    }
    return executeWithRetry(lastArgsRef.current);
  }, [executeWithRetry]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
    setRetryCount(0);
    lastArgsRef.current = [];
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
    retry,
    retryCount,
  };
}

/**
 * Hook for batch operations with individual error handling
 */
export function useGamificationBatchAsync<T>(
  asyncFunctions: Array<(...args: any[]) => Promise<T>>,
  options: UseGamificationAsyncOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Array<string | null>>([]);
  const [data, setData] = useState<Array<T | null>>([]);

  const executeBatch = useCallback(
    async (...args: any[]): Promise<Array<T | undefined>> => {
      setIsLoading(true);
      setErrors([]);

      const results = await Promise.allSettled(
        asyncFunctions.map(fn =>
          withRetry(() => fn(...args), {
            maxAttempts: options.maxAttempts || 3,
            delayMs: options.delayMs || 1000,
            backoffMultiplier: options.backoffMultiplier || 2,
          })
        )
      );

      const processedData: Array<T | null> = [];
      const processedErrors: Array<string | null> = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processedData.push(result.value);
          processedErrors.push(null);
        } else {
          processedData.push(null);
          const formattedError = formatGamificationError(result.reason, options.context);
          processedErrors.push(formattedError);
        }
      });

      setData(processedData);
      setErrors(processedErrors);
      setIsLoading(false);

      return processedData.filter((d): d is T => d !== null);
    },
    [asyncFunctions, options]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setErrors([]);
    setData([]);
  }, []);

  return {
    executeBatch,
    isLoading,
    errors,
    data,
    reset,
  };
}
