import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import { Plus, Book, Trophy, Zap, School, FileText, Users, TrendingUp, Clock, Target, Hand, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { ParentProgressView } from '../components/parent';
import { leaderboardService } from '../services/leaderboard.service';
import { useSeasonalEvent } from '../hooks/useSeasonalEvent';
import { SeasonalEventBanner } from '../components/gamification/seasonal';
import { RecommendationsSection } from '../components/gamification/recommendations';

export function Dashboard() {
  const { profile, lessons } = useStore();
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Seasonal event hook
  const {
    activeSeasonalEvent,
    userProgress,
    loadUserEventProgress,
    isEventActive,
    getDaysRemaining,
  } = useSeasonalEvent();

  // Debug: log profile state
  useEffect(() => {
    console.log('=== Dashboard Debug ===');
    console.log('profile:', profile);
    console.log('lessons:', lessons);
    console.log('======================');
  }, [profile, lessons]);
  
  // If user is an administrator, show admin-specific dashboard
  if (profile?.role === 'administrator') {
    console.log('Rendering admin dashboard');
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                Привет, <span className="gradient-text">{profile?.full_name}</span>!
                <Hand className="w-7 h-7 text-amber-500" />
              </h1>
              <p className="text-slate-500 mt-1">
                Панель администратора
              </p>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Платформа</p>
                  <h3 className="text-2xl font-bold text-slate-900">AILesson</h3>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 rounded-xl">
                  <Book className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Уроков создано</p>
                  <h3 className="text-2xl font-bold text-slate-900">{lessons.length}</h3>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Статус</p>
                  <h3 className="text-2xl font-bold text-slate-900">Активна</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/admin"
              className="glass rounded-2xl p-6 hover:shadow-xl transition-all card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 text-red-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Тикеты поддержки</h3>
                  <p className="text-slate-500 text-sm">Управление обращениями пользователей</p>
                </div>
              </div>
            </Link>

            <Link
              to="/lessons"
              className="glass rounded-2xl p-6 hover:shadow-xl transition-all card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 rounded-xl">
                  <Book className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Все уроки</h3>
                  <p className="text-slate-500 text-sm">Просмотр всех уроков платформы</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state if profile is not loaded
  if (!profile) {
    console.log('Profile is null, showing loading state');
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Загрузка профиля...</p>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('Rendering Dashboard for:', profile.full_name);

  // Load user stats from services
  useEffect(() => {
    const loadStats = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        // Get rank for students
        if (profile.role === 'student') {
          const userRank = await leaderboardService.getStudentRank(profile.id);
          setRank(userRank);
        }
        
        // Load seasonal event progress if there's an active event
        if (activeSeasonalEvent) {
          await loadUserEventProgress(activeSeasonalEvent.id);
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [profile, activeSeasonalEvent, loadUserEventProgress]);

  const recentLessons = lessons.slice(-3).reverse();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              Привет, <span className="gradient-text">{profile?.full_name}</span>!
              <Hand className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 wiggle-hover" />
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              {profile?.role === 'parent' 
                ? 'Следите за успехами ваших детей.' 
                : 'Готовы к новым знаниям? Сегодня отличный день для обучения.'}
            </p>
          </div>
          
          {(profile?.role === 'student' || profile?.role === 'teacher') && (
            <Link
              to="/create-lesson"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-primary-500/30 btn-shine tap-target text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Создать урок</span>
              <span className="sm:hidden">Создать</span>
            </Link>
          )}
        </motion.div>

        {/* Seasonal Event Banner */}
        {activeSeasonalEvent && isEventActive(activeSeasonalEvent) && (
          <motion.div variants={itemVariants}>
            <SeasonalEventBanner
              event={activeSeasonalEvent}
              userPoints={userProgress?.seasonal_points}
              userRank={userProgress?.rank}
              daysRemaining={getDaysRemaining(activeSeasonalEvent)}
            />
          </motion.div>
        )}

        {/* Recommendations Section - Only for students */}
        {profile?.role === 'student' && (
          <motion.div variants={itemVariants}>
            <RecommendationsSection />
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {/* Coins Card */}
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-xl card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-white/80 font-medium text-sm sm:text-base">Монеты мудрости</p>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    {profile.wisdom_coins}
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/70">
                {profile?.role === 'parent' 
                  ? 'Баланс семьи' 
                  : 'Используйте для уроков и общения с экспертом'}
              </p>
            </div>
          </div>

          {/* Plan Card */}
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 font-medium">Текущий план</p>
                <h3 className="text-2xl font-bold text-slate-900 capitalize">
                  {profile.subscription_tier.split('_')[1] || 'Freemium'}
                </h3>
              </div>
            </div>
            <Link 
              to="/pricing" 
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-semibold group"
            >
              Улучшить план 
              <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Lessons/Rank Card */}
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 rounded-xl">
                {profile?.role === 'student' ? <Trophy className="w-6 h-6" /> : <Book className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-slate-500 font-medium">
                  {profile?.role === 'student' 
                    ? 'Место в рейтинге' 
                    : profile?.role === 'teacher' 
                    ? 'Создано уроков' 
                    : 'Доступно уроков'}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {loading 
                    ? '...' 
                    : profile?.role === 'student' 
                    ? (rank > 0 ? `#${rank}` : 'Нет') 
                    : lessons.length}
                </h3>
              </div>
            </div>
            <Link 
              to={profile?.role === 'student' ? '/leaderboard' : '/lessons'}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-semibold group"
            >
              {profile?.role === 'student' ? 'Смотреть рейтинг' : 'Смотреть все'}
              <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 text-green-600">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Прогресс</p>
              <p className="font-bold text-sm sm:text-base text-slate-800">+15%</p>
            </div>
          </div>
          <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 text-purple-600">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Уроков</p>
              <p className="font-bold text-sm sm:text-base text-slate-800">{lessons.length}</p>
            </div>
          </div>
          <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 text-blue-600">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Дней подряд</p>
              <p className="font-bold text-sm sm:text-base text-slate-800">
                {profile.daily_login_streak}
              </p>
            </div>
          </div>
          <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 text-amber-600">
              <School className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Школа</p>
              <p className="font-bold text-sm sm:text-base text-slate-800">{profile.school_id ? 'Да' : 'Нет'}</p>
            </div>
          </div>
        </motion.div>

        {/* Role Specific Content */}
        {profile?.role === 'parent' && (
          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white">
                <Users className="w-4 h-4" />
              </span>
              Прогресс моих детей
            </h2>
            
            <ParentProgressView parentId={profile.id} />
          </motion.div>
        )}

        {/* Recent Lessons */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-base sm:text-xl">
              {profile?.role === 'teacher' ? 'Последние созданные уроки' : 'Недавние уроки'}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentLessons.map((lesson) => (
              <Link 
                key={lesson.id} 
                to={`/lesson/${lesson.id}`}
                className="group glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 card-hover"
              >
                <div className="h-24 bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                  <Book className="w-10 h-10 text-primary-300 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 rounded-full">
                      {lesson.subject}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                    <span>{new Date(lesson.created_at).toLocaleDateString('ru-RU')}</span>
                    <span className="text-primary-600 font-medium group-hover:translate-x-1 transition-transform">
                      Подробнее →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {recentLessons.length === 0 && (
              <div className="col-span-full py-16 text-center glass rounded-2xl">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Book className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Пока нет уроков. Создайте первый!</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
