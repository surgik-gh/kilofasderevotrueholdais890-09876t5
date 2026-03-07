/**
 * RoadmapList Component
 * Displays all learning roadmaps for a student with filtering and progress
 * 
 * Requirements:
 * - 7.8: Display all roadmaps for student
 * - Filter roadmaps by subject
 * - Show progress for each roadmap
 * - Button to create new roadmap
 * 
 * Task: 17.3
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Filter, 
  Plus, 
  Loader2, 
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  Search
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { roadmapService } from '@/services/roadmap.service';
import type { LearningRoadmap } from '@/types/platform';

interface RoadmapListProps {
  studentId: string;
  onSelectRoadmap?: (roadmap: LearningRoadmap) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function RoadmapList({ 
  studentId, 
  onSelectRoadmap,
  onCreateNew,
  className 
}: RoadmapListProps) {
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [filteredRoadmaps, setFilteredRoadmaps] = useState<LearningRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRoadmaps();
  }, [studentId]);

  useEffect(() => {
    filterRoadmaps();
  }, [roadmaps, selectedFilter, searchQuery]);

  const loadRoadmaps = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await roadmapService.getRoadmaps(studentId);
      setRoadmaps(data);
    } catch (err: any) {
      console.error('Failed to load roadmaps:', err);
      setError(err.message || 'Не удалось загрузить программы обучения');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRoadmaps = () => {
    let filtered = [...roadmaps];

    // Filter by subject
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(r => r.subject === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.subject.toLowerCase().includes(query) ||
        r.content.topics.some(t => 
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
        )
      );
    }

    setFilteredRoadmaps(filtered);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 50) return 'text-primary-600';
    return 'text-slate-600';
  };

  const getProgressBgColor = (percentage: number) => {
    if (percentage === 100) return 'from-green-500 to-emerald-500';
    if (percentage >= 50) return 'from-primary-500 to-primary-600';
    return 'from-slate-400 to-slate-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  // Get unique subjects from roadmaps
  const availableSubjects = Array.from(new Set(roadmaps.map(r => r.subject)));

  if (isLoading) {
    return (
      <div className={cn("glass rounded-2xl p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("glass rounded-2xl p-6", className)}>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-900">Ошибка</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Мои программы обучения
            </h2>
            <p className="text-sm text-slate-500">
              {roadmaps.length} {roadmaps.length === 1 ? 'программа' : 'программ'}
            </p>
          </div>
        </div>

        {/* Create New Button */}
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Создать</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {roadmaps.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по предмету или теме..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <button
              onClick={() => setSelectedFilter('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                selectedFilter === 'all'
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              Все предметы
            </button>
            {availableSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedFilter(subject)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  selectedFilter === subject
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Roadmaps Grid */}
      {filteredRoadmaps.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {roadmaps.length === 0 
              ? 'Нет программ обучения' 
              : 'Ничего не найдено'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {roadmaps.length === 0
              ? 'Создайте свою первую персонализированную программу обучения'
              : 'Попробуйте изменить фильтры или поисковый запрос'}
          </p>
          {onCreateNew && roadmaps.length === 0 && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Создать программу</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredRoadmaps.map((roadmap, index) => (
              <motion.div
                key={roadmap.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectRoadmap && onSelectRoadmap(roadmap)}
                className={cn(
                  "p-5 rounded-xl border-2 transition-all cursor-pointer",
                  roadmap.progress.completion_percentage === 100
                    ? "bg-green-50 border-green-200 hover:border-green-300 hover:shadow-lg"
                    : "bg-white border-slate-200 hover:border-primary-300 hover:shadow-lg"
                )}
              >
                {/* Subject and Date */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {roadmap.subject}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{roadmap.content.estimated_duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span className="capitalize">{roadmap.content.difficulty_level}</span>
                      </div>
                    </div>
                  </div>
                  {roadmap.progress.completion_percentage === 100 && (
                    <div className="text-2xl">✅</div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">Прогресс</span>
                    <span className={cn(
                      "font-bold",
                      getProgressColor(roadmap.progress.completion_percentage)
                    )}>
                      {roadmap.progress.completion_percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-gradient-to-r rounded-full transition-all",
                        getProgressBgColor(roadmap.progress.completion_percentage)
                      )}
                      style={{ width: `${roadmap.progress.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {roadmap.progress.completed_topics.length} / {roadmap.content.topics.length} тем
                    </span>
                  </div>
                  <span>
                    Создано {formatDate(roadmap.created_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
