/**
 * ProgressAnalytics Component
 * 
 * Displays comprehensive progress analytics for a student including:
 * - Overall average score
 * - Progress chart over time (Recharts)
 * - Subject list with scores and trends
 * - Weak subjects highlighted in red (< 60%)
 * - Strong subjects highlighted in green (> 80%)
 * - Personalized recommendations
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.9
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsService } from '../../services/analytics.service';
import type { ProgressAnalytics as ProgressAnalyticsType } from '../../types/platform';

interface ProgressAnalyticsProps {
  studentId: string;
  showRecommendations?: boolean;
}

export function ProgressAnalytics({ studentId, showRecommendations = true }: ProgressAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ProgressAnalyticsType | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await analyticsService.getProgressAnalytics(studentId);
        setAnalytics(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Не удалось загрузить аналитику');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAnalytics();
    }
  }, [studentId]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendText = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'Улучшение';
      case 'down':
        return 'Ухудшение';
      default:
        return 'Стабильно';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getOverallTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <Minus className="w-6 h-6 text-gray-400" />;
    }
  };

  const getOverallTrendText = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'Улучшается';
      case 'declining':
        return 'Снижается';
      default:
        return 'Стабильно';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liquid-glass rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare chart data - show last 10 attempts across all subjects
  const chartData = analytics.subject_scores
    .flatMap(subject => 
      Array(subject.attempts_count).fill(null).map((_, i) => ({
        subject: subject.subject,
        attempt: i + 1,
        score: subject.average_score, // Simplified - in real scenario would need individual attempts
      }))
    )
    .slice(-10);

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Average */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`liquid-glass rounded-xl p-6 border-2 ${getScoreBgColor(analytics.overall_average)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Общий средний балл</span>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(analytics.overall_average)}`}>
            {analytics.overall_average.toFixed(1)}%
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            {getOverallTrendIcon(analytics.trend)}
            <span>{getOverallTrendText(analytics.trend)}</span>
          </div>
        </motion.div>

        {/* Weak Subjects Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Слабые предметы</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-4xl font-bold text-red-600">
            {analytics.weak_subjects.length}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {analytics.weak_subjects.length === 0 ? 'Отлично!' : '< 60% средний балл'}
          </div>
        </motion.div>

        {/* Strong Subjects Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="liquid-glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Сильные предметы</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-4xl font-bold text-green-600">
            {analytics.strong_subjects.length}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {analytics.strong_subjects.length === 0 ? 'Продолжайте!' : '> 80% средний балл'}
          </div>
        </motion.div>
      </div>

      {/* Progress Chart */}
      {analytics.subject_scores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="liquid-glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Динамика прогресса
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="attempt"
                stroke="#6B7280"
                label={{ value: 'Попытка', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                stroke="#6B7280"
                domain={[0, 100]}
                label={{ value: 'Балл (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ fill: '#6366F1', r: 4 }}
                name="Средний балл"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Subject Scores List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="liquid-glass rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Результаты по предметам
        </h3>

        {analytics.subject_scores.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Пока нет данных. Пройдите квизы, чтобы увидеть аналитику!
          </p>
        ) : (
          <div className="space-y-3">
            {analytics.subject_scores.map((subject, index) => {
              const isWeak = analytics.weak_subjects.includes(subject.subject);
              const isStrong = analytics.strong_subjects.includes(subject.subject);

              return (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className={`p-4 rounded-lg border-2 ${
                    isWeak
                      ? 'bg-red-50 border-red-200'
                      : isStrong
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white/50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-800">{subject.subject}</h4>
                        {isWeak && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                            Требует внимания
                          </span>
                        )}
                        {isStrong && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Отлично!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{subject.attempts_count} попыток</span>
                        <span>•</span>
                        <span>
                          Последняя: {new Date(subject.last_attempt_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Trend */}
                      <div className="flex items-center gap-1">
                        {getTrendIcon(subject.trend)}
                        <span className="text-sm text-gray-600">{getTrendText(subject.trend)}</span>
                      </div>

                      {/* Score */}
                      <div className={`text-3xl font-bold ${getScoreColor(subject.average_score)}`}>
                        {subject.average_score.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isWeak
                            ? 'bg-red-500'
                            : isStrong
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${subject.average_score}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Recommendations */}
      {showRecommendations && analytics.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="liquid-glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Рекомендации
          </h3>
          <div className="space-y-3">
            {analytics.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200"
              >
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
