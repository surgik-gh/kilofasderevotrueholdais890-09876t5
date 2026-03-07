/**
 * NotificationList Component
 * 
 * Full list of notifications with filtering and pagination
 * Filter by type and read/unread status
 * Paginated display for large notification lists
 * 
 * Requirements: 11.7, 11.8
 */

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types/platform';
import { cn } from '@/utils/cn';
import { useStore } from '@/store';

const ITEMS_PER_PAGE = 20;

type NotificationType = Notification['type'] | 'all';
type ReadFilter = 'all' | 'unread' | 'read';

export function NotificationList() {
  const { profile } = useStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load notifications when filters or page changes
  useEffect(() => {
    if (profile?.id) {
      loadNotifications();
    }
  }, [profile?.id, typeFilter, readFilter, currentPage]);

  const loadNotifications = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const options: {
        type?: Notification['type'];
        read?: boolean;
        limit: number;
        offset: number;
      } = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      };

      if (typeFilter !== 'all') {
        options.type = typeFilter as Notification['type'];
      }

      if (readFilter === 'unread') {
        options.read = false;
      } else if (readFilter === 'read') {
        options.read = true;
      }

      const data = await notificationService.getNotifications(profile.id, options);
      setNotifications(data);
      
      // For total count, we'd need a separate query or count from backend
      // For now, we'll estimate based on returned data
      setTotalCount(data.length === ITEMS_PER_PAGE ? (currentPage * ITEMS_PER_PAGE) + 1 : (currentPage - 1) * ITEMS_PER_PAGE + data.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!profile?.id) return;

    try {
      await notificationService.markAsRead(notificationId, profile.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
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
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read && profile?.id) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to related content
    const path = getNotificationPath(notification);
    if (path) {
      navigate(path);
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

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'all':
        return 'Все';
      case 'connection_request':
        return 'Запросы на связь';
      case 'quiz_completed':
        return 'Квизы';
      case 'lesson_assigned':
        return 'Уроки';
      case 'quest_available':
        return 'Квесты';
      case 'challenge_available':
        return 'Челленджи';
      case 'support_response':
        return 'Поддержка';
      default:
        return 'Другое';
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
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Уведомления</h1>
        <p className="text-slate-600">
          Все ваши уведомления в одном месте
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Type Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Тип уведомления
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as NotificationType);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">Все типы</option>
              <option value="connection_request">Запросы на связь</option>
              <option value="quiz_completed">Квизы</option>
              <option value="lesson_assigned">Уроки</option>
              <option value="quest_available">Квесты</option>
              <option value="challenge_available">Челленджи</option>
              <option value="support_response">Поддержка</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {/* Read Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Статус
            </label>
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value as ReadFilter);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">Все</option>
              <option value="unread">Непрочитанные</option>
              <option value="read">Прочитанные</option>
            </select>
          </div>

          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                Отметить все
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500">Загрузка уведомлений...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Нет уведомлений
            </h3>
            <p className="text-slate-500">
              {typeFilter !== 'all' || readFilter !== 'all'
                ? 'Попробуйте изменить фильтры'
                : 'У вас пока нет уведомлений'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-6 hover:bg-slate-50 transition-colors relative",
                    !notification.read && "bg-primary-50/30"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="text-3xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className={cn(
                            "text-base font-semibold mb-1",
                            notification.read ? "text-slate-700" : "text-slate-900"
                          )}>
                            {notification.title}
                          </h3>
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors shrink-0"
                            title="Отметить как прочитанное"
                          >
                            <Check className="w-4 h-4 text-primary-600" />
                          </button>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm mb-3",
                        notification.read ? "text-slate-500" : "text-slate-600"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Страница {currentPage} из {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={cn(
                        "px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2",
                        currentPage === 1
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Назад
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={cn(
                        "px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2",
                        currentPage === totalPages
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      )}
                    >
                      Вперед
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
