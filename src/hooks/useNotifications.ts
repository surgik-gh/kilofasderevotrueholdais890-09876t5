import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import type { GamificationNotification } from '@/store';

/**
 * useNotifications Hook
 * 
 * Manages gamification notifications display and lifecycle
 * 
 * Requirements:
 * - 10.1: Show notification when achievement is unlocked
 * - 10.2: Show full-screen animation when level up occurs
 * - 10.3: Show notification when quest is completed
 * - 10.4: Show notification when milestone is achieved
 * - 10.5: Show notification when streak is achieved
 * - 10.6: Show progress summary on login
 * - 10.7: Allow disabling specific notification types in settings
 */
export function useNotifications() {
  const notifications = useStore((state) => state.notifications);
  const dismissNotification = useStore((state) => state.dismissNotification);
  const clearNotifications = useStore((state) => state.clearNotifications);

  const [currentNotification, setCurrentNotification] = useState<GamificationNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<GamificationNotification[]>([]);

  // Update queue when notifications change
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      setNotificationQueue(notifications);
    }
  }, [notifications, currentNotification]);

  // Show next notification from queue
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      const [next, ...rest] = notificationQueue;
      setCurrentNotification(next);
      setNotificationQueue(rest);
    }
  }, [currentNotification, notificationQueue]);

  const handleClose = () => {
    if (currentNotification) {
      dismissNotification(currentNotification.id);
      setCurrentNotification(null);
    }
  };

  const clearAll = () => {
    clearNotifications();
    setCurrentNotification(null);
    setNotificationQueue([]);
  };

  return {
    currentNotification,
    notificationQueue,
    hasNotifications: notifications.length > 0,
    notificationCount: notifications.length,
    handleClose,
    clearAll,
  };
}

/**
 * useNotificationSettings Hook
 * 
 * Manages user preferences for notifications
 */
interface NotificationSettings {
  achievement: boolean;
  level_up: boolean;
  quest: boolean;
  milestone: boolean;
  streak: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  achievement: true,
  level_up: true,
  quest: true,
  milestone: true,
  streak: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem('notification_settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  const updateSetting = (type: keyof NotificationSettings, enabled: boolean) => {
    const newSettings = { ...settings, [type]: enabled };
    setSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  };

  const isEnabled = (type: keyof NotificationSettings) => {
    return settings[type];
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('notification_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return {
    settings,
    updateSetting,
    isEnabled,
    resetToDefaults,
  };
}

/**
 * Helper function to create notifications
 */
export function createNotification(
  type: GamificationNotification['type'],
  title: string,
  message: string,
  icon?: string,
  animation?: string
): Omit<GamificationNotification, 'id' | 'timestamp'> {
  return {
    type,
    title,
    message,
    icon,
    animation,
  };
}
