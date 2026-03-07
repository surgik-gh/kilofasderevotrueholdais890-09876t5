/**
 * SubjectProgressChart Component
 * 
 * Displays detailed progress chart for a specific subject including:
 * - All quiz attempts for the subject
 * - Trend line showing improvement/decline
 * - Individual attempt scores
 * 
 * Requirements: 6.7
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { supabase } from '../../lib/supabase';

interface QuizAttempt {
  id: string;
  score_percentage: number;
  completed_at: string;
}

interface SubjectProgressChartProps {
  studentId: string;
  subject: string;
  showTrendLine?: boolean;
}

export function SubjectProgressChart({
  studentId,
  subject,
  showTrendLine = true,
}: SubjectProgressChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all quiz attempts for this student and subject
        const { data, error: fetchError } = await supabase
          .from('quiz_attempts')
          .select(`
            id,
            score_percentage,
            completed_at,
            quizzes!inner (
              lesson_id,
              lessons!inner (
                subject
              )
            )
          `)
          .eq('student_id', studentId)
          .order('completed_at', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Filter by subject
        const subjectAttempts = (data || [])
          .filter((attempt: any) => attempt.quizzes?.lessons?.subject === subject)
          .map((attempt: any) => ({
            id: attempt.id,
            score_percentage: attempt.score_percentage,
            completed_at: attempt.completed_at,
          }));

        setAttempts(subjectAttempts);
      } catch (err: any) {
        console.error('Error fetching subject attempts:', err);
        setError(err.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    if (studentId && subject) {
      fetchAttempts();
    }
  }, [studentId, subject]);

  // Calculate trend line using linear regression
  const calculateTrendLine = (data: { x: number; y: number }[]) => {
    if (data.length < 2) return null;

    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  const getTrendDirection = (slope: number) => {
    if (slope > 1) return 'up';
    if (slope < -1) return 'down';
    return 'stable';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">Нет данных по предмету "{subject}"</p>
        <p className="text-sm text-gray-400 mt-1">Пройдите квизы, чтобы увидеть прогресс</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = attempts.map((attempt, index) => ({
    attempt: index + 1,
    score: attempt.score_percentage,
    date: new Date(attempt.completed_at).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  // Calculate trend
  const trendData = attempts.map((attempt, index) => ({
    x: index + 1,
    y: attempt.score_percentage,
  }));

  const trendLine = calculateTrendLine(trendData);
  const trendDirection = trendLine ? getTrendDirection(trendLine.slope) : 'stable';

  // Add trend line to chart data
  const chartDataWithTrend = showTrendLine && trendLine
    ? chartData.map((point, index) => ({
        ...point,
        trend: trendLine.intercept + trendLine.slope * (index + 1),
      }))
    : chartData;

  // Calculate statistics
  const averageScore = attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length;
  const maxScore = Math.max(...attempts.map(a => a.score_percentage));
  const minScore = Math.min(...attempts.map(a => a.score_percentage));
  const latestScore = attempts[attempts.length - 1].score_percentage;

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendText = () => {
    switch (trendDirection) {
      case 'up':
        return 'Улучшение';
      case 'down':
        return 'Ухудшение';
      default:
        return 'Стабильно';
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white/50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Средний балл</div>
          <div className="text-xl font-bold text-gray-800">{averageScore.toFixed(1)}%</div>
        </div>
        <div className="p-3 bg-white/50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Последний</div>
          <div className="text-xl font-bold text-gray-800">{latestScore.toFixed(1)}%</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-gray-500 mb-1">Максимум</div>
          <div className="text-xl font-bold text-green-600">{maxScore.toFixed(1)}%</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-xs text-gray-500 mb-1">Минимум</div>
          <div className="text-xl font-bold text-red-600">{minScore.toFixed(1)}%</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="font-medium text-gray-700">Тренд:</span>
          <span className={`font-semibold ${getTrendColor()}`}>{getTrendText()}</span>
        </div>
        <div className="text-sm text-gray-500">{attempts.length} попыток</div>
      </div>

      {/* Chart */}
      <div className="p-4 bg-white/50 rounded-lg border border-gray-200">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartDataWithTrend}>
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
              formatter={(value: any, name?: string) => {
                if (name === 'score') return [`${value.toFixed(1)}%`, 'Балл'];
                if (name === 'trend') return [`${value.toFixed(1)}%`, 'Тренд'];
                return [value, name || ''];
              }}
              labelFormatter={(label) => {
                const point = chartData[label - 1];
                return point ? `Попытка ${label} (${point.date})` : `Попытка ${label}`;
              }}
            />
            <Legend />
            
            {/* Reference lines for thresholds */}
            <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" label="Отлично" />
            <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" label="Хорошо" />
            
            {/* Actual scores */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ fill: '#6366F1', r: 5 }}
              activeDot={{ r: 7 }}
              name="Балл"
            />
            
            {/* Trend line */}
            {showTrendLine && trendLine && (
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Линия тренда"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Attempt History */}
      <div className="p-4 bg-white/50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">История попыток</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {attempts.slice().reverse().map((attempt, index) => {
            const attemptNumber = attempts.length - index;
            const scoreColor =
              attempt.score_percentage >= 80
                ? 'text-green-600 bg-green-50'
                : attempt.score_percentage >= 60
                ? 'text-yellow-600 bg-yellow-50'
                : 'text-red-600 bg-red-50';

            return (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {attemptNumber}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {new Date(attempt.completed_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(attempt.completed_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg font-bold ${scoreColor}`}>
                  {attempt.score_percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
