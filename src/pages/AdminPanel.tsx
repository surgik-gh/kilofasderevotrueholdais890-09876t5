import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Layout } from '../components/Layout';
import { Users, MessageSquare, CheckCircle, BarChart, Send, Shield, BookOpen, Trophy, Filter, Search, Edit, Trash2, Ban, CheckCircle2, UserCog, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { supportTicketService, SupportTicket } from '../services/support.service';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'parent' | 'teacher' | 'administrator';
  wisdom_coins: number;
  subscription_tier: string;
  is_blocked: boolean;
  grade?: string;
  grade_letter?: string;
  created_at: string;
  last_login?: string;
}

export const AdminPanel: React.FC = () => {
  const { users, lessons, quizzes } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets'>('overview');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  
  // User management state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'parent' | 'teacher' | 'administrator'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [coinsAmount, setCoinsAmount] = useState(0);
  const [coinsOperation, setCoinsOperation] = useState<'add' | 'subtract'>('add');

  // Load tickets when tab changes to tickets
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, statusFilter, priorityFilter]);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = allUsers;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [allUsers, searchQuery, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter;
      }

      const fetchedTickets = await supportTicketService.getAllTickets(filters);
      setTickets(fetchedTickets);

      // Fetch user profiles for all ticket creators
      const userIds = [...new Set(fetchedTickets.map(t => t.user_id))];
      const profiles: Record<string, any> = {};
      
      for (const userId of userIds) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, role')
          .eq('id', userId)
          .single();
        
        if (data) {
          profiles[userId] = data;
        }
      }
      
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_blocked: !currentlyBlocked })
        .eq('id', userId);
      
      if (error) throw error;
      
      await loadUsers();
      alert(currentlyBlocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
    } catch (error) {
      console.error('Failed to block/unblock user:', error);
      alert('Ошибка при изменении статуса пользователя');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userToDelete.id);
      
      if (error) throw error;
      
      await loadUsers();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      alert('Пользователь удалён');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: selectedUser.full_name,
          email: selectedUser.email,
          role: selectedUser.role,
          grade: selectedUser.grade,
          grade_letter: selectedUser.grade_letter,
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      await loadUsers();
      setShowUserModal(false);
      setSelectedUser(null);
      alert('Пользователь обновлён');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Ошибка при обновлении пользователя');
    }
  };

  const handleCoinsOperation = async (userId: string) => {
    if (coinsAmount <= 0) {
      alert('Введите корректное количество монет');
      return;
    }
    
    try {
      const { data: currentUser } = await supabase
        .from('user_profiles')
        .select('wisdom_coins')
        .eq('id', userId)
        .single();
      
      if (!currentUser) throw new Error('User not found');
      
      const newAmount = coinsOperation === 'add' 
        ? currentUser.wisdom_coins + coinsAmount
        : Math.max(0, currentUser.wisdom_coins - coinsAmount);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ wisdom_coins: newAmount })
        .eq('id', userId);
      
      if (error) throw error;
      
      await loadUsers();
      setCoinsAmount(0);
      alert(`Монеты ${coinsOperation === 'add' ? 'начислены' : 'списаны'}`);
    } catch (error) {
      console.error('Failed to update coins:', error);
      alert('Ошибка при изменении монет');
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open');

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BarChart },
    { id: 'users', label: `Пользователи (${users.length})`, icon: Users },
    { id: 'tickets', label: `Тикеты (${openTickets.length})`, icon: MessageSquare },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 text-red-700 font-medium text-sm mb-3">
            <Shield className="w-4 h-4" />
            Администрирование
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Панель управления</span>
          </h1>
          <p className="text-slate-500 mt-1">Управление платформой AILesson</p>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all",
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg' 
                  : 'glass text-slate-600 hover:bg-white/80'
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard 
              icon={<Users className="w-6 h-6" />} 
              title="Пользователи" 
              value={users.length} 
              gradient="from-blue-500 to-cyan-500"
              description={`${users.filter(u => u.role === 'student').length} учеников`}
            />
            <StatCard 
              icon={<MessageSquare className="w-6 h-6" />} 
              title="Тикеты" 
              value={tickets.length} 
              gradient="from-purple-500 to-pink-500"
              description={`${openTickets.length} открытых`}
            />
            <StatCard 
              icon={<BookOpen className="w-6 h-6" />} 
              title="Уроки" 
              value={lessons.length} 
              gradient="from-green-500 to-emerald-500"
              description="создано на платформе"
            />
            <StatCard 
              icon={<Trophy className="w-6 h-6" />} 
              title="Викторины" 
              value={quizzes.length} 
              gradient="from-amber-500 to-orange-500"
              description="пройдено тестов"
            />
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="glass rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Поиск</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по имени, email или ID..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Роль</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  >
                    <option value="all">Все роли</option>
                    <option value="student">Ученики</option>
                    <option value="parent">Родители</option>
                    <option value="teacher">Учителя</option>
                    <option value="administrator">Администраторы</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="text-center py-16 glass rounded-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Users className="w-10 h-10 text-primary-500" />
                </div>
                <p className="text-slate-500">Загрузка пользователей...</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600">Пользователь</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Роль</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Монеты</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Статус</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredUsers.map((user, index) => (
                        <motion.tr 
                          key={user.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold",
                                user.role === 'administrator' ? 'bg-gradient-to-br from-red-400 to-rose-500' :
                                user.role === 'teacher' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                                user.role === 'parent' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                'bg-gradient-to-br from-primary-400 to-cyan-500'
                              )}>
                                {user.full_name[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{user.full_name}</div>
                                <div className="text-sm text-slate-500">{user.email}</div>
                                {user.grade && (
                                  <div className="text-xs text-slate-400">Класс: {user.grade}{user.grade_letter}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold",
                              user.role === 'administrator' ? 'bg-red-100 text-red-700' :
                              user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'parent' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            )}>
                              {user.role === 'administrator' ? '👑 Админ' :
                               user.role === 'teacher' ? '👨‍🏫 Учитель' :
                               user.role === 'parent' ? '👪 Родитель' :
                               '🎓 Ученик'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-600">{user.wisdom_coins} 🪙</span>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setCoinsAmount(0);
                                }}
                                className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
                                title="Управление монетами"
                              >
                                <Coins className="w-4 h-4 text-amber-600" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              user.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            )}>
                              {user.is_blocked ? '🚫 Заблокирован' : '✅ Активен'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Редактировать"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleBlockUser(user.id, user.is_blocked)}
                                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                                title={user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                              >
                                {user.is_blocked ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Ban className="w-4 h-4 text-amber-600" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
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
                    <option value="open">Открыт</option>
                    <option value="in_progress">В работе</option>
                    <option value="resolved">Решён</option>
                    <option value="closed">Закрыт</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Приоритет</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  >
                    <option value="all">Все приоритеты</option>
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            {loading ? (
              <div className="text-center py-16 glass rounded-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <MessageSquare className="w-10 h-10 text-primary-500" />
                </div>
                <p className="text-slate-500">Загрузка тикетов...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Нет тикетов</h3>
                <p className="text-slate-500">
                  {statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'Нет тикетов с выбранными фильтрами' 
                    : 'Все пользователи довольны! 🎉'}
                </p>
              </div>
            ) : (
              tickets.map((ticket, index) => {
                const ticketUser = userProfiles[ticket.user_id];
                return (
                  <motion.div 
                    key={ticket.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-2xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {ticketUser?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{ticket.subject}</h3>
                          <p className="text-sm text-slate-500">
                            {ticketUser?.email || 'Неизвестный'} • {ticketUser?.role || 'unknown'} • {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold",
                          ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                          ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        )}>
                          {ticket.priority === 'high' ? '🔴 Высокий' :
                           ticket.priority === 'medium' ? '🟡 Средний' :
                           '🟢 Низкий'}
                        </span>
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold",
                          ticket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        )}>
                          {ticket.status === 'open' ? '⏳ Открыт' :
                           ticket.status === 'in_progress' ? '🔄 В работе' :
                           ticket.status === 'resolved' ? '✅ Решён' :
                           '🔒 Закрыт'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-xl mb-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    <div className="flex gap-2 text-sm text-slate-500">
                      <span>Создан: {new Date(ticket.created_at).toLocaleString('ru-RU')}</span>
                      {ticket.updated_at !== ticket.created_at && (
                        <span>• Обновлён: {new Date(ticket.updated_at).toLocaleString('ru-RU')}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* User Edit Modal */}
        <AnimatePresence>
          {showUserModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowUserModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-6">Редактирование пользователя</h2>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Полное имя</label>
                    <input
                      type="text"
                      value={selectedUser.full_name}
                      onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Роль</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                    >
                      <option value="student">Ученик</option>
                      <option value="parent">Родитель</option>
                      <option value="teacher">Учитель</option>
                      <option value="administrator">Администратор</option>
                    </select>
                  </div>
                  {selectedUser.role === 'student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Класс</label>
                        <input
                          type="text"
                          value={selectedUser.grade || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, grade: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Буква класса</label>
                        <input
                          type="text"
                          value={selectedUser.grade_letter || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, grade_letter: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                          placeholder="А"
                          maxLength={1}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coins Management Modal */}
        <AnimatePresence>
          {selectedUser && !showUserModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-6">Управление монетами</h2>
                <div className="mb-6">
                  <p className="text-slate-600 mb-2">Пользователь: <span className="font-semibold">{selectedUser.full_name}</span></p>
                  <p className="text-slate-600">Текущий баланс: <span className="font-bold text-amber-600">{selectedUser.wisdom_coins} 🪙</span></p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Операция</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCoinsOperation('add')}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-xl font-semibold transition-all",
                          coinsOperation === 'add'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        Начислить
                      </button>
                      <button
                        onClick={() => setCoinsOperation('subtract')}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-xl font-semibold transition-all",
                          coinsOperation === 'subtract'
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        Списать
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Количество монет</label>
                    <input
                      type="number"
                      value={coinsAmount}
                      onChange={(e) => setCoinsAmount(parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                      placeholder="Введите количество"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleCoinsOperation(selectedUser.id)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Применить
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && userToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4 text-red-600">Подтверждение удаления</h2>
                <p className="text-slate-600 mb-6">
                  Вы уверены, что хотите удалить пользователя <span className="font-semibold">{userToDelete.full_name}</span>? 
                  Это действие нельзя отменить.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteUser}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ 
  icon: React.ReactNode, 
  title: string, 
  value: number, 
  gradient: string,
  description: string 
}> = ({ icon, title, value, gradient, description }) => {
  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-800">{value}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
};
