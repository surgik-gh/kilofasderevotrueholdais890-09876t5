# Supabase Error Handling Guide

This document describes the centralized error handling system for Supabase operations.

## Overview

The platform now includes a comprehensive error handling system that provides:

1. **User-friendly error messages** - Technical errors are converted to readable messages
2. **Automatic retry logic** - Transient errors (network issues, timeouts) are automatically retried
3. **Error logging** - Critical errors are logged for admin review
4. **Consistent error handling** - All services use the same error handling approach

## Error Handler Location

The error handler is located at: `src/utils/supabase-error-handler.ts`

## Features

### 1. User-Friendly Error Messages

Technical Supabase errors are automatically converted to user-friendly messages:

```typescript
// Before: "PGRST301: JWT expired"
// After: "Доступ запрещен. У вас нет прав для выполнения этой операции"
```

### 2. Automatic Retry Logic

Network errors and timeouts are automatically retried with exponential backoff:

```typescript
import { withRetry } from '../utils/supabase-error-handler';

const data = await withRetry(
  async () => {
    const { data, error } = await supabase.from('users').select();
    if (error) throw error;
    return data;
  },
  3,  // max retries
  1000 // base delay in ms
);
```

### 3. Error Logging

Critical errors are automatically logged for debugging:

```typescript
// Errors are logged with:
// - Timestamp
// - Operation name
// - Error details
// - User context
// - Browser information
```

### 4. Comprehensive Error Wrapper

Use `executeSupabaseOperation` for complete error handling:

```typescript
import { executeSupabaseOperation } from '../utils/supabase-error-handler';

const result = await executeSupabaseOperation(
  async () => {
    const { data, error } = await supabase.from('table').select();
    if (error) throw error;
    return data;
  },
  'fetch_users', // operation name for logging
  {
    retry: true,        // enable retry
    maxRetries: 3,      // max retry attempts
    logCritical: true   // log critical errors
  }
);
```

## Error Types Handled

### Authentication Errors
- Invalid credentials
- Email not confirmed
- Email already exists
- Rate limiting
- Invalid API key

### Database Errors
- Unique constraint violations
- Foreign key violations
- Table not found
- RLS policy violations
- Not found errors

### Network Errors
- Connection timeouts
- Network failures
- Fetch errors

## Usage in Services

### Example 1: Auth Service

```typescript
import { handleSupabaseError, logCriticalError } from '../utils/supabase-error-handler';

try {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
} catch (error) {
  const userError = handleSupabaseError(error);
  logCriticalError('user_registration', error);
  throw new Error(userError.message);
}
```

### Example 2: Data Fetching with Retry

```typescript
import { executeSupabaseOperation } from '../utils/supabase-error-handler';

async function fetchUserProfile(userId: string) {
  return await executeSupabaseOperation(
    async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    'fetch_user_profile',
    { retry: true, maxRetries: 3 }
  );
}
```

### Example 3: Manual Error Handling

```typescript
import { handleSupabaseError } from '../utils/supabase-error-handler';

try {
  const { data, error } = await supabase.from('table').insert(values);
  if (error) throw error;
  return data;
} catch (error) {
  const userError = handleSupabaseError(error);
  
  // Display to user
  showErrorToast({
    title: userError.title,
    message: userError.message
  });
  
  // Check if retryable
  if (userError.retryable) {
    // Offer retry option to user
  }
}
```

## Error Response Format

All errors are converted to this format:

```typescript
interface UserFriendlyError {
  title: string;      // Short error title
  message: string;    // Detailed user-friendly message
  code: string;       // Error code for programmatic handling
  retryable?: boolean; // Whether the error can be retried
}
```

## Best Practices

1. **Always use the error handler** - Don't create custom error messages for Supabase errors
2. **Enable retry for read operations** - Network issues are common, retry helps
3. **Don't retry write operations by default** - Avoid duplicate data
4. **Log critical errors** - Helps with debugging production issues
5. **Display user-friendly messages** - Use the `message` field from error handler

## Migration Guide

To migrate existing code to use the error handler:

### Before:
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch data');
  }
  return data;
} catch (error) {
  throw error;
}
```

### After:
```typescript
import { executeSupabaseOperation } from '../utils/supabase-error-handler';

return await executeSupabaseOperation(
  async () => {
    const { data, error } = await supabase.from('table').select();
    if (error) throw error;
    return data;
  },
  'fetch_data',
  { retry: true }
);
```

## Testing

The error handler includes comprehensive error mapping. Test by:

1. Triggering various Supabase errors
2. Verifying user-friendly messages are displayed
3. Checking retry logic works for transient errors
4. Confirming critical errors are logged

## Future Enhancements

Planned improvements:

1. Integration with external logging services (Sentry, LogRocket)
2. Error analytics dashboard
3. Automatic error reporting to admins
4. Circuit breaker pattern for repeated failures
5. Custom retry strategies per operation type

## Support

For questions or issues with error handling:
- Check the error handler source code: `src/utils/supabase-error-handler.ts`
- Review error logs in browser console (development)
- Contact the development team for production issues
