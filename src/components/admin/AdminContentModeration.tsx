import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, MessageSquare, Filter, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  content: string;
  teacher_id: string;
  created_at: string;
  teacher: {
    full_name: string;
    email: string;
  };
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: any[];
  creator_id: string;
  created_at: string;
  creator: {
    full_name: string;
    email: string;
  };
}

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

export const AdminContentModeration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'chats'>('lessons');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'lessons') {
      loadLessons();
    } else if (activeTab === 'quizzes') {
      loadQuizzes();
    } else {
      loadChatMessages();
    }
  }, [activeTab, subjectFilter]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lessons')
        .select(`
          *,
          teacher:user_profiles!lessons_teacher_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (subjectFilter !== 'all') {
        query = query.eq('subject', subjectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          creator:user_profiles!quizzes_creator_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (subjectFilter !== 'all') {
        query = query.eq('subject', subjectFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select(`
          *,
          user:user_profiles(full_name, email)
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Удалить этот урок?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      await loadLessons();
      alert('Урок удалён');
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      alert('Ошибка при удалении урока');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Удалить этот квиз?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
      await loadQuizzes();
      alert('Квиз удалён');
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Ошибка при удалении квиза');
    }
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    if (!confirm('Удалить это сообщение?')) return;

    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      await loadChatMessages();
      alert('Сообщение удалено');
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Ошибка при удалении сообщения');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Модерация контента</h2>
        <p className="text-slate-500">Управление уроками, квизами и чатами</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('lessons')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'lessons'
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
              : 'glass text-slate-600 hover:bg-white/80'
          )}
        >
          <BookOpen className="w-5 h-5" />
          Уроки ({lessons.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'quizzes'
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
              : 'glass text-slate-600 hover:bg-white/80'
          )}
        >
          <Trophy className="w-5 h-5" />
          Квизы ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all",
            activeTab === 'chats'
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
              : 'glass text-slate-600 hover:bg-white/80'
          )}
        >
          <MessageSquare className="w-5 h-5" />
          Чаты ({chatMessages.length})
        </button>
      </div>

      {/* Filters */}
      {(activeTab === 'lessons' || activeTab === 'quizzes') && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-bold text-slate-800">Фильтры</h3>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Предмет</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full md:w-64 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            >
              <option value="all">Все предметы</option>
              <option value="mathematics">Математика</option>
              <option value="physics">Физика</option>
              <option value="chemistry">Химия</option>
              <option value="biology">Биология</option>
              <option value="history">История</option>
              <option value="literature">Литература</option>
              <option value="english">Английский</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            {activeTab === 'lessons' && <BookOpen className="w-10 h-10 text-primary-500" />}
            {activeTab === 'quizzes' && <Trophy className="w-10 h-10 text-primary-500" />}
            {activeTab === 'chats' && <MessageSquare className="w-10 h-10 text-primary-500" />}
          </div>
          <p className="text-slate-500">Загрузка...</p>
        </div>
      ) : activeTab === 'lessons' ? (
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <p className="text-slate-500">Нет уроков</p>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">{lesson.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {lesson.subject}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">{lesson.content}</p>
                    <p className="text-sm text-slate-500">
                      Автор: {lesson.teacher.full_name} ({lesson.teacher.email})
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(lesson.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors ml-4"
                    title="Удалить урок"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : activeTab === 'quizzes' ? (
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <p className="text-slate-500">Нет квизов</p>
            </div>
          ) : (
            quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">{quiz.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                        {quiz.subject}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {quiz.questions?.length || 0} вопросов
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Автор: {quiz.creator.full_name} ({quiz.creator.email})
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(quiz.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors ml-4"
                    title="Удалить квиз"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <p className="text-slate-500">Нет сообщений</p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      {message.user.full_name} ({message.user.email})
                    </p>
                    <p className="text-slate-800 mb-2">{message.content}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(message.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteChatMessage(message.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors ml-4"
                    title="Удалить сообщение"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
