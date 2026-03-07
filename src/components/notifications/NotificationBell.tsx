/**
 * NotificationBell Component
 * 
 * Displays a bell icon with unread notification count badge
 * Shows dropdown with recent notifications
 * Allows marking notifications as read
 * Navigates to related content on click
 * 
 * Requirements: 11.8, 11.9
 */

import { useState, useEffect, useRef, memo } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types/platform';
import { cn } from '@/utils/cn';
import { useStore } from '@/store';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = memo(function NotificationBell({ className }: NotificationBellProps) {
  const { profile } = useStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications and unread count
  useEffect(() => {
    if (profile?.id && isOpen) {
      loadNotifications();
    }
  }, [profile?.id, isOpen]);

  // Load unread count on mount and periodically
  useEffect(() => {
    if (profile?.id) {
      loadUnreadCount();
      
      // Refresh count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(profile.id, {
        limit: 10,
      });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!profile?.id) return;
    
    try {
      const count = await notificationService.getUnreadCount(profile.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!profile?.id) return;

    try {
      await notificationService.markAsRead(notificationId, profile.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile?.id) return;

    try {
      await notificationService.markAllAsRead(profile.id);
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read && profile?.id) {
      await handleMarkAsRead(notification.id, { stopPropagation: () => {} } as React.MouseEvent);
    }

    // Navigate to related content based on notification type
    const path = getNotificationPath(notification);
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const getNotificationPath = (notification: Notification): string | null => {
    const data = notification.data as Record<string, string> | undefined;
    
    switch (notification.type) {
      case 'connection_request':
        return '/connections';
      case 'quiz_completed':
        return data?.quiz_id ? `/quiz/${data.quiz_id}/results` : '/dashboard';
      case 'lesson_assigned':
        return data?.lesson_id ? `/lesson/${data.lesson_id}` : '/my-lessons';
      case 'quest_available':
        return '/quests';
      case 'challenge_available':
        return '/challenges';
      case 'support_response':
        return data?.ticket_id ? `/support/ticket/${data.ticket_id}` : '/support';
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'connection_request':
        return '👥';
      case 'quiz_completed':
        return '✅';
      case 'lesson_assigned':
        return '📚';
      case 'quest_available':
        return '🎯';
      case 'challenge_available':
        return '⚔️';
      case 'support_response':
        return '💬';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-white/50 rounded-xl transition-colors tap-target active:scale-95"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed lg:absolute top-16 lg:top-auto right-2 lg:right-0 left-2 lg:left-auto lg:mt-2 w-auto lg:w-96 max-w-[calc(100vw-1rem)] lg:max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Уведомления</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {unreadCount} непрочитанных
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Отметить все как прочитанные"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-600" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[32rem] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 mt-2">Загрузка...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-slate-50 transition-colors relative",
                        !notification.read && "bg-primary-50/30"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="text-2xl shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm font-semibold",
                              notification.read ? "text-slate-700" : "text-slate-900"
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="p-1 hover:bg-white rounded transition-colors shrink-0"
                                title="Отметить как прочитанное"
                              >
                                <Check className="w-3.5 h-3.5 text-primary-600" />
                              </button>
                            )}
                          </div>
                          <p className={cn(
                            "text-sm mt-1 line-clamp-2",
                            notification.read ? "text-slate-500" : "text-slate-600"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Посмотреть все уведомления
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
