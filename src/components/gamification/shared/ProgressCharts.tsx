import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Calendar } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ProgressChartsProps {
  experienceData?: DataPoint[];
  achievementsData?: DataPoint[];
  timeRange?: 'week' | 'month' | 'all';
  className?: string;
}

export function ProgressCharts({
  experienceData = [],
  achievementsData = [],
  timeRange = 'week',
  className,
}: ProgressChartsProps) {
  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      cutoffDate.setDate(now.getDate() - 30);
    } else {
      // Show all data
      cutoffDate.setFullYear(2000);
    }

    return {
      experience: experienceData.filter(d => new Date(d.date) >= cutoffDate),
      achievements: achievementsData.filter(d => new Date(d.date) >= cutoffDate),
    };
  }, [experienceData, achievementsData, timeRange]);

  // Combine data for dual chart
  const combinedData = useMemo(() => {
    const dateMap = new Map<string, { date: string; experience: number; achievements: number }>();

    filteredData.experience.forEach(d => {
      const existing = dateMap.get(d.date) || { date: d.date, experience: 0, achievements: 0 };
      existing.experience = d.value;
      dateMap.set(d.date, existing);
    });

    filteredData.achievements.forEach(d => {
      const existing = dateMap.get(d.date) || { date: d.date, experience: 0, achievements: 0 };
      existing.achievements = d.value;
      dateMap.set(d.date, existing);
    });

    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredData]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (combinedData.length === 0) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Calendar className="w-12 h-12 mb-3" />
          <p className="text-sm">Недостаточно данных для отображения графиков</p>
          <p className="text-xs mt-1">Продолжайте учиться, чтобы увидеть свой прогресс!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Experience Chart */}
      {filteredData.experience.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              Опыт по времени
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filteredData.experience}>
              <defs>
                <linearGradient id="colorExperience" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#a855f7"
                strokeWidth={2}
                fill="url(#colorExperience)"
                name="Опыт"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Achievements Chart */}
      {filteredData.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              Достижения по времени
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredData.achievements}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
                name="Достижения"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Combined Chart */}
      {combinedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              Общий прогресс
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedData}>
              <defs>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorAch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px' }}
                iconType="line"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="experience"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 3 }}
                name="Опыт"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="achievements"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
                name="Достижения"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}

// Helper component for time range selector
interface TimeRangeSelectorProps {
  value: 'week' | 'month' | 'all';
  onChange: (value: 'week' | 'month' | 'all') => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const options = [
    { value: 'week' as const, label: 'Неделя' },
    { value: 'month' as const, label: 'Месяц' },
    { value: 'all' as const, label: 'Все время' },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            ${value === option.value
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
