# Gamification Error Handling & Loading States Guide

This guide explains how to use the error handling and loading state components in the gamification system.

## Components

### 1. GamificationErrorDisplay

Main error display component with context-aware messaging and retry functionality.

```tsx
import { GamificationErrorDisplay } from '@/components/gamification/shared';

<GamificationErrorDisplay
  error={error}
  context="achievements" // or 'quests', 'experience', etc.
  onRetry={retryFunction}
  onDismiss={dismissFunction}
/>
```

**Props:**
- `error`: string | Error | null - The error to display
- `context`: Context type for appropriate icon and message
- `onRetry`: Optional callback for retry button
- `onDismiss`: Optional callback for dismiss button
- `className`: Optional additional CSS classes

### 2. InlineGamificationError

Compact error display for inline use within forms or smaller contexts.

```tsx
import { InlineGamificationError } from '@/components/gamification/shared';

<InlineGamificationError
  error={error}
  onRetry={retryFunction}
/>
```

### 3. GamificationEmptyState

Empty state component for when no data is available.

```tsx
import { GamificationEmptyState } from '@/components/gamification/shared';

<GamificationEmptyState
  title="No Achievements Yet"
  message="Complete lessons and quizzes to unlock achievements!"
  icon={Award}
  action={loadAchievements}
  actionLabel="Refresh"
/>
```

## Skeleton Loaders

### Available Skeletons

- `AchievementCardSkeleton`
- `QuestCardSkeleton`
- `LevelDisplaySkeleton`
- `ChallengeCardSkeleton`
- `MilestoneCardSkeleton`
- `StreakDisplaySkeleton`
- `SeasonalEventBannerSkeleton`
- `LeaderboardEntrySkeleton`

### Usage

```tsx
import { 
  AchievementCardSkeleton,
  SkeletonGrid,
  SkeletonList 
} from '@/components/gamification/shared';

// Single skeleton
<AchievementCardSkeleton />

// Grid of skeletons
<SkeletonGrid count={6} component={AchievementCardSkeleton} />

// List of skeletons
<SkeletonList count={5} component={QuestCardSkeleton} />
```

### Loading Spinner

```tsx
import { GamificationLoadingSpinner } from '@/components/gamification/shared';

<GamificationLoadingSpinner message="Loading achievements..." />
```

## Hooks

### useGamificationAsync

Enhanced async operation hook with automatic retry logic and error formatting.

```tsx
import { useGamificationAsync } from '@/hooks/useGamificationAsync';

const loadAchievementsAsync = useGamificationAsync(
  (userId: string) => achievementService.getUserAchievements(userId),
  {
    context: 'Достижения',
    maxAttempts: 3,
    delayMs: 1000,
    onSuccess: () => console.log('Success!'),
    onError: (err) => console.error('Error:', err),
  }
);

// Execute
const result = await loadAchievementsAsync.execute(userId);

// Retry
await loadAchievementsAsync.retry();

// Access state
const { isLoading, error, data, retryCount } = loadAchievementsAsync;
```

### useGamificationBatchAsync

For executing multiple async operations with individual error handling.

```tsx
import { useGamificationBatchAsync } from '@/hooks/useGamificationAsync';

const batchAsync = useGamificationBatchAsync(
  [loadAchievements, loadQuests, loadExperience],
  { context: 'Gamification Data' }
);

const results = await batchAsync.executeBatch(userId);
```

## Retry Utilities

### withRetry

Execute any async operation with automatic retry logic.

```tsx
import { withRetry } from '@/utils/gamification-retry';

const result = await withRetry(
  () => apiCall(),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error);
    },
  }
);
```

### formatGamificationError

Format errors into user-friendly messages.

```tsx
import { formatGamificationError } from '@/utils/gamification-retry';

const userMessage = formatGamificationError(error, 'Достижения');
```

## Complete Example

Here's a complete example of a component with proper error handling and loading states:

```tsx
import { useEffect } from 'react';
import { useGamificationAsync } from '@/hooks/useGamificationAsync';
import {
  GamificationErrorDisplay,
  AchievementCardSkeleton,
  SkeletonGrid,
  GamificationEmptyState,
} from '@/components/gamification/shared';
import { achievementService } from '@/services/gamification/achievement.service';

export function AchievementsView({ userId }: { userId: string }) {
  const {
    execute,
    retry,
    isLoading,
    error,
    data: achievements,
  } = useGamificationAsync(
    (id: string) => achievementService.getUserAchievements(id),
    {
      context: 'Достижения',
      maxAttempts: 3,
    }
  );

  useEffect(() => {
    execute(userId);
  }, [userId]);

  // Error state
  if (error && !achievements) {
    return (
      <GamificationErrorDisplay
        error={error}
        context="achievements"
        onRetry={retry}
      />
    );
  }

  // Loading state
  if (isLoading && !achievements) {
    return <SkeletonGrid count={6} component={AchievementCardSkeleton} />;
  }

  // Empty state
  if (!achievements || achievements.length === 0) {
    return (
      <GamificationEmptyState
        title="No Achievements Yet"
        message="Complete lessons and quizzes to unlock achievements!"
        action={retry}
        actionLabel="Refresh"
      />
    );
  }

  // Success state
  return (
    <div>
      {achievements.map(achievement => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}
```

## Best Practices

1. **Always provide context**: Use the `context` prop to give users specific error messages
2. **Enable retry**: Always provide an `onRetry` callback for recoverable errors
3. **Show skeletons during initial load**: Use skeleton loaders instead of spinners for better UX
4. **Handle empty states**: Show helpful empty states with actions when no data is available
5. **Use inline errors for forms**: Use `InlineGamificationError` for form validation errors
6. **Batch operations carefully**: Use `useGamificationBatchAsync` for multiple independent operations
7. **Log errors**: Always log errors to console for debugging while showing user-friendly messages
8. **Test error scenarios**: Test network failures, timeouts, and permission errors

## Error Types

The system automatically handles these error types:

- **Network errors**: Connection issues, timeouts
- **Authentication errors**: 401 Unauthorized
- **Permission errors**: 403 Forbidden
- **Not found errors**: 404 Not Found
- **Server errors**: 500 Internal Server Error

Each error type gets a user-friendly message in Russian.
