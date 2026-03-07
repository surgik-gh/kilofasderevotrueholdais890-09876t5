/**
 * RoadmapGenerator Component
 * Form for requesting a personalized learning roadmap
 * 
 * Requirements:
 * - 7.1: Generate roadmap through AI (costs 4 wisdom coins)
 * - 7.2: Check wisdom coins balance before generation
 * - 7.3: Display cost and balance information
 * 
 * Task: 17.1
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Coins, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTokens } from '@/hooks';
import { roadmapService } from '@/services/roadmap.service';
import { ALL_SUBJECTS } from '@/utils/subjects';
import type { LearningRoadmap } from '@/types/platform';

interface RoadmapGeneratorProps {
  studentId: string;
  onRoadmapGenerated?: (roadmap: LearningRoadmap) => void;
  className?: string;
}

const ROADMAP_COST = 4;

export function RoadmapGenerator({ 
  studentId, 
  onRoadmapGenerated,
  className 
}: RoadmapGeneratorProps) {
  const { wisdomCoins, refreshBalance } = useTokens();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasEnoughCoins = wisdomCoins >= ROADMAP_COST;

  const handleGenerate = async () => {
    if (!selectedSubject) {
      setError('Пожалуйста, выберите предмет');
      return;
    }

    if (!hasEnoughCoins) {
      setError(`Недостаточно монет мудрости. У вас ${wisdomCoins}, требуется ${ROADMAP_COST}`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const roadmap = await roadmapService.generateRoadmap({
        studentId,
        subject: selectedSubject,
      });

      setSuccess(true);
      setSelectedSubject('');
      
      // Refresh balance to show updated coins
      await refreshBalance();

      // Notify parent component
      if (onRoadmapGenerated) {
        onRoadmapGenerated(roadmap);
      }

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to generate roadmap:', err);
      
      if (err.code === 'INSUFFICIENT_COINS') {
        setError(`Недостаточно монет мудрости. У вас ${err.currentBalance}, требуется ${err.requiredAmount}`);
      } else if (err.code === 'GENERATION_FAILED') {
        setError('Не удалось сгенерировать программу обучения. Попробуйте позже.');
      } else {
        setError(err.message || 'Произошла ошибка при генерации программы обучения');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Создать программу обучения
          </h3>
          <p className="text-sm text-slate-500">
            Персонализированный план развития с помощью AI
          </p>
        </div>
      </div>

      {/* Cost Information */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl mb-6",
        hasEnoughCoins 
          ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200" 
          : "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            hasEnoughCoins ? "bg-amber-100" : "bg-red-100"
          )}>
            <Coins className={cn(
              "w-5 h-5",
              hasEnoughCoins ? "text-amber-600" : "text-red-600"
            )} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700">
              Стоимость генерации
            </div>
            <div className="text-xs text-slate-500">
              Ваш баланс: {wisdomCoins} монет
            </div>
          </div>
        </div>
        <div className={cn(
          "text-2xl font-bold",
          hasEnoughCoins ? "text-amber-600" : "text-red-600"
        )}>
          {ROADMAP_COST} <span className="text-sm font-normal">монет</span>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Выберите предмет
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              disabled={isGenerating}
              className={cn(
                "p-3 rounded-xl text-sm font-medium transition-all",
                "hover:scale-105 active:scale-95",
                selectedSubject === subject
                  ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {subject}
            </button>
          ))}
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

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200 mb-6"
        >
          <BookOpen className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-900">Успешно!</div>
            <div className="text-sm text-green-700 mt-1">
              Программа обучения создана. Списано {ROADMAP_COST} монет.
            </div>
          </div>
        </motion.div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!selectedSubject || !hasEnoughCoins || isGenerating}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-white transition-all",
          "flex items-center justify-center gap-2",
          !selectedSubject || !hasEnoughCoins || isGenerating
            ? "bg-slate-300 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl active:scale-95"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Генерация программы...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Создать программу обучения</span>
          </>
        )}
      </button>

      {/* Help Text */}
      {!hasEnoughCoins && (
        <div className="mt-4 text-center text-sm text-slate-500">
          Недостаточно монет мудрости. Заработайте больше монет, выполняя квизы и задания.
        </div>
      )}
    </div>
  );
}
