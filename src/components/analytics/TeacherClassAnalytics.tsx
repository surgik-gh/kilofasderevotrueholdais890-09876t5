/**
 * TeacherClassAnalytics Component
 * 
 * Displays comprehensive class analytics for teachers including:
 * - Class average scores by subject
 * - List of students with struggling subjects
 * - Class-level recommendations
 * - Comparison charts
 * 
 * Requirements: 6.6, 6.8
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Award,
  Lightbulb,
  BarChart3,
  UserX,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { analyticsService, type ClassAnalytics } from '../../services/analytics.service';

interface TeacherClassAnalyticsProps {
  schoolId: string;
  teacherId: string;
}

export function TeacherClassAnalytics({ schoolId, teacherId }: TeacherClassAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await analyticsService.getClassAnalytics(schoolId, teacherId);
        setAnalytics(data);
      } catch (err: any) {
        console.error('Error fetching class analytics:', err);
        setError(err.message || 'Не удалось загрузить аналитику класса');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId && teacherId) {
      fetchAnalytics();
    }
  }, [schoolId, teacherId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики класса...</p>
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

  // Prepare chart data
  const chartData = Object.entries(analytics.average_scores_by_subject).map(([subject, score]) => ({
    subject,
    score: Math.round(score * 100) / 100,
  }));

  // Calculate overall class average
  const overallAverage =
    chartData.length > 0
      ? chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Class Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Учеников в классе</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-4xl font-bold text-indigo-600">{analytics.student_count}</div>
          <div className="mt-2 text-sm text-gray-500">Всего учеников</div>
        </motion.div>

        {/* Overall Average */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`liquid-glass rounded-xl p-6 border-2 ${getScoreBgColor(overallAverage)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Средний балл класса</span>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className={`text-4xl font-bold ${getScoreTextColor(overallAverage)}`}>
            {overallAverage.toFixed(1)}%
          </div>
          <div className="mt-2 text-sm text-gray-500">По всем предметам</div>
        </motion.div>

        {/* Weak Students Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="liquid-glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Требуют внимания</span>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-4xl font-bold text-red-600">{analytics.weak_students.length}</div>
          <div className="mt-2 text-sm text-gray-500">
            {analytics.weak_students.length === 0 ? 'Отлично!' : 'Учеников со слабыми результатами'}
          </div>
        </motion.div>
      </div>

      {/* Subject Scores Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="liquid-glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Средние баллы класса по предметам
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="subject"
                stroke="#6B7280"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#6B7280"
                domain={[0, 100]}
                label={{ value: 'Средний балл (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Средний балл']}
              />
              <Legend />
              <Bar dataKey="score" name="Средний балл" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Weak Students List */}
      {analytics.weak_students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="liquid-glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-500" />
            Ученики, требующие дополнительной поддержки
          </h3>
          <div className="space-y-3">
            {analytics.weak_students.map((student, index) => (
              <motion.div
                key={student.student_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="p-4 bg-red-50 rounded-lg border-2 border-red-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {student.student_name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{student.student_name}</h4>
                      <p className="text-sm text-gray-500">
                        Средний балл: {student.overall_average.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {student.overall_average.toFixed(1)}%
                  </div>
                </div>

                {/* Weak Subjects */}
                {student.weak_subjects.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Проблемные предметы:</p>
                    <div className="flex flex-wrap gap-2">
                      {student.weak_subjects.map((subject) => (
                        <span
                          key={subject}
                          className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Weak Students Message */}
      {analytics.weak_students.length === 0 && analytics.student_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="liquid-glass rounded-xl p-8 text-center"
        >
          <Award className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Отличная работа!</h3>
          <p className="text-gray-600">
            Все ученики показывают хорошие результаты. Продолжайте в том же духе!
          </p>
        </motion.div>
      )}

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="liquid-glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Рекомендации для класса
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
                <TrendingUp className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {analytics.student_count === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-xl p-12 text-center"
        >
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">В классе пока нет учеников</h3>
          <p className="text-gray-500">
            Добавьте учеников в школу, чтобы увидеть аналитику класса
          </p>
        </motion.div>
      )}
    </div>
  );
}
