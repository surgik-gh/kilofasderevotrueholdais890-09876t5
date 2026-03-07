/**
 * Assessment Quiz Component
 * Displays assessment quiz questions and collects student answers
 * 
 * Requirements:
 * - 1.2: Display assessment quiz questions
 * - 1.3: Collect and submit answers
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  BookOpen,
  Trophy,
  Loader2
} from 'lucide-react';
import { assessmentService, type AssessmentQuestion, type AssessmentAnswer } from '../../services/assessment.service';
import type { AssessmentResult } from '../../types/platform';

interface AssessmentQuizProps {
  studentId: string;
  grade: string;
  onComplete: (results: AssessmentResult[]) => void;
}

export default function AssessmentQuiz({ studentId, grade, onComplete }: AssessmentQuizProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [error, setError] = useState('');

  // Load assessment quiz on mount
  useEffect(() => {
    loadAssessmentQuiz();
  }, [grade]);

  const loadAssessmentQuiz = async () => {
    setLoading(true);
    setError('');

    try {
      const quiz = await assessmentService.generateAssessmentQuiz(grade);
      setQuestions(quiz.questions);
    } catch (err) {
      console.error('Failed to load assessment quiz:', err);
      setError('Не удалось загрузить оценочный квиз. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, answerIndex);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (answers.size < questions.length) {
      setError('Пожалуйста, ответьте на все вопросы');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Prepare answers for submission
      const assessmentAnswers: AssessmentAnswer[] = questions.map(q => {
        const selectedIndex = answers.get(q.id) || 0;
        return {
          question_id: q.id,
          subject: q.subject,
          selected_answer_index: selectedIndex,
          correct_answer_index: q.correct_answer_index,
          is_correct: selectedIndex === q.correct_answer_index,
        };
      });

      // Submit assessment
      const submittedResults = await assessmentService.submitAssessment({
        student_id: studentId,
        answers: assessmentAnswers,
      });

      setResults(submittedResults);
      setShowResults(true);
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError('Не удалось отправить результаты. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    onComplete(results);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Генерируем оценочный квиз...</p>
        </motion.div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl p-8 max-w-md text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadAssessmentQuiz}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Попробовать снова
          </button>
        </motion.div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="liquid-glass rounded-3xl p-8 max-w-2xl w-full"
        >
          <div className="text-center mb-8">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Оценка завершена!</h2>
            <p className="text-gray-600">Вот ваши результаты по предметам</p>
          </div>

          <div className="space-y-4 mb-8">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/50 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{result.subject}</h3>
                    <p className="text-sm text-gray-500">
                      {result.score_percentage.toFixed(0)}% правильных ответов
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    result.score_percentage >= 80 ? 'text-green-600' :
                    result.score_percentage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {result.score_percentage.toFixed(0)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Что дальше?</h3>
            <p className="text-sm text-gray-600">
              На основе ваших результатов мы создадим персонализированную программу обучения. 
              Вы сможете улучшить свои знания по слабым предметам и развить сильные стороны!
            </p>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Перейти к платформе
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers.get(currentQuestion.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-3xl p-8 max-w-3xl w-full"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Оценочный квиз</h2>
              <p className="text-gray-600">
                Вопрос {currentQuestionIndex + 1} из {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Предмет</div>
              <div className="font-semibold text-blue-600">{currentQuestion.subject}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion.question_text}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedAnswer === index
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-white/50 hover:bg-white/80 text-gray-800'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? 'border-white bg-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600"
          >
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </button>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={selectedAnswer === undefined}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Далее
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedAnswer === undefined}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Завершить
                </>
              )}
            </button>
          )}
        </div>

        {/* Answered questions indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`w-2 h-2 rounded-full transition-all ${
                answers.has(q.id)
                  ? 'bg-blue-600'
                  : index === currentQuestionIndex
                  ? 'bg-blue-300'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
