/**
 * Utility for handling async operations with loading and error states
 */

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export async function withLoadingAndError<T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T> {
  setLoading(true);
  setError(null);

  try {
    const result = await operation();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
}

export function createAsyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): T {
  return (async (...args: Parameters<T>) => {
    return withLoadingAndError(() => fn(...args), setLoading, setError);
  }) as T;
}
