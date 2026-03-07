import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Trophy, Medal, Crown, Flame, Star, Award, Coins, Users, Calendar, TrendingUp, Target, Zap, Filter } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { leaderboardService } from '@/services/leaderboard.service';
import { supabase } from '@/lib/supabase';
import { RankBadge } from '@/components/leaderboard';
import type { LeaderboardEntry } from '@/lib/supabase';

interface LeaderboardEntryWithProfile extends LeaderboardEntry {
  profile?: {
    full_name: string;
    email: string;
    school_id?: string;
  };
}

interface AchievementLeaderboardEntry {
  user_id: string;
  full_name: string;
  school_id?: string;
  achievement_count: number;
  rank: number;
}

interface LevelLeaderboardEntry {
  user_id: string;
  full_name: string;
  school_id?: string;
  level: number;
  total_experience: number;
  rank: number;
}

interface School {
  id: string;
  name: string;
}

type LeaderboardTab = 'score' | 'achievements' | 'level' | 'experience';
type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('score');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [schools, setSchools] = useState<School[]>([]);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithProfile[]>([]);
  const [achievementLeaderboard, setAchievementLeaderboard] = useState<AchievementLeaderboardEntry[]>([]);
  const [levelLeaderboard, setLevelLeaderboard] = useState<LevelLeaderboardEntry[]>([]);
  const [experienceLeaderboard, setExperienceLeaderboard] = useState<LevelLeaderboardEntry[]>([]);
  
  const [studentHistory, setStudentHistory] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserSchoolId, setCurrentUserSchoolId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch current user and schools
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Get user's school
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.school_id) {
          setCurrentUserSchoolId(profile.school_id);
        }
      }
    };
    
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      
      if (!error && data) {
        setSchools(data);
      }
    };
    
    fetchCurrentUser();
    fetchSchools();
  }, []);

  // Fetch leaderboard data based on active tab
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === 'score') {
          await fetchScoreLeaderboard();
        } else if (activeTab === 'achievements') {
          await fetchAchievementLeaderboard();
        } else if (activeTab === 'level') {
          await fetchLevelLeaderboard();
        } else if (activeTab === 'experience') {
          await fetchExperienceLeaderboard();
        }

        // Fetch student history if current user is a student (only for score tab)
        if (currentUserId && activeTab === 'score') {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', currentUserId)
            .single();

          if (userProfile?.role === 'student') {
            const days = periodFilter === 'week' ? 7 : periodFilter === 'month' ? 30 : 7;
            const history = await leaderboardService.getStudentHistory(currentUserId, days);
            setStudentHistory(history);
          }
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Не удалось загрузить таблицу лидеров');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUserId, activeTab, periodFilter, schoolFilter]);

  const fetchScoreLeaderboard = async () => {
    // Get today's leaderboard
    const entries = await leaderboardService.getDailyLeaderboard();

    // Fetch user profiles for each entry
    const entriesWithProfiles = await Promise.all(
      entries.map(async (entry) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, email, school_id')
          .eq('id', entry.student_id)
          .single();

        return {
          ...entry,
          profile: profile || undefined,
        };
      })
    );

    // Apply school filter
    const filtered = schoolFilter === 'all' 
      ? entriesWithProfiles 
      : entriesWithProfiles.filter(e => e.profile?.school_id === schoolFilter);

    setLeaderboard(filtered);
  };

  const fetchAchievementLeaderboard = async () => {
    // Get all users with their achievement counts
    const { data: userAchievements, error } = await supabase
      .from('user_achievements')
      .select('user_id, unlocked')
      .eq('unlocked', true);

    if (error) throw error;

    // Count achievements per user
    const achievementCounts = new Map<string, number>();
    userAchievements?.forEach(ua => {
      const count = achievementCounts.get(ua.user_id) || 0;
      achievementCounts.set(ua.user_id, count + 1);
    });

    // Get user profiles
    const userIds = Array.from(achievementCounts.keys());
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, school_id')
      .in('id', userIds);

    if (!profiles) return;

    // Build leaderboard entries
    let entries: AchievementLeaderboardEntry[] = profiles.map(profile => ({
      user_id: profile.id,
      full_name: profile.full_name,
      school_id: profile.school_id,
      achievement_count: achievementCounts.get(profile.id) || 0,
      rank: 0,
    }));

    // Apply school filter
    if (schoolFilter !== 'all') {
      entries = entries.filter(e => e.school_id === schoolFilter);
    }

    // Sort by achievement count and assign ranks
    entries.sort((a, b) => b.achievement_count - a.achievement_count);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setAchievementLeaderboard(entries);
  };

  const fetchLevelLeaderboard = async () => {
    // Get all user levels
    const { data: userLevels, error } = await supabase
      .from('user_levels')
      .select('user_id, level, total_experience');

    if (error) throw error;

    // Get user profiles
    const userIds = userLevels?.map(ul => ul.user_id) || [];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, school_id')
      .in('id', userIds);

    if (!profiles) return;

    // Build leaderboard entries
    let entries: LevelLeaderboardEntry[] = profiles.map(profile => {
      const levelData = userLevels?.find(ul => ul.user_id === profile.id);
      return {
        user_id: profile.id,
        full_name: profile.full_name,
        school_id: profile.school_id,
        level: levelData?.level || 1,
        total_experience: levelData?.total_experience || 0,
        rank: 0,
      };
    });

    // Apply school filter
    if (schoolFilter !== 'all') {
      entries = entries.filter(e => e.school_id === schoolFilter);
    }

    // Sort by level (then by total_experience as tiebreaker) and assign ranks
    entries.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.total_experience - a.total_experience;
    });
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLevelLeaderboard(entries);
  };

  const fetchExperienceLeaderboard = async () => {
    // Get all user levels
    const { data: userLevels, error } = await supabase
      .from('user_levels')
      .select('user_id, level, total_experience');

    if (error) throw error;

    // Get user profiles
    const userIds = userLevels?.map(ul => ul.user_id) || [];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, school_id')
      .in('id', userIds);

    if (!profiles) return;

    // Build leaderboard entries
    let entries: LevelLeaderboardEntry[] = profiles.map(profile => {
      const levelData = userLevels?.find(ul => ul.user_id === profile.id);
      return {
        user_id: profile.id,
        full_name: profile.full_name,
        school_id: profile.school_id,
        level: levelData?.level || 1,
        total_experience: levelData?.total_experience || 0,
        rank: 0,
      };
    });

    // Apply school filter
    if (schoolFilter !== 'all') {
      entries = entries.filter(e => e.school_id === schoolFilter);
    }

    // Sort by total_experience and assign ranks
    entries.sort((a, b) => b.total_experience - a.total_experience);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setExperienceLeaderboard(entries);
  };

  const handleSimulateRewards = async () => {
    try {
      await leaderboardService.performDailyReset();
      alert('Награды выданы!\n1 место: 50 монет\n2 место: 25 монет\n3 место: 10 монет');
      // Refresh leaderboard
      window.location.reload();
    } catch (err) {
      console.error('Failed to perform daily reset:', err);
      alert('Ошибка при выдаче наград');
    }
  };

  // Calculate time until 18:00
  const now = new Date();
  const target = new Date();
  target.setHours(18, 0, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const hoursLeft = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesLeft = Math.floor(((target.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

  const getRankReward = (rank: number) => {
    if (rank === 1) return '50 монет';
    if (rank === 2) return '25 монет';
    if (rank === 3) return '10 монет';
    return 'Участник';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const renderStudentHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl overflow-hidden shadow-2xl bg-white"
    >
      <div className="relative p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <TrendingUp className="w-10 h-10 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">Ваша история</h3>
            <p className="text-white/70">Последние 7 дней</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {studentHistory.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {formatDate(entry.date)}
                </p>
              </div>
              {entry.rank && entry.rank <= 3 ? (
                <RankBadge rank={entry.rank} size="sm" showReward />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">
                    {entry.rank ? `#${entry.rank}` : '-'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{entry.score} очков</p>
                {entry.reward_coins > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                    <Coins className="w-3 h-3" />
                    +{entry.reward_coins}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderScoreLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="relative p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Star className="w-10 h-10 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Топ учеников</h3>
              <p className="text-white/70">Обновляется в реальном времени</p>
            </div>
          </div>
          <button 
            onClick={handleSimulateRewards}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            [DEV] Выдать награды
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="bg-gradient-to-b from-slate-50 to-white px-6 py-8">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {leaderboard[1]?.profile?.full_name?.[0] || '?'}
              </div>
              <p className="font-bold text-slate-800 truncate max-w-24">{leaderboard[1]?.profile?.full_name || 'Ученик'}</p>
              <p className="text-sm text-slate-500">{leaderboard[1]?.score} pts</p>
              <div className="mt-2 h-16 w-20 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg flex items-center justify-center">
                <Medal className="w-8 h-8 text-slate-400" />
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center -mt-4"
            >
              <div className="relative">
                <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-1 drop-shadow-lg" />
              </div>
              <div className="w-24 h-24 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl ring-4 ring-yellow-200">
                {leaderboard[0]?.profile?.full_name?.[0] || '?'}
              </div>
              <p className="font-bold text-slate-800 truncate max-w-28">{leaderboard[0]?.profile?.full_name || 'Ученик'}</p>
              <p className="text-sm text-slate-500">{leaderboard[0]?.score} pts</p>
              <div className="mt-2 h-24 w-24 bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-lg flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-600" />
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {leaderboard[2]?.profile?.full_name?.[0] || '?'}
              </div>
              <p className="font-bold text-slate-800 truncate max-w-24">{leaderboard[2]?.profile?.full_name || 'Ученик'}</p>
              <p className="text-sm text-slate-500">{leaderboard[2]?.score} pts</p>
              <div className="mt-2 h-12 w-20 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-lg flex items-center justify-center">
                <Medal className="w-8 h-8 text-amber-600" />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Full List */}
      <div className="bg-white divide-y divide-slate-100">
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "flex items-center p-4 hover:bg-slate-50 transition-colors",
                entry.student_id === currentUserId && "bg-primary-50/50"
              )}
            >
              <div className="w-12 flex-shrink-0 text-center">
                {entry.rank === 1 && <Crown className="w-6 h-6 text-yellow-500 mx-auto drop-shadow" />}
                {entry.rank === 2 && <Medal className="w-6 h-6 text-slate-400 mx-auto" />}
                {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-600 mx-auto" />}
                {entry.rank && entry.rank > 3 && <span className="font-bold text-slate-400">#{entry.rank}</span>}
              </div>
              
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ml-2",
                entry.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                entry.rank === 2 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                entry.rank === 3 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                "bg-gradient-to-br from-primary-400 to-purple-500"
              )}>
                {entry.profile?.full_name?.[0] || '?'}
              </div>
              
              <div className="flex-1 ml-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  {entry.profile?.full_name || 'Ученик'}
                  {entry.student_id === currentUserId && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Вы</span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {entry.rank && entry.rank <= 3 && <Coins className="w-3 h-3" />}
                  {entry.rank ? getRankReward(entry.rank) : 'Участник'}
                </p>
              </div>

              <div className="font-mono font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-500">
                {entry.score}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg">Пока никто не набрал очков сегодня.</p>
            <p className="text-slate-400 text-sm mt-1">Будьте первыми! Создавайте уроки и проходите викторины.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderAchievementLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl overflow-hidden shadow-2xl bg-white"
    >
      {/* Header */}
      <div className="relative p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Award className="w-10 h-10 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">По достижениям</h3>
            <p className="text-white/70">Кто собрал больше всего достижений</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {achievementLeaderboard.length > 0 ? (
          achievementLeaderboard.map((entry, index) => (
            <motion.div 
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "flex items-center p-4 hover:bg-slate-50 transition-colors",
                entry.user_id === currentUserId && "bg-primary-50/50"
              )}
            >
              <div className="w-12 flex-shrink-0 text-center">
                {entry.rank === 1 && <Crown className="w-6 h-6 text-yellow-500 mx-auto drop-shadow" />}
                {entry.rank === 2 && <Medal className="w-6 h-6 text-slate-400 mx-auto" />}
                {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-600 mx-auto" />}
                {entry.rank > 3 && <span className="font-bold text-slate-400">#{entry.rank}</span>}
              </div>
              
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ml-2",
                entry.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                entry.rank === 2 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                entry.rank === 3 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                "bg-gradient-to-br from-primary-400 to-purple-500"
              )}>
                {entry.full_name[0] || '?'}
              </div>
              
              <div className="flex-1 ml-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  {entry.full_name}
                  {entry.user_id === currentUserId && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Вы</span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {entry.achievement_count} {entry.achievement_count === 1 ? 'достижение' : entry.achievement_count < 5 ? 'достижения' : 'достижений'}
                </p>
              </div>

              <div className="font-mono font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                {entry.achievement_count}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg">Пока никто не получил достижений.</p>
            <p className="text-slate-400 text-sm mt-1">Будьте первыми!</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderLevelLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl overflow-hidden shadow-2xl bg-white"
    >
      {/* Header */}
      <div className="relative p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Target className="w-10 h-10 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">По уровню</h3>
            <p className="text-white/70">Кто достиг самого высокого уровня</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {levelLeaderboard.length > 0 ? (
          levelLeaderboard.map((entry, index) => (
            <motion.div 
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "flex items-center p-4 hover:bg-slate-50 transition-colors",
                entry.user_id === currentUserId && "bg-primary-50/50"
              )}
            >
              <div className="w-12 flex-shrink-0 text-center">
                {entry.rank === 1 && <Crown className="w-6 h-6 text-yellow-500 mx-auto drop-shadow" />}
                {entry.rank === 2 && <Medal className="w-6 h-6 text-slate-400 mx-auto" />}
                {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-600 mx-auto" />}
                {entry.rank > 3 && <span className="font-bold text-slate-400">#{entry.rank}</span>}
              </div>
              
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ml-2",
                entry.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                entry.rank === 2 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                entry.rank === 3 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                "bg-gradient-to-br from-primary-400 to-purple-500"
              )}>
                {entry.full_name[0] || '?'}
              </div>
              
              <div className="flex-1 ml-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  {entry.full_name}
                  {entry.user_id === currentUserId && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Вы</span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Уровень {entry.level}
                </p>
              </div>

              <div className="font-mono font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                {entry.level}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg">Нет данных об уровнях.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderExperienceLeaderboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl overflow-hidden shadow-2xl bg-white"
    >
      {/* Header */}
      <div className="relative p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Zap className="w-10 h-10 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">По опыту</h3>
            <p className="text-white/70">Кто набрал больше всего опыта</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {experienceLeaderboard.length > 0 ? (
          experienceLeaderboard.map((entry, index) => (
            <motion.div 
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "flex items-center p-4 hover:bg-slate-50 transition-colors",
                entry.user_id === currentUserId && "bg-primary-50/50"
              )}
            >
              <div className="w-12 flex-shrink-0 text-center">
                {entry.rank === 1 && <Crown className="w-6 h-6 text-yellow-500 mx-auto drop-shadow" />}
                {entry.rank === 2 && <Medal className="w-6 h-6 text-slate-400 mx-auto" />}
                {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-600 mx-auto" />}
                {entry.rank > 3 && <span className="font-bold text-slate-400">#{entry.rank}</span>}
              </div>
              
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ml-2",
                entry.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                entry.rank === 2 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                entry.rank === 3 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                "bg-gradient-to-br from-primary-400 to-purple-500"
              )}>
                {entry.full_name[0] || '?'}
              </div>
              
              <div className="flex-1 ml-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  {entry.full_name}
                  {entry.user_id === currentUserId && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Вы</span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {entry.total_experience.toLocaleString()} XP
                </p>
              </div>

              <div className="font-mono font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                {entry.total_experience.toLocaleString()}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg">Нет данных об опыте.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 font-medium text-sm mb-4">
            <Flame className="w-4 h-4" />
            Соревнование учеников
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Таблица лидеров</span>
          </h1>
          <p className="text-slate-500">
            Соревнуйтесь с другими учениками и получайте призы!
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-2 mb-6"
        >
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('score')}
              className={cn(
                "px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'score'
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Очки</span>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={cn(
                "px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'achievements'
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Достижения</span>
            </button>
            <button
              onClick={() => setActiveTab('level')}
              className={cn(
                "px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'level'
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Уровень</span>
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={cn(
                "px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                activeTab === 'experience'
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Опыт</span>
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Фильтры</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* School Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Школа</label>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Все школы</option>
                {currentUserSchoolId && (
                  <option value={currentUserSchoolId}>Моя школа</option>
                )}
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>

            {/* Period Filter (only for score tab) */}
            {activeTab === 'score' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Период</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="today">Сегодня</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="all">Все время</option>
                </select>
              </div>
            )}
          </div>
        </motion.div>

        {/* Timer Card (only for score tab) */}
        {activeTab === 'score' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">До следующего награждения</p>
                  <p className="text-2xl font-bold text-slate-900">{hoursLeft}ч {minutesLeft}мин</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Призы</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> 50
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1">
                    <Medal className="w-3 h-3" /> 25
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" /> 10
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Student History Toggle (only for students and score tab) */}
        {studentHistory.length > 0 && activeTab === 'score' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6 flex justify-center gap-2"
          >
            <button
              onClick={() => setShowHistory(false)}
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all",
                !showHistory
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Сегодня
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all",
                showHistory
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              История (7 дней)
            </button>
          </motion.div>
        )}

        {/* Render appropriate leaderboard based on active tab */}
        {activeTab === 'score' && showHistory && studentHistory.length > 0 ? (
          renderStudentHistory()
        ) : activeTab === 'score' ? (
          renderScoreLeaderboard()
        ) : activeTab === 'achievements' ? (
          renderAchievementLeaderboard()
        ) : activeTab === 'level' ? (
          renderLevelLeaderboard()
        ) : (
          renderExperienceLeaderboard()
        )}
      </div>
    </Layout>
  );
}
