import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { Layout } from '@/components/Layout';
import { generateQuiz } from '@/services/ai.service';
import { lessonService } from '@/services/lesson.service';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Loader2, Trophy, Brain, ArrowLeft, CheckCircle, XCircle, Sparkles, BookOpen, Star, ThumbsUp, BookMarked, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lesson, Quiz } from '@/lib/supabase';

export function LessonView() {
  const { id } = useParams<{ id: string }>();
  const { 
    lessons, 
    profile,
    quizzes,
    users,
    quizResults,
    createQuiz, 
    subtractCoins,
    updateLeaderboard,
    submitQuizResult,
    addUserCoins
  } = useStore();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [existingQuiz, setExistingQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);

  // Load lesson from Supabase
  useEffect(() => {
    const loadLesson = async () => {
      if (!id) return;
      
      setIsLoadingLesson(true);
      try {
        const loadedLesson = await lessonService.getLesson(id);
        setLesson(loadedLesson);
      } catch (error) {
        console.error('Failed to load lesson:', error);
        setLesson(null);
      } finally {
        setIsLoadingLesson(false);
      }
    };

    loadLesson();
  }, [id]);

  // Load quiz from Supabase
  useEffect(() => {
    const loadQuiz = async () => {
      if (!id) return;
      
      setIsLoadingQuiz(true);
      try {
        const { quizService } = await import('@/services/quiz.service');
        const quiz = await quizService.getQuizByLessonId(id);
        setExistingQuiz(quiz);
      } catch (error) {
        console.log('No quiz found for this lesson');
        setExistingQuiz(null);
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    loadQuiz();
  }, [id]);
  
  const isTeacher = profile?.role === 'teacher';
  const isLessonCreator = profile?.id === lesson?.creator_id;
  
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState<'view' | 'take' | 'result'>('view');
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // New states for one-by-one flow
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  
  // Progress tracking for teachers
  const [showProgress, setShowProgress] = useState(false);
  const studentProgress = existingQuiz && isTeacher && lesson
    ? quizResults.filter(r => r.quizId === existingQuiz.id).map(r => {
        const student = users.find(u => u.id === r.userId);
        return {
          studentName: student?.name || 'Unknown',
          score: r.score,
          timestamp: r.timestamp
        };
      })
    : [];

  // Quiz creation cost
  const QUIZ_CREATION_COST = 5;

  // Import canvas-confetti dynamically
  const fireConfetti = () => {
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });
  };

  if (isLoadingLesson) {
    return (
      <Layout>
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-slate-500">Загрузка урока...</p>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Урок не найден</h2>
          <p className="text-slate-500 mb-6">Возможно, он был удалён или перемещён</p>
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-semibold">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            На главную
          </Link>
        </div>
      </Layout>
    );
  }

  const handleCreateQuiz = async () => {
    if (!profile || !lesson) return;
    
    // Check balance
    if (profile.wisdom_coins < QUIZ_CREATION_COST) {
      alert(`Недостаточно монет! Стоимость создания викторины: ${QUIZ_CREATION_COST} монет. У вас: ${profile.wisdom_coins} монет.`);
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      console.log('Generating quiz questions...');
      const rawQuestions = await generateQuiz(lesson.content, 5);
      console.log('Questions generated:', rawQuestions);
      
      // Use quiz service to create quiz in Supabase
      const { quizService } = await import('@/services/quiz.service');
      
      console.log('Creating quiz in database...');
      const newQuiz = await quizService.createQuiz({
        lessonId: lesson.id,
        title: `Викторина: ${lesson.title}`,
        questions: rawQuestions,
        createdBy: profile.id
      });
      
      console.log('Quiz created successfully:', newQuiz.id);
      
      // Set the quiz and reload
      setExistingQuiz(newQuiz);
      setIsLoadingQuiz(false);
    } catch (error) {
      console.error('Quiz creation error:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      console.error('Error JSON:', JSON.stringify(error, null, 2));
      
      if (error && typeof error === 'object') {
        console.error('Error properties:');
        for (const key in error) {
          console.error(`  ${key}:`, (error as any)[key]);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 
                          (error && typeof error === 'object' && 'message' in error) ? (error as any).message :
                          JSON.stringify(error);
      alert(`Ошибка при создании викторины: ${errorMessage}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleStartQuiz = () => {
    if (!existingQuiz || !profile || !lesson) return;

    const previousResult = quizResults.find(r => r.userId === profile.id && r.quizId === existingQuiz.id);
    const author = users.find(u => u.id === lesson.creator_id);
    
    if (author?.role === 'teacher' && previousResult) {
      alert(`Вы уже прошли эту викторину. Результат: ${previousResult.score}%`);
      return;
    }

    setUserAnswers(new Array(existingQuiz.questions.length).fill(-1));
    setCurrentQuestionIdx(0);
    setQuizMode('take');
  };

  const handleAnswerSelect = (optionIdx: number) => {
    if (!existingQuiz || showFeedback) return;

    const question = existingQuiz.questions[currentQuestionIdx];
    const correct = optionIdx === question.correct_answer_index;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setUserAnswers(newAnswers);
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setCelebrate(true);
      fireConfetti();
      // +10 rating, +0.5 coins immediately for correct answer?
      // Or just visual?
      // Prompt says: "рейтинг +10, монеты мудрости + 0.5"
      // We should probably only award real coins/rating at the end or track it?
      // Let's do visual feedback here and real update at the end to avoid exploit by refreshing.
    }
  };

  const handleNextQuestion = () => {
    if (!existingQuiz) return;
    
    setCelebrate(false);
    setShowFeedback(false);
    
    if (currentQuestionIdx < existingQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!existingQuiz || !profile || !lesson) return;
    
    let correctCount = 0;
    existingQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer_index) correctCount++;
    });

    const percentage = Math.round((correctCount / existingQuiz.questions.length) * 100);
    setScore(percentage);
    setQuizMode('result');
    
    submitQuizResult(profile.id, existingQuiz.id, percentage);

    const author = users.find(u => u.id === lesson.creator_id);
    
    // Awards logic:
    // Coins: 0.5 coins per correct answer
    const coinsEarned = correctCount * 0.5;
    if (coinsEarned > 0) {
      addUserCoins(profile.id, coinsEarned);
    }
    
    // Leaderboard: only for self-created lessons
    if (author?.role !== 'teacher') {
      // Add 10 points per correct answer to leaderboard
      updateLeaderboard(profile.id, correctCount * 10);
    }
  };
  
  const getResultIcon = () => {
    if (score >= 80) return <Star className="w-16 h-16 text-white" />;
    if (score >= 50) return <ThumbsUp className="w-16 h-16 text-white" />;
    return <BookMarked className="w-16 h-16 text-white" />;
  };

  const getResultTitle = () => {
    if (score >= 80) return 'Отлично!';
    if (score >= 50) return 'Неплохо!';
    return 'Стоит повторить';
  };

  return (
    <Layout isThinking={isGeneratingQuiz} celebrating={celebrate}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link 
          to="/lessons" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          К списку уроков
        </Link>

        {quizMode === 'view' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
                  <Sparkles className="w-4 h-4" />
                  {lesson.subject}
                </span>
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                <p className="text-white/70 mt-2 text-sm">
                  Создано: {new Date(lesson.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {/* Content with LaTeX support */}
            <div className="p-8">
              <MarkdownRenderer content={lesson.content} />
            </div>

            {/* Quiz Section */}
            <div className="p-8 pt-0">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                {existingQuiz ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg">
                          <Brain className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">Викторина готова!</h3>
                          <p className="text-sm text-slate-500">{existingQuiz.questions.length} вопросов</p>
                        </div>
                      </div>
                      <button
                        onClick={handleStartQuiz}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all btn-shine"
                      >
                        Пройти викторину
                      </button>
                    </div>
                    
                    {/* Teacher Progress View */}
                    {isTeacher && isLessonCreator && studentProgress.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => setShowProgress(!showProgress)}
                          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          Прогресс учеников ({studentProgress.length})
                          <TrendingUp className={`w-4 h-4 transition-transform ${showProgress ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showProgress && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2"
                          >
                            {studentProgress.map((progress, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                    {progress.studentName[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800">{progress.studentName}</p>
                                    <p className="text-xs text-slate-500">
                                      {new Date(progress.timestamp).toLocaleDateString('ru-RU')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${progress.score >= 80 ? 'text-green-600' : progress.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {progress.score}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-lg shrink-0">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">Создайте викторину</h3>
                        <p className="text-xs sm:text-sm text-slate-500">Проверьте знания по этой теме</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      {profile && profile.wisdom_coins < QUIZ_CREATION_COST && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          Недостаточно монет
                        </div>
                      )}
                      <button
                        onClick={handleCreateQuiz}
                        disabled={isGeneratingQuiz || (profile ? profile.wisdom_coins < QUIZ_CREATION_COST : false)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-shine text-sm sm:text-base whitespace-nowrap"
                      >
                        {isGeneratingQuiz ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span className="hidden sm:inline">Создание...</span>
                          </span>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Создать за {QUIZ_CREATION_COST} монет</span>
                            <span className="sm:hidden">Создать ({QUIZ_CREATION_COST})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {quizMode === 'take' && existingQuiz && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-lg">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Вопрос {currentQuestionIdx + 1} из {existingQuiz.questions.length}</h2>
                  <p className="text-slate-500 text-sm">Викторина</p>
                </div>
              </div>
              <div className="text-sm font-medium text-slate-500">
                {Math.round(((currentQuestionIdx) / existingQuiz.questions.length) * 100)}% завершено
              </div>
            </div>

            <div className="mb-6 w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIdx) / existingQuiz.questions.length) * 100}%` }}
              />
            </div>

            <div className="space-y-6">
              <div className="min-h-[100px]">
                <MarkdownRenderer content={existingQuiz.questions[currentQuestionIdx].question_text} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {existingQuiz.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                  let buttonStyle = 'border-slate-200 hover:border-primary-300 bg-white';
                  if (showFeedback) {
                    if (optIdx === existingQuiz.questions[currentQuestionIdx].correct_answer_index) {
                      buttonStyle = 'border-green-500 bg-green-50 text-green-700';
                    } else if (optIdx === userAnswers[currentQuestionIdx]) {
                      buttonStyle = 'border-red-500 bg-red-50 text-red-700';
                    } else {
                      buttonStyle = 'border-slate-200 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswerSelect(optIdx)}
                      disabled={showFeedback}
                      className={`p-4 rounded-xl text-left border-2 transition-all font-medium ${buttonStyle}`}
                    >
                      <MarkdownRenderer content={opt} />
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'} border ${isCorrect ? 'border-green-200' : 'border-red-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'} mb-1`}>
                          {isCorrect ? 'Молодец!' : 'Не расстраивайся!'}
                        </h4>
                        <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          {isCorrect 
                            ? 'Рейтинг +10, Монеты мудрости +0.5' 
                            : `Правильный ответ: ${existingQuiz.questions[currentQuestionIdx].options[existingQuiz.questions[currentQuestionIdx].correct_answer_index]}`
                          }
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-red-600 mt-2">
                            Запомни это для следующего раза!
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {showFeedback && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleNextQuestion}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all btn-shine flex items-center justify-center gap-2"
                >
                  {currentQuestionIdx < existingQuiz.questions.length - 1 ? 'Следующий вопрос' : 'Завершить викторину'}
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {quizMode === 'result' && existingQuiz && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl shadow-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mb-8 inline-flex p-8 rounded-full"
              style={{
                background: score >= 80 
                  ? 'linear-gradient(135deg, #22c55e, #10b981)' 
                  : score >= 50 
                    ? 'linear-gradient(135deg, #f59e0b, #eab308)'
                    : 'linear-gradient(135deg, #ef4444, #f97316)'
              }}
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
              className="text-6xl font-black gradient-text mb-6"
            >
              {score}%
            </motion.div>

            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              {score >= 80 
                ? 'Вы отлично усвоили материал! Продолжайте в том же духе.' 
                : score >= 50 
                  ? 'Хороший результат, но есть над чем поработать.' 
                  : 'Рекомендуем перечитать урок и попробовать снова.'}
            </p>
            
            {/* Answers breakdown */}
            <div className="space-y-4 text-left max-w-2xl mx-auto mb-8">
              {existingQuiz.questions.map((q, i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-slate-200">
                  <p className="font-medium text-slate-800 mb-2">{q.question_text}</p>
                  <div className="flex items-center gap-2 text-sm">
                    {userAnswers[i] === q.correct_answer_index ? (
                      <span className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Верно
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4 mr-1" />
                        Правильный: {q.options[q.correct_answer_index]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setQuizMode('view')}
                className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                К уроку
              </button>
              <Link
                to="/lessons"
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Другие уроки
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
