/**
 * RoadmapView Component
 * Displays a learning roadmap with topics, resources, milestones, and progress
 * 
 * Requirements:
 * - 7.4: Display roadmap structure
 * - 7.5: Show topics with descriptions
 * - 7.6: Display resources for learning
 * - 7.7: Show milestones (checkpoints)
 * - 7.9: Display progress with progress bar
 * - 7.10: Allow marking topics as completed
 * 
 * Task: 17.2
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Target, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { roadmapService } from '@/services/roadmap.service';
import type { LearningRoadmap } from '@/types/platform';

interface RoadmapViewProps {
  roadmap: LearningRoadmap;
  onProgressUpdate?: (updatedRoadmap: LearningRoadmap) => void;
  className?: string;
}

export function RoadmapView({ 
  roadmap, 
  onProgressUpdate,
  className 
}: RoadmapViewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [updatingTopic, setUpdatingTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const handleMarkComplete = async (topicId: string) => {
    setUpdatingTopic(topicId);
    setError(null);

    try {
      const updatedRoadmap = await roadmapService.updateProgress({
        roadmapId: roadmap.id,
        studentId: roadmap.student_id,
        completedTopicId: topicId,
      });

      if (onProgressUpdate) {
        onProgressUpdate(updatedRoadmap);
      }
    } catch (err: any) {
      console.error('Failed to update progress:', err);
      setError(err.message || 'Не удалось обновить прогресс');
    } finally {
      setUpdatingTopic(null);
    }
  };

  const isTopicCompleted = (topicId: string) => {
    return roadmap.progress.completed_topics.includes(topicId);
  };

  const isTopicCurrent = (topicId: string) => {
    return roadmap.progress.current_topic === topicId;
  };

  const sortedTopics = [...roadmap.content.topics].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {roadmap.subject}
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{roadmap.content.estimated_duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span className="capitalize">{roadmap.content.difficulty_level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Прогресс</span>
            <span className="font-bold text-primary-600">
              {roadmap.progress.completion_percentage}%
            </span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${roadmap.progress.completion_percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
          <div className="text-xs text-slate-500">
            {roadmap.progress.completed_topics.length} из {sortedTopics.length} тем завершено
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-900">Ошибка</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Topics List */}
      <div className="space-y-3">
        {sortedTopics.map((topic, index) => {
          const isCompleted = isTopicCompleted(topic.id);
          const isCurrent = isTopicCurrent(topic.id);
          const isExpanded = expandedTopics.has(topic.id);
          const isUpdating = updatingTopic === topic.id;

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-xl border-2 transition-all",
                isCompleted 
                  ? "bg-green-50 border-green-200" 
                  : isCurrent
                  ? "bg-primary-50 border-primary-300 shadow-md"
                  : "bg-white border-slate-200"
              )}
            >
              {/* Topic Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <button
                    onClick={() => !isCompleted && handleMarkComplete(topic.id)}
                    disabled={isCompleted || isUpdating}
                    className={cn(
                      "shrink-0 mt-1 transition-all",
                      isCompleted 
                        ? "text-green-600 cursor-default" 
                        : "text-slate-400 hover:text-primary-600 hover:scale-110 active:scale-95"
                    )}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  {/* Topic Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded",
                            isCompleted 
                              ? "bg-green-200 text-green-800"
                              : isCurrent
                              ? "bg-primary-200 text-primary-800"
                              : "bg-slate-200 text-slate-600"
                          )}>
                            Тема {topic.order}
                          </span>
                          {isCurrent && !isCompleted && (
                            <span className="text-xs font-semibold text-primary-600">
                              Текущая
                            </span>
                          )}
                        </div>
                        <h3 className={cn(
                          "text-lg font-bold mb-1",
                          isCompleted ? "text-green-900" : "text-slate-900"
                        )}>
                          {topic.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {topic.description}
                        </p>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
                      {/* Full Description */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          Описание
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>

                      {/* Resources */}
                      {topic.resources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Ресурсы для изучения
                          </h4>
                          <ul className="space-y-2">
                            {topic.resources.map((resource, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <span className="text-primary-500 mt-1">•</span>
                                <span>{resource}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Milestones */}
                      {topic.milestones.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Контрольные точки
                          </h4>
                          <ul className="space-y-2">
                            {topic.milestones.map((milestone, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                                <span>{milestone}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Mark Complete Button */}
                      {!isCompleted && (
                        <button
                          onClick={() => handleMarkComplete(topic.id)}
                          disabled={isUpdating}
                          className={cn(
                            "w-full py-3 rounded-lg font-semibold transition-all",
                            "flex items-center justify-center gap-2",
                            isUpdating
                              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg active:scale-95"
                          )}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Обновление...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Отметить как завершенную</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Message */}
      {roadmap.progress.completion_percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center"
        >
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold mb-1">Поздравляем!</h3>
          <p className="text-green-100">
            Вы завершили программу обучения по предмету {roadmap.subject}
          </p>
        </motion.div>
      )}
    </div>
  );
}
