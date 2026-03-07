import { ReactNode, useState, useEffect, useRef } from 'react';
import { RobotEyes } from './RobotEyes';
import { useStore } from '@/store';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  LayoutDashboard, 
  MessageCircle, 
  Trophy, 
  CreditCard,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  Bot,
  ChevronRight,
  Coins,
  Library,
  Clock,
  TrendingUp,
  Star,
  Target,
  Swords,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { SUBJECT_CATEGORIES } from '@/utils/subjects';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/notifications';
import { supabase } from '@/lib/supabase';

interface LayoutProps {
  children: ReactNode;
  isThinking?: boolean;
  celebrating?: boolean;
}

export function Layout({ children, isThinking = false, celebrating = false }: LayoutProps) {
  const { profile, logout, lessons, leaderboard, users } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showQuickPanel, setShowQuickPanel] = useState(false);
  const [notificationTrigger, setNotificationTrigger] = useState(0);
  
  // Swipe gesture support
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Set up real-time notifications subscription
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to notifications table for real-time updates
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          // Trigger notification bell to refresh
          setNotificationTrigger(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          // Trigger notification bell to refresh
          setNotificationTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sidebarRef.current) return;
    
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Only allow swipe to close when sidebar is open
    if (isSidebarOpen && diff < 0) {
      setSwipeOffset(Math.max(diff, -320)); // Max swipe distance
    }
    // Allow swipe to open from left edge
    else if (!isSidebarOpen && touchStartX.current < 20 && diff > 0) {
      setSwipeOffset(Math.min(diff, 320));
    }
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Threshold for opening/closing (40% of sidebar width)
    const threshold = 128;
    
    if (isSidebarOpen && diff < -threshold) {
      setIsSidebarOpen(false);
    } else if (!isSidebarOpen && diff > threshold) {
      setIsSidebarOpen(true);
    }
    
    // Reset swipe offset
    setSwipeOffset(0);
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  if (!profile) {
    return <div className="min-h-screen">{children}</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build navigation based on role
  const getNavItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Главная', path: '/dashboard' },
    ];
    
    // Role-specific navigation
    if (profile?.role === 'administrator') {
      return [
        ...baseItems,
        { icon: Bot, label: 'Alies AI', path: '/alies-chat', highlight: true },
        { icon: Settings, label: 'Админ-панель', path: '/admin' },
        { icon: Users, label: 'Пользователи', path: '/admin/users' },
        { icon: BookOpen, label: 'Контент', path: '/admin/content' },
        { icon: BarChart3, label: 'Аналитика', path: '/admin/analytics' },
        { icon: HelpCircle, label: 'Поддержка', path: '/support' },
      ];
    }
    
    if (profile?.role === 'parent') {
      return [
        ...baseItems,
        { icon: Bot, label: 'Alies AI', path: '/alies-chat', highlight: true },
        { icon: Users, label: 'Мои дети', path: '/children' },
        { icon: Users, label: 'Связи', path: '/connections' },
        { icon: BarChart3, label: 'Прогресс', path: '/progress' },
        { icon: MessageCircle, label: 'Сообщения', path: '/chat' },
        { icon: HelpCircle, label: 'Поддержка', path: '/support' },
      ];
    }
    
    if (profile?.role === 'teacher') {
      return [
        ...baseItems,
        { icon: Bot, label: 'Alies AI', path: '/alies-chat', highlight: true },
        { icon: BookOpen, label: 'Создать урок', path: '/create-lesson' },
        { icon: Library, label: 'Мои уроки', path: '/my-lessons' },
        { icon: Users, label: 'Ученики', path: '/students' },
        { icon: Users, label: 'Связи', path: '/connections' },
        { icon: BarChart3, label: 'Аналитика класса', path: '/class-analytics' },
        { icon: MessageCircle, label: 'Сообщения', path: '/chat' },
        { icon: Trophy, label: 'Лидеры', path: '/leaderboard' },
        { icon: HelpCircle, label: 'Поддержка', path: '/support' },
      ];
    }
    
    // Student (default)
    return [
      ...baseItems,
      { icon: Bot, label: 'Alies AI', path: '/alies-chat', highlight: true },
      { icon: BookOpen, label: 'Создать урок', path: '/create-lesson' },
      { icon: Library, label: 'Мои уроки', path: '/my-lessons' },
      { icon: MessageCircle, label: 'Сообщения', path: '/chat' },
      { icon: Trophy, label: 'Лидеры', path: '/leaderboard' },
      { icon: Star, label: 'Достижения', path: '/achievements' },
      { icon: Target, label: 'Квесты', path: '/quests' },
      { icon: Swords, label: 'Челленджи', path: '/challenges' },
      { icon: Users, label: 'Связи', path: '/connections' },
      { icon: CreditCard, label: 'Подписка', path: '/pricing' },
      { icon: HelpCircle, label: 'Поддержка', path: '/support' },
    ];
  };
  
  const navItems = getNavItems();

  const recentLessons = lessons.slice(-3).reverse();
  const topUsers = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen flex relative">
      <RobotEyes isThinking={isThinking} celebrating={celebrating} />
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: swipeOffset !== 0 
            ? `translateX(${isSidebarOpen ? swipeOffset : swipeOffset - 320}px)` 
            : undefined
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 liquid-glass transition-transform duration-300 ease-out lg:translate-x-0 lg:static flex flex-col shadow-2xl lg:shadow-none touch-pan-y",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg relative overflow-hidden tap-target">
              <Sparkles className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">AILesson</h1>
              <p className="text-xs text-slate-500">Alies AI Platform</p>
            </div>
          </div>
          <button 
            className="ml-auto lg:hidden p-2.5 hover:bg-white/50 rounded-xl transition-colors tap-target active:scale-95"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        {/* User Quick Info - Mobile Friendly */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <Link 
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm shadow-sm hover:from-white/80 hover:to-white/60 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden">
              {profile.full_name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {profile.full_name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Coins className="w-3 h-3" />
                  {profile.wisdom_coins}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-primary-600 capitalize font-medium">
                  {profile.subscription_tier.split('_')[1] || 'Freemium'}
                </span>
              </div>
            </div>
          </Link>

          {/* Notifications Bell */}
          <NotificationBell key={notificationTrigger} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-thin">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isHighlight = 'highlight' in item && (item as { highlight?: boolean }).highlight === true;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden tap-target active:scale-98",
                    location.pathname === item.path
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                      : isHighlight 
                        ? "text-primary-600 bg-gradient-to-r from-primary-50 to-purple-50 hover:from-primary-100 hover:to-purple-100 border border-primary-200"
                        : "text-slate-600 hover:bg-white/70 hover:text-primary-600"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0",
                    isHighlight && location.pathname !== item.path ? "text-primary-500" : ""
                  )} />
                  <span className="text-base sm:text-sm">{item.label}</span>
                  {isHighlight && location.pathname !== item.path && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-full">
                      AI
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Subjects Section */}
          <div className="space-y-2 pt-2">
            <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Library className="w-3.5 h-3.5" />
              Предметы
            </h3>
              {Object.entries(SUBJECT_CATEGORIES).map(([category, subjects]) => (
                <div key={category}>
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/50 rounded-xl transition-all tap-target active:scale-98"
                  >
                    <span>{category}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200",
                      expandedCategory === category && "rotate-90"
                    )} />
                  </button>
                  <AnimatePresence>
                    {expandedCategory === category && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 py-1 space-y-0.5">
                          {subjects.map((subject) => (
                            <Link
                              key={subject}
                              to={`/lessons?subject=${encodeURIComponent(subject)}`}
                              className="block px-4 py-2.5 text-sm text-slate-600 hover:text-primary-600 hover:bg-white/50 rounded-lg transition-all tap-target"
                            >
                              {subject}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/20 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all tap-target active:scale-98"
          >
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:hidden safe-area-inset-top glass border-b border-white/20 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 hover:bg-white/50 rounded-xl transition-colors tap-target active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">AILesson</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell key={notificationTrigger} />
            <Link
              to="/alies-chat"
              className="p-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg tap-target active:scale-95 transition-transform"
              aria-label="AI Chat"
            >
              <Bot className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setShowQuickPanel(!showQuickPanel)}
              className="p-2.5 hover:bg-white/50 rounded-xl transition-colors tap-target active:scale-95"
              aria-label="Quick stats"
            >
              <TrendingUp className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Quick Stats Panel (Mobile) */}
        <AnimatePresence>
          {showQuickPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-b border-slate-100"
            >
              <div className="p-4 bg-gradient-to-r from-primary-50/50 to-purple-50/50 space-y-4">
                {/* Recent Lessons */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Недавние уроки
                  </h4>
                  <div className="space-y-2">
                    {recentLessons.length > 0 ? recentLessons.map(lesson => (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${lesson.id}`}
                        className="flex items-center gap-3 p-2 bg-white/70 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{lesson.title}</p>
                          <p className="text-xs text-slate-500">{lesson.subject}</p>
                        </div>
                      </Link>
                    )) : (
                      <p className="text-sm text-slate-400 italic">Нет уроков</p>
                    )}
                  </div>
                </div>

                {/* Top Users */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    Лидеры дня
                  </h4>
                  <div className="flex gap-2">
                    {topUsers.map((entry, index) => {
                      const entryUser = users.find(u => u.id === entry.student_id);
                      return (
                        <div
                          key={entry.student_id}
                          className="flex-1 p-2 bg-white/70 rounded-xl text-center"
                        >
                          <div className={cn(
                            "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-white font-bold text-sm",
                            index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                            index === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                            "bg-gradient-to-br from-amber-600 to-amber-700"
                          )}>
                            {index + 1}
                          </div>
                          <p className="text-xs font-medium text-slate-800 mt-1 truncate">{entryUser?.name || 'Пользователь'}</p>
                          <p className="text-xs text-primary-600 font-bold">{entry.score}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto safe-area-inset-bottom">
          {children}
        </div>
      </main>
    </div>
  );
}
