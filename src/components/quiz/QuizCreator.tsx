/**
 * QuizCreator Component
 * 
 * Allows users to create quizzes for lessons with AI generation
 * 
 * Requirements:
 * - 3.1: Quiz creation costs 5 Wisdom Coins
 * - 3.2: One quiz per lesson constraint
 */

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Plus, Trash2, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';
import { generateQuiz } from '@/services/ai.service';
import { quizService } from '@/services/quiz.service';
import { tokenEconomyService } from '@/services/token-economy.service';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import type { QuizQuestion } from '@/lib/supabase';

interface QuizCreatorProps {
  lessonId: string;
  lessonContent: string;
  userId: string;
  onQuizCreated: () => void;
  onCancel: () => void;
}

export function QuizCreator({ 
  lessonId, 
  lessonContent, 
  userId, 
  onQuizCreated, 
  onCancel 
}: QuizCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [canCreate, setCanCreate] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const QUIZ_COST = tokenEconomyService.calculateQuizCost();

  // Load user balance and check if quiz can be created
  useEffect(() => {
    const loadData = async () => {
      try {
        const balance = await tokenEconomyService.getBalance(userId);
        setUserBalance(balance);

        const canCreateQuiz = await quizService.canCreateQuiz(lessonId);
        setCanCreate(canCreateQuiz);
        
        if (!canCreateQuiz) {
          setError('Викторина для этого урока уже существует');
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Не удалось загрузить данные');
      }
    };

    loadData();
  }, [lessonId, userId]);

  const handleGenerateQuiz = async () => {
    if (!canCreate) {
      setError('Викторина для этого урока уже существует');
      return;
    }

    if (userBalance !== null && userBalance < QUIZ_COST) {
      setError(`Недостаточно монет! Требуется: ${QUIZ_COST}, у вас: ${userBalance}`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedQuestions = await generateQuiz(lessonContent, questionCount);
      setQuestions(generatedQuestions);
      setQuizTitle(`Викторина по уроку`);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      setError('Не удалось сгенерировать викторину. Попробуйте снова.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (questions.length === 0) {
      setError('Добавьте хотя бы один вопрос');
      return;
    }

    if (!quizTitle.trim()) {
      setError('Введите название викторины');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await quizService.createQuiz({
        lessonId,
        title: quizTitle,
        questions,
        createdBy: userId,
      });

      // Refresh balance
      const newBalance = await tokenEconomyService.getBalance(userId);
      setUserBalance(newBalance);

      onQuizCreated();
    } catch (err: any) {
      console.error('Failed to create quiz:', err);
      setError(err.message || 'Не удалось создать викторину');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateQuestion = (questionId: string, field: keyof QuizQuestion, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleUpdateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length < 6) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        // Adjust correct answer index if needed
        let newCorrectIndex = q.correct_answer_index;
        if (optionIndex === q.correct_answer_index) {
          newCorrectIndex = 0;
        } else if (optionIndex < q.correct_answer_index) {
          newCorrectIndex = q.correct_answer_index - 1;
        }
        return { ...q, options: newOptions, correct_answer_index: newCorrectIndex };
      }
      return q;
    }));
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      question_text: '',
      options: ['', ''],
      correct_answer_index: 0,
      explanation: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  if (!canCreate) {
    return (
      <div className="glass rounded-3xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Викторина уже существует</h3>
          <p className="text-slate-600 mb-6">Для этого урока уже создана викторина</p>
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
    <div className="glass rounded-3xl shadow-xl p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Создание викторины</h2>
              <p className="text-slate-500 text-sm">
                Стоимость: {QUIZ_COST} монет {userBalance !== null && `(у вас: ${userBalance})`}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Generation Section */}
      {questions.length === 0 && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Количество вопросов
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              disabled={isGenerating}
            >
              <option value={3}>3 вопроса</option>
              <option value={5}>5 вопросов</option>
              <option value={7}>7 вопросов</option>
              <option value={10}>10 вопросов</option>
            </select>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating || (userBalance !== null && userBalance < QUIZ_COST)}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Генерация викторины...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Сгенерировать с помощью AI
              </>
            )}
          </button>

          <button
            onClick={handleAddQuestion}
            className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Создать вопрос вручную
          </button>
        </div>
      )}

      {/* Questions Editor */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {/* Quiz Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Название викторины
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Введите название викторины"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
            />
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div key={question.id} className="p-6 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-bold text-slate-900">Вопрос {qIndex + 1}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingQuestionId(
                        editingQuestionId === question.id ? null : question.id
                      )}
                      className="p-2 text-slate-500 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {editingQuestionId === question.id ? (
                  <div className="space-y-4">
                    {/* Question Text Editor */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Текст вопроса
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => handleUpdateQuestion(question.id, 'question_text', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                        placeholder="Введите текст вопроса (поддерживается LaTeX)"
                      />
                    </div>

                    {/* Options Editor */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Варианты ответов
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correct_answer_index === optIndex}
                              onChange={() => handleUpdateQuestion(question.id, 'correct_answer_index', optIndex)}
                              className="w-4 h-4 text-primary-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleUpdateOption(question.id, optIndex, e.target.value)}
                              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                              placeholder={`Вариант ${optIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <button
                                onClick={() => handleRemoveOption(question.id, optIndex)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {question.options.length < 6 && (
                        <button
                          onClick={() => handleAddOption(question.id)}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Добавить вариант
                        </button>
                      )}
                    </div>

                    {/* Explanation Editor */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Объяснение (необязательно)
                      </label>
                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(question.id, 'explanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                        placeholder="Объяснение правильного ответа"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Question Preview */}
                    <div className="p-3 rounded-lg bg-slate-50">
                      <MarkdownRenderer content={question.question_text} />
                    </div>

                    {/* Options Preview */}
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border-2 ${
                            optIndex === question.correct_answer_index
                              ? 'border-green-500 bg-green-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {optIndex === question.correct_answer_index && (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                            <MarkdownRenderer content={option} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explanation Preview */}
                    {question.explanation && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Объяснение:</p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <button
            onClick={handleAddQuestion}
            className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Добавить вопрос
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateQuiz}
              disabled={isCreating || questions.length === 0 || !quizTitle.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Создать викторину
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
