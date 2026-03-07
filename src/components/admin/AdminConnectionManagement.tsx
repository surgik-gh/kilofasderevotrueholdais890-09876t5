import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Filter, CheckCircle, XCircle, Trash2, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  request_type: 'parent_child' | 'teacher_school' | 'student_school';
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  from_user: {
    full_name: string;
    email: string;
    role: string;
  };
  to_user: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface Connection {
  id: string;
  parent_id?: string;
  child_id?: string;
  user_id?: string;
  school_id?: string;
  role?: string;
  created_at: string;
  type: 'parent_child' | 'school_membership';
}

export const AdminConnectionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'connections'>('requests');
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'parent_child' | 'teacher_school' | 'student_school'>('all');

  useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests();
    } else {
      loadConnections();
    }
  }, [activeTab, statusFilter, typeFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('connection_requests')
        .select(`
          *,
          from_user:user_profiles!connection_requests_from_user_id_fkey(full_name, email, role),
          to_user:user_profiles!connection_requests_to_user_id_fkey(full_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('request_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    setLoading(true);
    try {
      // Load parent-child links
      const { data: parentChildLinks, error: pcError } = await supabase
        .from('parent_child_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (pcError) throw pcError;

      // Load school memberships
      const { data: schoolMemberships, error: smError } = await supabase
        .from('school_memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (smError) throw smError;

      const allConnections: Connection[] = [
        ...(parentChildLinks || []).map(link => ({ ...link, type: 'parent_child' as const })),
        ...(schoolMemberships || []).map(membership => ({ ...membership, type: 'school_membership' as const }))
      ];

      setConnections(allConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      await loadRequests();
      alert('Запрос принят');
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('Ошибка при принятии запроса');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      await loadRequests();
      alert('Запрос отклонён');
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Ошибка при отклонении запроса');
    }
  };

  const handleDeleteConnection = async (connection: Connection) => {
    if (!confirm('Удалить эту связь? Это действие нельзя отменить.')) return;

    try {
      if (connection.type === 'parent_child') {
        const { error } = await supabase
          .from('parent_child_links')
          .delete()
          .eq('id', connection.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('school_memberships')
          .delete()
          .eq('id', connection.id);

        if (error) throw error;
      }

      await loadConnections();
      alert('Связь удалена');
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('Ошибка при удалении связи');
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'parent_child': return '👪 Родитель-Ребёнок';
      case 'teacher_school': return '👨‍🏫 Учитель-Школа';
      case 'student_school': return '🎓 Ученик-Школа';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Ожидает';
      case 'accepted': return '✅ Принят';
      case 'rejected': return '❌ Отклонён';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Управление связями</h2>
        <p className="text-slate-500">Запросы и установленные связи</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
              : 'glass text-slate-600 hover:bg-white/80'
          )}
        >
          <Link2 className="w-5 h-5" />
          Запросы ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'connections'
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
              : 'glass text-slate-600 hover:bg-white/80'
          )}
        >
          <Users className="w-5 h-5" />
          Связи ({connections.length})
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'requests' && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-bold text-slate-800">Фильтры</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Ожидает</option>
                <option value="accepted">Принят</option>
                <option value="rejected">Отклонён</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Тип</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
              >
                <option value="all">Все типы</option>
                <option value="parent_child">Родитель-Ребёнок</option>
                <option value="teacher_school">Учитель-Школа</option>
                <option value="student_school">Ученик-Школа</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Link2 className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-slate-500">Загрузка...</p>
        </div>
      ) : activeTab === 'requests' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <p className="text-slate-500">Нет запросов</p>
            </div>
          ) : (
            requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {getRequestTypeLabel(request.request_type)}
                      </span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="text-slate-800">
                      <span className="font-semibold">{request.from_user.full_name}</span>
                      {' → '}
                      <span className="font-semibold">{request.to_user.full_name}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {request.from_user.email} → {request.to_user.email}
                    </p>
                    {request.message && (
                      <p className="mt-2 text-sm text-slate-600 italic">"{request.message}"</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(request.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                        title="Принять"
                      >
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Отклонить"
                      >
                        <XCircle className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <p className="text-slate-500">Нет установленных связей</p>
            </div>
          ) : (
            connections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={cn(
                      "inline-block px-3 py-1 rounded-full text-xs font-bold mb-2",
                      connection.type === 'parent_child' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {connection.type === 'parent_child' ? '👪 Родитель-Ребёнок' : '🏫 Школа'}
                    </span>
                    <p className="text-slate-800">
                      {connection.type === 'parent_child' ? (
                        <>
                          Родитель: {connection.parent_id}<br />
                          Ребёнок: {connection.child_id}
                        </>
                      ) : (
                        <>
                          Пользователь: {connection.user_id}<br />
                          Школа: {connection.school_id}<br />
                          Роль: {connection.role}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Создано: {new Date(connection.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteConnection(connection)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Удалить связь"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
