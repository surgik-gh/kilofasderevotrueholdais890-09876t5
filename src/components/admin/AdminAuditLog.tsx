import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Download, Calendar, User, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadLogs();
  }, [actionFilter, userFilter, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Note: In a real implementation, you would have an audit_logs table
      // For now, we'll create mock data based on recent activities
      
      // This is a placeholder - in production you'd query actual audit logs
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          user_id: 'admin-1',
          action: 'user.created',
          resource_type: 'user',
          resource_id: 'user-123',
          details: { email: 'newuser@example.com', role: 'student' },
          created_at: new Date().toISOString(),
          user: {
            full_name: 'Администратор',
            email: 'admin@ailesson.ru',
            role: 'administrator'
          }
        },
        {
          id: '2',
          user_id: 'admin-1',
          action: 'user.blocked',
          resource_type: 'user',
          resource_id: 'user-456',
          details: { reason: 'Нарушение правил' },
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user: {
            full_name: 'Администратор',
            email: 'admin@ailesson.ru',
            role: 'administrator'
          }
        },
        {
          id: '3',
          user_id: 'admin-1',
          action: 'school.created',
          resource_type: 'school',
          resource_id: 'school-789',
          details: { name: 'Школа №1', address: 'Москва' },
          created_at: new Date(Date.now() - 7200000).toISOString(),
          user: {
            full_name: 'Администратор',
            email: 'admin@ailesson.ru',
            role: 'administrator'
          }
        },
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Дата', 'Пользователь', 'Действие', 'Тип ресурса', 'ID ресурса', 'Детали'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('ru-RU'),
        log.user?.email || 'Unknown',
        log.action,
        log.resource_type,
        log.resource_id,
        JSON.stringify(log.details)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user.created': '👤 Создан пользователь',
      'user.updated': '✏️ Обновлён пользователь',
      'user.deleted': '🗑️ Удалён пользователь',
      'user.blocked': '🚫 Заблокирован пользователь',
      'user.unblocked': '✅ Разблокирован пользователь',
      'school.created': '🏫 Создана школа',
      'school.updated': '✏️ Обновлена школа',
      'school.deleted': '🗑️ Удалена школа',
      'connection.deleted': '🔗 Удалена связь',
      'content.deleted': '📝 Удалён контент',
      'coins.added': '💰 Начислены монеты',
      'coins.removed': '💸 Списаны монеты',
      'settings.updated': '⚙️ Обновлены настройки',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-700';
    if (action.includes('deleted')) return 'bg-red-100 text-red-700';
    if (action.includes('blocked')) return 'bg-red-100 text-red-700';
    if (action.includes('updated')) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Журнал аудита</h2>
          <p className="text-slate-500">История критических операций</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Download className="w-5 h-5" />
          Экспорт
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-bold text-slate-800">Фильтры</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Действие</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            >
              <option value="all">Все действия</option>
              <option value="user">Пользователи</option>
              <option value="school">Школы</option>
              <option value="connection">Связи</option>
              <option value="content">Контент</option>
              <option value="coins">Монеты</option>
              <option value="settings">Настройки</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Пользователь</label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Email пользователя"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Дата от</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Дата до</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileText className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-slate-500">Загрузка логов...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Нет записей</h3>
          <p className="text-slate-500">Журнал аудита пуст</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      getActionColor(log.action)
                    )}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {log.resource_type} • {log.resource_id}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-semibold">{log.user?.full_name}</span>
                    <span className="text-slate-400">({log.user?.email})</span>
                  </div>

                  {log.details && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                      <pre className="text-xs text-slate-600 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(log.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(log.created_at).toLocaleTimeString('ru-RU')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="glass rounded-2xl p-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <Activity className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-blue-900 mb-1">О журнале аудита</h4>
            <p className="text-sm text-blue-700">
              Журнал аудита записывает все критические операции на платформе, включая создание, изменение и удаление пользователей, 
              школ, связей и контента. Все записи содержат информацию о пользователе, выполнившем операцию, и временную метку.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
