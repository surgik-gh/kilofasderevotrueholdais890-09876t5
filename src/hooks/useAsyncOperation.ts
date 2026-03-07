import { useState, useCallback } from 'react';

interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseAsyncOperationReturn<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
  retry: () => Promise<T | undefined>;
}

export function useAsyncOperation<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [lastArgs, setLastArgs] = useState<any[]>([]);

  const {
    onSuccess,
    onError,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const executeWithRetry = useCallback(
    async (args: any[], attempt: number = 0): Promise<T | undefined> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await asyncFunction(...args);
        setData(result);
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        // Retry logic
        if (attempt < retryAttempts) {
          console.log(`Retry attempt ${attempt + 1}/${retryAttempts}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          return executeWithRetry(args, attempt + 1);
        }

        setError(error);
        onError?.(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction, onSuccess, onError, retryAttempts, retryDelay]
  );

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setLastArgs(args);
      return executeWithRetry(args);
    },
    [executeWithRetry]
  );

  const retry = useCallback(async (): Promise<T | undefined> => {
    if (lastArgs.length === 0) {
      console.warn('No previous arguments to retry with');
      return undefined;
    }
    return executeWithRetry(lastArgs);
  }, [lastArgs, executeWithRetry]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
    setLastArgs([]);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
    retry,
  };
}
