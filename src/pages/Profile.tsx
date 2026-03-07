import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStore } from '../store';
import { 
  User, Camera, Save, X, 
  Mail, Award, Clock, Sparkles, Shield, Trophy, TrendingUp
} from 'lucide-react';
import { cn } from '../utils/cn';
import { authService } from '../services/auth.service';
import { tokenEconomyService } from '../services/token-economy.service';
import { subscriptionService } from '../services/subscription.service';
import { useExperience } from '../hooks/useExperience';
import { useMilestones } from '../hooks/useMilestones';
import { useStreaks } from '../hooks/useStreaks';
import { useAchievements } from '../hooks/useAchievements';
import { useQuests } from '../hooks/useQuests';
import { LevelDisplay, ExperienceBar, LevelStats } from '../components/gamification/level';
import { MilestoneProgress } from '../components/gamification/milestones';
import { StreakDisplay } from '../components/gamification/streaks';
import { ProgressBar, ProgressCharts, TimeRangeSelector } from '../components/gamification/shared';

export default function Profile() {
  const { profile, lessons, quizResults } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name || '');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Use experience hook
  const {
    userLevel,
    isLoading: levelLoading,
    getCurrentLevel,
    getCurrentXP,
    getTotalXP,
    getXPToNextLevel,
    getProgressPercentage,
  } = useExperience();

  // Use milestones hook
  const {
    milestones: userMilestones,
    allMilestones,
    isLoading: milestonesLoading,
    getUnachievedMilestones,
  } = useMilestones();

  // Use streaks hook
  const {
    streaks,
    isLoading: streaksLoading,
  } = useStreaks();

  // Use achievements hook
  const {
    achievements: userAchievements,
    isLoading: achievementsLoading,
  } = useAchievements();

  // Use quests hook
  const {
    activeQuests,
    isLoading: questsLoading,
  } = useQuests();

  if (!profile) return null;

  // Load user profile data from services
  useEffect(() => {
    const loadProfile = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        // Get balance
        const userBalance = await tokenEconomyService.getBalance(profile.id);
        setBalance(userBalance);
        
        // Get streak
        setStreak(profile.daily_login_streak);
        
        // Get subscription details
        const subDetails = subscriptionService.getSubscriptionDetails(profile.subscription_tier);
        setSubscriptionDetails(subDetails);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      // Update profile through auth service
      await authService.updateProfile(profile.id, {
        full_name: name,
      });
      
      setIsEditing(false);
      alert('Профиль обновлен!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Не удалось обновить профиль. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const userLessons = lessons.filter(l => l.creator_id === profile.id);
  const userResults = quizResults.filter(r => r.userId === profile.id);
  const avgScore = userResults.length > 0
    ? Math.round(userResults.reduce((sum, r) => sum + r.score, 0) / userResults.length)
    : 0;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!profile) return { experience: [], achievements: [] };

    // Generate experience data from quiz results and lessons
    const experienceMap = new Map<string, number>();
    
    // Add experience from lessons (50 XP each)
    userLessons.forEach(lesson => {
      const date = new Date(lesson.created_at).toISOString().split('T')[0];
      experienceMap.set(date, (experienceMap.get(date) || 0) + 50);
    });

    // Add experience from quizzes
    userResults.forEach(result => {
      const date = new Date(result.timestamp).toISOString().split('T')[0];
      const xp = result.score + (result.score === 100 ? 50 : 0);
      experienceMap.set(date, (experienceMap.get(date) || 0) + xp);
    });

    const experienceData = Array.from(experienceMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate achievements data
    const unlockedAchievements = userAchievements.filter((a: any) => a.unlocked);
    const achievementsMap = new Map<string, number>();
    
    unlockedAchievements.forEach((achievement: any) => {
      if (achievement.unlocked_at) {
        const date = new Date(achievement.unlocked_at).toISOString().split('T')[0];
        achievementsMap.set(date, (achievementsMap.get(date) || 0) + 1);
      }
    });

    const achievementsData = Array.from(achievementsMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { experience: experienceData, achievements: achievementsData };
  }, [profile, userLessons, userResults, userAchievements]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
      {/* Header */}
      <div className="liquid-glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.full_name[0].toUpperCase()
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(profile.full_name);
                      setAvatarPreview(avatarPreview || '');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  >
                    <X className="w-5 h-5" />
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-800">{profile.full_name}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <User className="w-5 h-5" />
                    Редактировать
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Shield className="w-4 h-4" />
                    {profile.role === 'teacher' ? 'Учитель' :
                     profile.role === 'parent' ? 'Родитель' : 'Ученик'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {loading ? '...' : (subscriptionDetails?.tier.split('_')[1] || profile.subscription_tier.split('_')[1])}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Серия: {loading ? '...' : streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
                  </span>
                  {profile.school_id && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Школа: {profile.school_id}
                      {profile.role === 'student' && (
                        <span className="text-xs text-gray-400 ml-1">(нельзя изменить)</span>
                      )}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Level and Experience Section */}
      {!levelLoading && userLevel && (
        <div className="liquid-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            Уровень и опыт
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Level Display */}
            <div className="flex items-center justify-center">
              <LevelDisplay level={getCurrentLevel()} size="lg" />
            </div>

            {/* Experience Progress */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Прогресс к уровню {getCurrentLevel() + 1}
                  </span>
                  <span className="text-sm font-semibold text-purple-600">
                    {getCurrentXP()} / {getXPToNextLevel()} XP
                  </span>
                </div>
                <ExperienceBar 
                  level={getCurrentLevel()}
                  currentXP={getCurrentXP()}
                  xpToNextLevel={getXPToNextLevel()}
                  showLabel={false}
                />
              </div>

              {/* Level Stats */}
              <LevelStats 
                level={getCurrentLevel()}
                currentXP={getCurrentXP()}
                totalXP={getTotalXP()}
                xpToNextLevel={getXPToNextLevel()}
              />
            </div>
          </div>

          {/* Level History Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">История уровней</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white/50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Текущий уровень</div>
                <div className="text-xl font-bold text-purple-600">{getCurrentLevel()}</div>
              </div>
              <div className="p-3 bg-white/50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Всего опыта</div>
                <div className="text-xl font-bold text-blue-600">{getTotalXP()}</div>
              </div>
              <div className="p-3 bg-white/50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">До следующего</div>
                <div className="text-xl font-bold text-amber-600">{getXPToNextLevel() - getCurrentXP()}</div>
              </div>
              <div className="p-3 bg-white/50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Прогресс</div>
                <div className="text-xl font-bold text-emerald-600">{getProgressPercentage()}%</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-purple-700">Совет:</span> Создавайте уроки (+50 XP), 
                проходите викторины (до 150 XP) и выполняйте квесты для быстрого повышения уровня!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Streaks Section */}
      {!streaksLoading && streaks.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              Активные серии
            </h2>
            <Link 
              to="/profile"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Подробнее
            </Link>
          </div>
          <StreakDisplay streaks={streaks} />
        </div>
      )}

      {/* Next Milestones Section */}
      {!milestonesLoading && allMilestones.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Прогресс к вехам
            </h2>
            <Link 
              to="/profile"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Все вехи
            </Link>
          </div>
          <div className="space-y-4">
            {getUnachievedMilestones().slice(0, 3).map((userMilestone) => {
              const milestone = allMilestones.find(m => m.id === userMilestone.milestone_id);
              if (!milestone) return null;
              
              const currentValue = 
                milestone.category === 'lessons_created' ? userLessons.length :
                milestone.category === 'quizzes_completed' ? userResults.length :
                milestone.category === 'wisdom_coins' ? balance :
                milestone.category === 'level_reached' ? getCurrentLevel() : 0;
              
              return (
                <MilestoneProgress
                  key={milestone.id}
                  milestone={milestone}
                  currentValue={currentValue}
                  showDetails={true}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Active Goals Progress Section */}
      {!questsLoading && activeQuests.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Активные цели
            </h2>
            <Link 
              to="/quests"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Все квесты
            </Link>
          </div>
          <div className="space-y-4">
            {activeQuests.slice(0, 3).map((userQuest) => {
              const quest = userQuest as any; // Type assertion for quest data
              
              return (
                <div key={userQuest.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {quest.title || 'Квест'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {userQuest.progress} / {quest.condition_value}
                    </span>
                  </div>
                  <ProgressBar
                    current={userQuest.progress}
                    max={quest.condition_value}
                    color="blue"
                    size="sm"
                    showPercentage={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Charts Section */}
      {!achievementsLoading && (chartData.experience.length > 0 || chartData.achievements.length > 0) && (
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Статистика прогресса
            </h2>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
          <ProgressCharts
            experienceData={chartData.experience}
            achievementsData={chartData.achievements}
            timeRange={timeRange}
          />
        </div>
      )}

      {/* Stats Cards */}
      {(
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Монеты мудрости', value: loading ? '...' : balance, icon: Award, color: 'from-amber-400 to-orange-500' },
            { label: 'Создано уроков', value: userLessons.length, icon: Sparkles, color: 'from-primary-500 to-purple-500' },
            { label: 'Средний балл', value: avgScore > 0 ? `${avgScore}%` : '—', icon: Shield, color: 'from-emerald-500 to-teal-500' },
            { label: 'Пройдено тестов', value: userResults.length, icon: Clock, color: 'from-pink-500 to-rose-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="liquid-glass rounded-xl p-4"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Subscription Details */}
      {!loading && subscriptionDetails && (
        <div className="liquid-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Детали подписки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Раз в две недели</div>
              <div className="text-xl font-bold text-gray-800">{subscriptionDetails.biweekly_tokens} монет</div>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Ежедневный бонус</div>
              <div className="text-xl font-bold text-gray-800">{subscriptionDetails.daily_login_tokens} монет</div>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Бесплатных запросов</div>
              <div className="text-xl font-bold text-gray-800">{subscriptionDetails.free_expert_queries} в день</div>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Trophy className="w-4 h-4" />
              Улучшить подписку
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {userResults.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Последние результаты тестов</h2>
          <div className="space-y-3">
            {userResults.slice(-5).reverse().map((result, i) => {
              const lesson = lessons.find(l => l.id === result.quizId);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                      result.score >= 80 ? "bg-gradient-to-br from-green-400 to-green-500" :
                      result.score >= 60 ? "bg-gradient-to-br from-yellow-400 to-yellow-500" :
                      "bg-gradient-to-br from-red-400 to-red-500"
                    )}>
                      {result.score}%
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {lesson?.title || 'Тест'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(result.timestamp).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Lessons */}
      {userLessons.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Мои уроки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userLessons.slice(-4).reverse().map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 bg-white/50 rounded-xl hover:bg-white/80 transition-colors"
              >
                <h3 className="font-medium text-gray-800 mb-1">{lesson.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{lesson.subject}</span>
                  <span>•</span>
                  <span>{new Date(lesson.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
    </Layout>
  );
}


