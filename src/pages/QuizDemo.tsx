/**
 * Quiz Demo Page
 * 
 * Demonstrates the usage of the new quiz components:
 * - QuizCreator: Create quizzes with AI generation
 * - QuizPlayer: Take quizzes with question-by-question flow
 * - ResultsDisplay: View quiz results with detailed breakdown
 * 
 * This page shows how to integrate these components with the Supabase backend services.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { QuizCreator, QuizPlayer, ResultsDisplay } from '@/components/quiz';
import { quizService } from '@/services/quiz.service';
import { supabase } from '@/lib/supabase';
import { Loader2, BookOpen, Brain } from 'lucide-react';
import type { Quiz, Lesson } from '@/lib/supabase';

type ViewMode = 'lesson' | 'create-quiz' | 'take-quiz' | 'results';

export function QuizDemo() {
  const { lessonId } = useParams<{ lessonId: string }>();
  
  const [viewMode, setViewMode] = useState<ViewMode>('lesson');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  // Load lesson and quiz data
  useEffect(() => {
    const loadData = async () => {
      if (!lessonId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setCurrentUser(profile);
        }

        // Get lesson
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;
        setLesson(lessonData as Lesson);

        // Check if quiz exists
        const existingQuiz = await quizService.getQuizByLessonId(lessonId);
        if (existingQuiz) {
          setQuiz(existingQuiz);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [lessonId]);

  const handleQuizCreated = async () => {
    // Reload quiz data
    if (lessonId) {
      const existingQuiz = await quizService.getQuizByLessonId(lessonId);
      if (existingQuiz) {
        setQuiz(existingQuiz);
      }
    }
    setViewMode('lesson');
  };

  const handleQuizComplete = (score: number, answers: number[]) => {
    setQuizScore(score);
    setQuizAnswers(answers);
    setViewMode('results');
  };

  const handleRetryQuiz = () => {
    setViewMode('take-quiz');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        </div>
      </Layout>
    );
  }

  if (!lesson || !currentUser) {
    return (
      <Layout>
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Урок не найден</h2>
          <p className="text-slate-600">Пожалуйста, выберите урок из списка</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Lesson View */}
        {viewMode === 'lesson' && (
          <div className="space-y-6">
            {/* Lesson Content */}
            <div className="glass rounded-3xl shadow-xl p-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{lesson.title}</h1>
              <div className="prose max-w-none">
                <p>{lesson.content}</p>
              </div>
            </div>

            {/* Quiz Actions */}
            <div className="glass rounded-3xl shadow-xl p-6">
              {quiz ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-primary-600" />
                    <div>
                      <h3 className="font-bold text-slate-900">Викторина готова</h3>
                      <p className="text-sm text-slate-600">{quiz.questions.length} вопросов</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewMode('take-quiz')}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    Пройти викторину
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-slate-400" />
                    <div>
                      <h3 className="font-bold text-slate-900">Создайте викторину</h3>
                      <p className="text-sm text-slate-600">Проверьте свои знания</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewMode('create-quiz')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    Создать викторину
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Creator */}
        {viewMode === 'create-quiz' && (
          <QuizCreator
            lessonId={lesson.id}
            lessonContent={lesson.content}
            userId={currentUser.id}
            onQuizCreated={handleQuizCreated}
            onCancel={() => setViewMode('lesson')}
          />
        )}

        {/* Quiz Player */}
        {viewMode === 'take-quiz' && quiz && (
          <QuizPlayer
            quiz={quiz}
            studentId={currentUser.id}
            onComplete={handleQuizComplete}
            onCancel={() => setViewMode('lesson')}
          />
        )}

        {/* Results Display */}
        {viewMode === 'results' && quiz && (
          <ResultsDisplay
            quiz={quiz}
            score={quizScore}
            userAnswers={quizAnswers}
            onClose={() => setViewMode('lesson')}
            onRetry={handleRetryQuiz}
          />
        )}
      </div>
    </Layout>
  );
}
