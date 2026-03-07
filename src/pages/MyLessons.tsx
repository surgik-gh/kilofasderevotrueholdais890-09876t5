import { useStore } from '@/store';
import { Layout } from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Edit, Trash2, Trophy, Eye, Plus, Calendar, Users, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { lessonService } from '@/services/lesson.service';
import type { Lesson } from '@/lib/supabase';
import { SUBJECT_MAPPING_REVERSE } from '@/utils/subjects';

export function MyLessons() {
  const { profile } = useStore();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load lessons from Supabase
  useEffect(() => {
    const loadLessons = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      try {
        const loadedLessons = await lessonService.getLessonsByCreator(profile.id);
        setLessons(loadedLessons);
      } catch (error) {
        console.error('Failed to load lessons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLessons();
  }, [profile]);

  if (!profile) {
    navigate('/login');
    return null;
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены? Это действие нельзя отменить.')) return;
    
    try {
      await lessonService.deleteLesson(id, profile.id);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      alert('Ошибка при удалении урока');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-slate-500">Загрузка уроков...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Мои уроки</h1>
            <p className="text-slate-500">Управляйте своими учебными материалами</p>
          </div>
          <Link
            to="/create-lesson"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all btn-shine"
          >
            <Plus className="w-5 h-5" />
            Создать урок
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-16 glass rounded-3xl">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">У вас пока нет уроков</h2>
            <p className="text-slate-500 mb-6">Создайте свой первый урок с помощью ИИ</p>
            <Link
              to="/create-lesson"
              className="text-primary-600 font-semibold hover:underline"
            >
              Создать сейчас
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson, index) => {
              // Convert English subject to Russian for display
              const subjectRu = SUBJECT_MAPPING_REVERSE[lesson.subject] || lesson.subject;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="p-2 bg-white/50 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg transition-colors backdrop-blur-sm"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-6">
                      <span className="text-xs font-bold px-2 py-1 bg-white/60 backdrop-blur-sm rounded-full text-slate-600 mb-2 inline-block">
                        {subjectRu}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{lesson.title}</h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lesson.created_at).toLocaleDateString('ru-RU')}
                      </span>
                      <Link
                        to={`/lesson/${lesson.id}`}
                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Просмотр
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
