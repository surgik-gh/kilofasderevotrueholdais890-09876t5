import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Trophy, TrendingUp, Award, 
  ChevronDown, ChevronUp, Calendar, Target, BarChart3
} from 'lucide-react';
import { parentSchoolService, type ChildProgress } from '../../services/parent-school.service';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { ProgressAnalytics } from '../analytics/ProgressAnalytics';

interface ParentProgressViewProps {
  parentId: string;
}

type ViewMode = 'overview' | 'analytics';

export function ParentProgressView({ parentId }: ParentProgressViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childrenProgress, setChildrenProgress] = useState<ChildProgress[]>([]);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        const progress = await parentSchoolService.getAllChildrenProgress(parentId);
        setChildrenProgress(progress);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching children progress:', err);
        setError('Не удалось загрузить прогресс детей');
        setLoading(false);
      }
    };

    fetchProgress();
  }, [parentId]);

  const toggleChild = (childId: string) => {
    setExpandedChild(expandedChild === childId ? null : childId);
  };

  const getAverageScore = (progress: ChildProgress) => {
    if (progress.quiz_results.length === 0) return 0;
    const sum = progress.quiz_results.reduce((acc, result) => acc + result.score_percentage, 0);
    return Math.round(sum / progress.quiz_results.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка прогресса...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liquid-glass rounded-xl p-12 text-center">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (childrenProgress.length === 0) {
    return (
      <div className="liquid-glass rounded-xl p-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Нет привязанных детей</h3>
        <p className="text-gray-500">Добавьте детей, чтобы отслеживать их прогресс</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle (only show if multiple children) */}
      {childrenProgress.length > 1 && (
        <div className="flex gap-2 p-1 bg-white/50 rounded-lg border border-gray-200 w-fit">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'overview'
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'analytics'
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Детальная аналитика
          </button>
        </div>
      )}

      {/* Comparison View (when multiple children and analytics mode) */}
      {childrenProgress.length > 1 && viewMode === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Сравнение детей
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childrenProgress.map((child) => {
              const avgScore = getAverageScore(child);
              return (
                <div
                  key={child.child_id}
                  className="p-4 bg-white/50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {child.child_name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{child.child_name}</h4>
                      <p className="text-xs text-gray-500">{child.quiz_results.length} тестов</p>
                    </div>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${getScoreBgColor(avgScore)}`}>
                    <div className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
                      {avgScore}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Средний балл</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Individual Child Cards */}
      {childrenProgress.map((child) => {
        const avgScore = getAverageScore(child);
        const isExpanded = expandedChild === child.child_id;
        const showAnalytics = viewMode === 'analytics' || childrenProgress.length === 1;

        return (
          <motion.div
            key={child.child_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-xl overflow-hidden"
          >
            {/* Child Header */}
            <div
              className="p-6 cursor-pointer hover:bg-white/50 transition-colors"
              onClick={() => toggleChild(child.child_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {child.child_name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{child.child_name}</h3>
                    <p className="text-sm text-gray-500">
                      {child.completed_lessons.length} уроков • {child.quiz_results.length} тестов
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Average Score */}
                  <div className={`px-4 py-2 rounded-lg ${getScoreBgColor(avgScore)}`}>
                    <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                      {avgScore}%
                    </div>
                    <div className="text-xs text-gray-500">Ср. балл</div>
                  </div>

                  {/* Leaderboard Position */}
                  {child.current_rank && (
                    <div className="px-4 py-2 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        #{child.current_rank}
                      </div>
                      <div className="text-xs text-gray-500">Место</div>
                    </div>
                  )}

                  {/* Expand Icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-6 space-y-6">
                  {/* Show detailed analytics if in analytics mode or single child */}
                  {showAnalytics && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        Детальная аналитика прогресса
                      </h4>
                      <ProgressAnalytics studentId={child.child_id} showRecommendations={true} />
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-600">Пройдено уроков</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {child.completed_lessons.length}
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-600">Пройдено тестов</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {child.quiz_results.length}
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-medium text-gray-600">Очки лидерборда</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {child.leaderboard_position?.score || 0}
                      </div>
                    </div>
                  </div>

                  {/* Quiz Results Chart */}
                  {child.quiz_results.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Динамика результатов
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={child.quiz_results.slice(-10).map((result, i) => ({
                            name: `Тест ${i + 1}`,
                            score: result.score_percentage,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#6B7280" />
                          <YAxis stroke="#6B7280" domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255,255,255,0.95)',
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#6366F1"
                            strokeWidth={2}
                            dot={{ fill: '#6366F1' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Completed Lessons */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      Пройденные уроки
                    </h4>
                    {child.completed_lessons.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Нет пройденных уроков</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {child.completed_lessons.slice(0, 6).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
                          >
                            <h5 className="font-medium text-gray-800 mb-1 line-clamp-1">
                              {lesson.title}
                            </h5>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">{lesson.subject}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(lesson.created_at).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {child.completed_lessons.length > 6 && (
                      <p className="text-sm text-gray-500 text-center mt-3">
                        И еще {child.completed_lessons.length - 6} уроков...
                      </p>
                    )}
                  </div>

                  {/* Recent Quiz Results */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-500" />
                      Последние результаты тестов
                    </h4>
                    {child.quiz_results.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Нет результатов тестов</p>
                    ) : (
                      <div className="space-y-2">
                        {child.quiz_results.slice(-5).reverse().map((result, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                                  result.score_percentage >= 80
                                    ? 'bg-gradient-to-br from-green-400 to-green-500'
                                    : result.score_percentage >= 60
                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500'
                                    : 'bg-gradient-to-br from-red-400 to-red-500'
                                }`}
                              >
                                {Math.round(result.score_percentage)}%
                              </div>
                              <div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(result.completed_at).toLocaleDateString('ru-RU')}
                                </div>
                                {result.counts_for_leaderboard && (
                                  <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    Учитывается в лидерборде
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leaderboard Info */}
                  {child.leaderboard_position && (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Позиция в лидерборде
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            #{child.current_rank || '—'}
                          </div>
                          <div className="text-xs text-gray-500">Место</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {child.leaderboard_position.score}
                          </div>
                          <div className="text-xs text-gray-500">Очки</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {child.leaderboard_position.reward_coins}
                          </div>
                          <div className="text-xs text-gray-500">Награда</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
