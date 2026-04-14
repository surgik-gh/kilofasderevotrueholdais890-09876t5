/**
 * Tutor Call History Component
 * Displays user's call history with statistics
 */

import React, { useState, useEffect } from 'react';
import { Phone, Clock, Coins, Calendar } from 'lucide-react';
import { tutorCallService } from '../../services/tutor-call.service';
import { useStore } from '../../store';
import type { TutorCallSession } from '../../services/tutor-call.service';

export const TutorCallHistory: React.FC = () => {
  const { user } = useStore();
  const [history, setHistory] = useState<TutorCallSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await tutorCallService.getCallHistory(user.id, 20);
      setHistory(data);
    } catch (err: any) {
      console.error('Failed to load call history:', err);
      setError(err.message || 'Не удалось загрузить историю');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculateStats = () => {
    const completed = history.filter((s) => s.status === 'completed');
    
    return {
      totalCalls: completed.length,
      totalDuration: completed.reduce((sum, s) => sum + s.duration_seconds, 0),
      totalCoins: completed.reduce((sum, s) => sum + s.coins_charged, 0),
      avgDuration: completed.length > 0
        ? Math.floor(completed.reduce((sum, s) => sum + s.duration_seconds, 0) / completed.length)
        : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          История звонков пуста
        </h3>
        <p className="text-gray-600">
          Начните первый звонок с AI репетитором
        </p>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Phone className="w-4 h-4" />
            <span className="text-xs font-medium">Всего звонков</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Общее время</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatDuration(stats.totalDuration)}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-xs font-medium">Потрачено монет</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalCoins.toLocaleString('ru-RU')}
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Средняя длительность</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatDuration(stats.avgDuration)}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          История звонков
        </h3>

        {history.map((session) => (
          <div
            key={session.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-full ${
                    session.status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : session.status === 'active'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {session.subject || 'Общий звонок'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(session.started_at)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span>{session.coins_charged}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    session.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : session.status === 'active'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {session.status === 'completed'
                    ? 'Завершен'
                    : session.status === 'active'
                    ? 'Активен'
                    : 'Отменен'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(session.duration_seconds)}</span>
              </div>
              {session.ended_at && (
                <div className="text-xs text-gray-500">
                  Завершен: {formatDate(session.ended_at)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
