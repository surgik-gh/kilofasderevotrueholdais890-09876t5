/**
 * QuizPlayer Component
 * 
 * Allows students to take quizzes with question-by-question flow
 * 
 * Requirements:
 * - 3.3: Unlimited attempts for self-created lessons
 * - 3.4: Single attempt for teacher-created lessons
 * - 3.5: Display score percentage
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { quizService } from '@/services/quiz.service';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import type { Quiz } from '@/lib/supabase';

interface QuizPlayerProps {
  quiz: Quiz;
  studentId: string;
  onComplete: (score: number, answers: number[]) => void;
  onCancel: () => void;
}

export function QuizPlayer({ quiz, studentId, onComplete, onCancel }: QuizPlayerProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>(
    new Array(quiz.questions.length).fill(-1)
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canAttempt, setCanAttempt] = useState(true);
  const [isCheckingAttempt, setIsCheckingAttempt] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx) / quiz.questions.length) * 100;

  // Check if student can attempt this quiz
  useEffect(() => {
    const checkAttempt = async () => {
      try {
        const canAttemptQuiz = await quizService.canAttemptQuiz(quiz.id, studentId);
        setCanAttempt(canAttemptQuiz);
        
        if (!canAttemptQuiz) {
          setError('Вы уже прошли эту викторину');
        }
      } catch (err) {
        console.error('Failed to check attempt:', err);
        setError('Не удалось проверить возможность прохождения');
      } finally {
        setIsCheckingAttempt(false);
      }
    };

    checkAttempt();
  }, [quiz.id, studentId]);

  const handleAnswerSelect = (optionIdx: number) => {
    if (showFeedback) return;

    const correct = optionIdx === currentQuestion.correct_answer_index;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setUserAnswers(newAnswers);
    
    setIsCorrect(correct);
    setShowFeedback(true);

    // Fire confetti for correct answers
    if (correct) {
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      });
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate score
      let correctCount = 0;
      quiz.questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correct_answer_index) {
          correctCount++;
        }
      });

      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);

      // Submit quiz attempt
      await quizService.submitQuizAttempt({
        quizId: quiz.id,
        studentId,
        answers: userAnswers,
      });

      onComplete(scorePercentage, userAnswers);
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      setError(err.message || 'Не удалось отправить результаты');
      setIsSubmitting(false);
    }
  };

  if (isCheckingAttempt) {
    return (
      <div className="glass rounded-3xl shadow-xl p-8">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-slate-600">Проверка возможности прохождения...</p>
        </div>
      </div>
    );
  }

  if (!canAttempt) {
    return (
      <div className="glass rounded-3xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Викторина уже пройдена</h3>
          <p className="text-slate-600 mb-6">
            Вы уже прошли эту викторину. Для уроков учителей разрешена только одна попытка.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl shadow-xl p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Вопрос {currentQuestionIdx + 1} из {quiz.questions.length}
            </h2>
            <p className="text-slate-500 text-sm">{quiz.title}</p>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-500">
          {Math.round(progress)}% завершено
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 w-full bg-slate-100 rounded-full h-2">
        <motion.div 
          className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Question */}
      <div className="space-y-6">
        <div className="min-h-[100px] p-4 rounded-xl bg-slate-50">
          <MarkdownRenderer content={currentQuestion.question_text} />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, optIdx) => {
            let buttonStyle = 'border-slate-200 hover:border-primary-300 bg-white hover:bg-primary-50';
            let isSelected = userAnswers[currentQuestionIdx] === optIdx;
            
            if (showFeedback) {
              if (optIdx === currentQuestion.correct_answer_index) {
                buttonStyle = 'border-green-500 bg-green-50 text-green-700';
              } else if (isSelected) {
                buttonStyle = 'border-red-500 bg-red-50 text-red-700';
              } else {
                buttonStyle = 'border-slate-200 opacity-50';
              }
            } else if (isSelected) {
              buttonStyle = 'border-primary-500 bg-primary-50';
            }

            return (
              <motion.button
                key={optIdx}
                onClick={() => handleAnswerSelect(optIdx)}
                disabled={showFeedback}
                whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                className={`p-4 rounded-xl text-left border-2 transition-all font-medium ${buttonStyle} disabled:cursor-not-allowed`}
              >
                <MarkdownRenderer content={option} />
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-2xl ${
                isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'
              } border`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  isCorrect ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${
                    isCorrect ? 'text-green-800' : 'text-red-800'
                  } mb-1`}>
                    {isCorrect ? 'Правильно!' : 'Неправильно'}
                  </h4>
                  {!isCorrect && (
                    <p className={`text-sm ${
                      isCorrect ? 'text-green-700' : 'text-red-700'
                    } mb-2`}>
                      Правильный ответ: {currentQuestion.options[currentQuestion.correct_answer_index]}
                    </p>
                  )}
                  {currentQuestion.explanation && (
                    <p className={`text-sm ${
                      isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Next Button */}
        {showFeedback && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleNextQuestion}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Отправка результатов...
              </>
            ) : currentQuestionIdx < quiz.questions.length - 1 ? (
              <>
                Следующий вопрос
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </>
            ) : (
              <>
                Завершить викторину
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </motion.button>
        )}

        {/* Cancel Button (only shown before answering) */}
        {!showFeedback && (
          <button
            onClick={onCancel}
            className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Отменить
          </button>
        )}
      </div>
    </motion.div>
  );
}
