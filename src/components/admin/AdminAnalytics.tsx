import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Trophy, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface PlatformStats {
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  parentCount: number;
  adminCount: number;
  totalLessons: number;
  totalQuizzes: number;
  totalChatSessions: number;
  activeUsersToday: number;
  activeUsersMonth: number;
}

export const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    studentCount: 0,
    teacherCount: 0,
    parentCount: 0,
    adminCount: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    totalChatSessions: 0,
    activeUsersToday: 0,
    activeUsersMonth: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Load user stats
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('role, last_login');

      if (usersError) throw usersError;

      const totalUsers = users?.length || 0;
      const studentCount = users?.filter(u => u.role === 'student').length || 0;
      const teacherCount = users?.filter(u => u.role === 'teacher').length || 0;
      const parentCount = users?.filter(u => u.role === 'parent').length || 0;
      const adminCount = users?.filter(u => u.role === 'administrator').length || 0;

      // Calculate active users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const activeUsersToday = users?.filter(u => {
        if (!u.last_login) return false;
        const loginDate = new Date(u.last_login);
        return loginDate >= today;
      }).length || 0;

      const activeUsersMonth = users?.filter(u => {
        if (!u.last_login) return false;
        const loginDate = new Date(u.last_login);
        return loginDate >= monthAgo;
      }).length || 0;

      // Load content stats
      const { count: lessonsCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      const { count: quizzesCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true });

      const { count: chatSessionsCount } = await supabase
        .from('ai_chat_sessions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers,
        studentCount,
        teacherCount,
        parentCount,
        adminCount,
        totalLessons: lessonsCount || 0,
        totalQuizzes: quizzesCount || 0,
        totalChatSessions: chatSessionsCount || 0,
        activeUsersToday,
        activeUsersMonth,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Аналитика платформы</h2>
        <p className="text-slate-500">Общая статистика и метрики</p>
      </div>

      {loading ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-slate-500">Загрузка статистики...</p>
        </div>
      ) : (
        <>
          {/* User Stats */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Пользователи</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Всего"
                value={stats.totalUsers}
                gradient="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Ученики"
                value={stats.studentCount}
                gradient="from-primary-500 to-purple-500"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Учителя"
                value={stats.teacherCount}
                gradient="from-purple-500 to-pink-500"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Родители"
                value={stats.parentCount}
                gradient="from-amber-500 to-orange-500"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                title="Админы"
                value={stats.adminCount}
                gradient="from-red-500 to-rose-500"
              />
            </div>
          </div>

          {/* Activity Stats */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Активность</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title="Активных сегодня (DAU)"
                value={stats.activeUsersToday}
                gradient="from-green-500 to-emerald-500"
                description={`${((stats.activeUsersToday / stats.totalUsers) * 100).toFixed(1)}% от всех`}
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Активных за месяц (MAU)"
                value={stats.activeUsersMonth}
                gradient="from-blue-500 to-indigo-500"
                description={`${((stats.activeUsersMonth / stats.totalUsers) * 100).toFixed(1)}% от всех`}
              />
            </div>
          </div>

          {/* Content Stats */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Контент</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                icon={<BookOpen className="w-6 h-6" />}
                title="Уроки"
                value={stats.totalLessons}
                gradient="from-green-500 to-emerald-500"
                description="создано на платформе"
              />
              <StatCard
                icon={<Trophy className="w-6 h-6" />}
                title="Квизы"
                value={stats.totalQuizzes}
                gradient="from-amber-500 to-orange-500"
                description="доступно для прохождения"
              />
              <StatCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="AI Чаты"
                value={stats.totalChatSessions}
                gradient="from-purple-500 to-pink-500"
                description="сессий с Alies AI"
              />
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Метрики вовлечённости</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Уроков на учителя</span>
                  <span className="text-sm font-bold text-primary-600">
                    {stats.teacherCount > 0 ? (stats.totalLessons / stats.teacherCount).toFixed(1) : 0}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                    style={{ width: `${Math.min((stats.totalLessons / stats.teacherCount / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Квизов на учителя</span>
                  <span className="text-sm font-bold text-amber-600">
                    {stats.teacherCount > 0 ? (stats.totalQuizzes / stats.teacherCount).toFixed(1) : 0}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${Math.min((stats.totalQuizzes / stats.teacherCount / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Чатов на пользователя</span>
                  <span className="text-sm font-bold text-purple-600">
                    {stats.totalUsers > 0 ? (stats.totalChatSessions / stats.totalUsers).toFixed(1) : 0}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min((stats.totalChatSessions / stats.totalUsers / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  gradient: string;
  description?: string;
}> = ({ icon, title, value, gradient, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 card-hover"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-800">{value}</p>
        </div>
      </div>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </motion.div>
  );
};
