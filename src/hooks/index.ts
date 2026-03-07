/**
 * Custom hooks for Zustand store integration
 * 
 * These hooks provide a clean interface for components to interact with
 * the global state, including optimistic updates and real-time subscriptions.
 */

export { useAuth } from './useAuth';
export { useTokens } from './useTokens';
export { useLeaderboard } from './useLeaderboard';
export { useChats } from './useChats';
export { useLessons } from './useLessons';
export { useQuizzes } from './useQuizzes';
export { useSupport } from './useSupport';

// Gamification hooks
export { useAchievements } from './useAchievements';
export { useExperience } from './useExperience';
export { useQuests } from './useQuests';
export { useChallenges } from './useChallenges';
export { useMilestones } from './useMilestones';
export { useStreaks } from './useStreaks';
export { useSeasonalEvent } from './useSeasonalEvent';
export { useNotifications, useNotificationSettings, createNotification } from './useNotifications';
export { useRecommendations } from './useRecommendations';
