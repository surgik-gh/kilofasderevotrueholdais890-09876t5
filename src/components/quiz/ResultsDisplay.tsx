/**
 * ResultsDisplay Component
 * 
 * Shows quiz results with score, correct/incorrect answers, and leaderboard impact
 * 
 * Requirements:
 * - 3.5: Show score percentage
 * - 3.6: Leaderboard counting for self-created lessons
 * - 3.7: Leaderboard exclusion for teacher-created lessons
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, BookMarked, CheckCircle, XCircle, TrendingUp, Award, Coins } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import type { Quiz } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface ResultsDisplayProps {
  quiz: Quiz;
  score: number;
  userAnswers: number[];
  onClose: () => void;
  onRetry?: () => void;
}

export function ResultsDisplay({ 
  quiz, 
  score, 
  userAnswers, 
  onClose,
  onRetry 
}: ResultsDisplayProps) {
  const [countsForLeaderboard, setCountsForLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate correct answers count
  const correctCount = quiz.questions.filter(
    (q, idx) => userAnswers[idx] === q.correct_answer_index
  ).length;

  // Calculate rewards
  const coinsEarned = correctCount * 0.5;
  const leaderboardPoints = correctCount * 10;

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*, creator:user_profiles!lessons_creator_id_fkey(role)')
          .eq('id', quiz.lesson_id)
          .single();

        if (error) throw error;

        if (data) {
          // Check if this counts for leaderboard (student created their own lesson)
          const isStudentCreated = (data as any).creator?.role === 'student';
          setCountsForLeaderboard(isStudentCreated);
        }
      } catch (err) {
        console.error('Failed to load lesson data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonData();
  }, [quiz.lesson_id]);

  const getResultIcon = () => {
    if (score >= 80) return <Star className="w-16 h-16 text-white" />;
    if (score >= 50) return <ThumbsUp className="w-16 h-16 text-white" />;
    return <BookMarked className="w-16 h-16 text-white" />;
  };

  const getResultTitle = () => {
    if (score >= 80) return 'Отлично!';
    if (score >= 50) return 'Хорошо!';
    return 'Можно лучше';
  };

  const getResultMessage = () => {
    if (score >= 80) {
      return 'Вы отлично усвоили материал! Продолжайте в том же духе.';
    }
    if (score >= 50) {
      return 'Хороший результат, но есть над чем поработать.';
    }
    return 'Рекомендуем перечитать урок и попробовать снова.';
  };

  const getGradientColors = () => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 50) return 'from-amber-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-3xl shadow-xl p-8"
    >
      {/* Result Icon */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className={`inline-flex p-8 rounded-full bg-gradient-to-br ${getGradientColors()} shadow-lg mb-6`}
        >
          {getResultIcon()}
        </motion.div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
          {score >= 80 && <Star className="w-8 h-8 text-yellow-500" />}
          {getResultTitle()}
          {score >= 80 && <Star className="w-8 h-8 text-yellow-500" />}
        </h2>
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-black gradient-text mb-4"
        >
          {score}%
        </motion.div>

        <p className="text-slate-600 mb-2">
          {correctCount} из {quiz.questions.length} правильных ответов
        </p>

        <p className="text-slate-500 max-w-md mx-auto">
          {getResultMessage()}
        </p>
      </div>

      {/* Rewards Section */}
      {!isLoading && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            Награды
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Coins Earned */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-slate-600">Монеты мудрости</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">+{coinsEarned.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-1">0.5 монет за правильный ответ</p>
            </div>

            {/* Leaderboard Points */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium text-slate-600">Рейтинг</span>
              </div>
              {countsForLeaderboard ? (
                <>
                  <p className="text-2xl font-bold text-primary-600">+{leaderboardPoints}</p>
                  <p className="text-xs text-slate-500 mt-1">10 очков за правильный ответ</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-slate-400">Не учитывается</p>
                  <p className="text-xs text-slate-500 mt-1">Только для своих уроков</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Answers Breakdown */}
      <div className="mb-8">
        <h3 className="font-bold text-slate-900 mb-4">Разбор ответов</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {quiz.questions.map((question, idx) => {
            const isCorrectAnswer = userAnswers[idx] === question.correct_answer_index;
            const userAnswer = userAnswers[idx];

            return (
              <div 
                key={question.id} 
                className={`p-4 rounded-xl border-2 ${
                  isCorrectAnswer 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-full ${
                    isCorrectAnswer ? 'bg-green-500' : 'bg-red-500'
                  } text-white flex-shrink-0`}>
                    {isCorrectAnswer ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 mb-2">
                      Вопрос {idx + 1}
                    </p>
                    <div className="text-sm text-slate-700 mb-3">
                      <MarkdownRenderer content={question.question_text} />
                    </div>
                    
                    {/* User's Answer */}
                    {userAnswer !== -1 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Ваш ответ:</p>
                        <div className={`p-2 rounded-lg ${
                          isCorrectAnswer ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <MarkdownRenderer content={question.options[userAnswer]} />
                        </div>
                      </div>
                    )}

                    {/* Correct Answer (if wrong) */}
                    {!isCorrectAnswer && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Правильный ответ:</p>
                        <div className="p-2 rounded-lg bg-green-100">
                          <MarkdownRenderer content={question.options[question.correct_answer_index]} />
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Объяснение:</p>
                        <p className="text-xs text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
        >
          Закрыть
        </button>
        {onRetry && countsForLeaderboard && (
          <button
            onClick={onRetry}
            className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Попробовать снова
          </button>
        )}
      </div>
    </motion.div>
  );
}
