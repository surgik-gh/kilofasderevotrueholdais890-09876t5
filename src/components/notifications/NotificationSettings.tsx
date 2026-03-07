/**
 * NotificationSettings Component
 * 
 * Allows users to configure notification preferences
 * Enable/disable notifications by type
 * Saves preferences to user profile or local storage
 * 
 * Requirements: 11.10
 */

import { useState, useEffect } from 'react';
import { Bell, Save, Check } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/utils/cn';

interface NotificationPreferences {
  connection_request: boolean;
  quiz_completed: boolean;
  lesson_assigned: boolean;
  quest_available: boolean;
  challenge_available: boolean;
  support_response: boolean;
  other: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  connection_request: true,
  quiz_completed: true,
  lesson_assigned: true,
  quest_available: true,
  challenge_available: true,
  support_response: true,
  other: true,
};

const NOTIFICATION_TYPES = [
  {
    key: 'connection_request' as const,
    label: 'Запросы на связь',
    description: 'Уведомления о новых запросах на привязку аккаунтов',
    icon: '👥',
  },
  {
    key: 'quiz_completed' as const,
    label: 'Завершение квизов',
    description: 'Уведомления о завершении квизов вами или вашими учениками',
    icon: '✅',
  },
  {
    key: 'lesson_assigned' as const,
    label: 'Назначение уроков',
    description: 'Уведомления о новых назначенных уроках',
    icon: '📚',
  },
  {
    key: 'quest_available' as const,
    label: 'Доступные квесты',
    description: 'Уведомления о новых ежедневных квестах',
    icon: '🎯',
  },
  {
    key: 'challenge_available' as const,
    label: 'Доступные челленджи',
    description: 'Уведомления о новых еженедельных челленджах',
    icon: '⚔️',
  },
  {
    key: 'support_response' as const,
    label: 'Ответы поддержки',
    description: 'Уведомления об ответах службы поддержки на ваши тикеты',
    icon: '💬',
  },
  {
    key: 'other' as const,
    label: 'Прочие уведомления',
    description: 'Другие системные уведомления и обновления',
    icon: '🔔',
  },
];

export function NotificationSettings() {
  const { profile } = useStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (profile?.id) {
      const storageKey = `notification_preferences_${profile.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch (error) {
          console.error('Failed to parse notification preferences:', error);
        }
      }
    }
  }, [profile?.id]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      // Save to localStorage
      const storageKey = `notification_preferences_${profile.id}`;
      localStorage.setItem(storageKey, JSON.stringify(preferences));

      // In a real implementation, you might also want to save to the backend
      // await notificationService.updatePreferences(profile.id, preferences);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = () => {
    setPreferences({
      connection_request: true,
      quiz_completed: true,
      lesson_assigned: true,
      quest_available: true,
      challenge_available: true,
      support_response: true,
      other: true,
    });
    setSaved(false);
  };

  const handleDisableAll = () => {
    setPreferences({
      connection_request: false,
      quiz_completed: false,
      lesson_assigned: false,
      quest_available: false,
      challenge_available: false,
      support_response: false,
      other: false,
    });
    setSaved(false);
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Настройки уведомлений</h1>
        <p className="text-slate-600">
          Управляйте типами уведомлений, которые вы хотите получать
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 mb-6 border border-primary-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {enabledCount} из {NOTIFICATION_TYPES.length} типов включено
            </h3>
            <p className="text-sm text-slate-600">
              {enabledCount === NOTIFICATION_TYPES.length
                ? 'Вы получаете все уведомления'
                : enabledCount === 0
                ? 'Все уведомления отключены'
                : 'Некоторые уведомления отключены'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleEnableAll}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
        >
          Включить все
        </button>
        <button
          onClick={handleDisableAll}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
        >
          Отключить все
        </button>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="divide-y divide-slate-100">
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type.key} className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl shrink-0 mt-1">
                  {type.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-800 mb-1">
                    {type.label}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {type.description}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(type.key)}
                  className={cn(
                    "relative w-14 h-8 rounded-full transition-colors shrink-0",
                    preferences[type.key]
                      ? "bg-primary-500"
                      : "bg-slate-300"
                  )}
                  aria-label={`Toggle ${type.label}`}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform",
                      preferences[type.key]
                        ? "translate-x-7"
                        : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Изменения сохраняются автоматически
        </p>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={cn(
            "px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2",
            saved
              ? "bg-green-500 text-white"
              : "bg-primary-500 text-white hover:bg-primary-600"
          )}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Сохранение...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Сохранено
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Сохранить настройки
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>Примечание:</strong> Отключение уведомлений не удаляет их из системы, 
          а только скрывает их отображение. Вы всегда можете просмотреть все уведомления 
          на странице уведомлений.
        </p>
      </div>
    </div>
  );
}
