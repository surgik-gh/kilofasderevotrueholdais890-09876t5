import { useSearchParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { Layout } from '@/components/Layout';
import { Book, Trophy, Search, Sparkles, GraduationCap, Filter } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SUBJECT_CATEGORIES } from '@/utils/subjects';

export function LessonList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectFilter = searchParams.get('subject');
  const categoryFilter = searchParams.get('category');
  const { lessons, users } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const filteredLessons = lessons.filter(lesson => {
    const matchesSubject = subjectFilter ? lesson.subject === subjectFilter : true;
    const matchesCategory = categoryFilter 
      ? Object.entries(SUBJECT_CATEGORIES).some(([cat, subjects]) => 
          cat === categoryFilter && subjects.includes(lesson.subject)
        )
      : true;
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesCategory && matchesSearch;
  });

  const getAuthor = (authorId: string) => users.find(u => u.id === authorId);
  
  const handleCategorySelect = (category: string) => {
    if (categoryFilter === category) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    searchParams.delete('subject');
    setSearchParams(searchParams);
    setShowCategoryFilter(false);
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 font-medium text-sm mb-3"
            >
              <Sparkles className="w-4 h-4" />
              {categoryFilter || subjectFilter || 'Все предметы'}
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold"
            >
              <span className="gradient-text">
                {categoryFilter ? `Категория: ${categoryFilter}` : subjectFilter ? `Уроки: ${subjectFilter}` : 'Библиотека уроков'}
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 mt-1"
            >
              Найдено {filteredLessons.length} материалов
            </motion.p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                  categoryFilter 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-slate-200 bg-white/80 text-slate-600 hover:border-primary-300'
                }`}
              >
                <Filter className="w-5 h-5" />
                Категория
              </button>
              
              {showCategoryFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 right-0 glass rounded-xl p-2 shadow-xl z-10 min-w-[200px]"
                >
                  <button
                    onClick={() => {
                      searchParams.delete('category');
                      setSearchParams(searchParams);
                      setShowCategoryFilter(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700"
                  >
                    Все категории
                  </button>
                  {Object.keys(SUBJECT_CATEGORIES).map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        categoryFilter === category
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            
            {/* Search */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative flex-1 md:w-80"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск уроков..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white/80 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
              />
            </motion.div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson, index) => {
            const author = getAuthor(lesson.authorId);
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  to={`/lesson/${lesson.id}`}
                  className="group block glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 card-hover"
                >
                  {/* Card Header */}
                  <div className="h-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-purple-400 to-pink-400 opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Book className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Subject badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-xs font-bold px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full">
                        {lesson.subject}
                      </span>
                    </div>
                    {/* Quiz badge */}
                    {lesson.hasQuiz && (
                      <div className="absolute top-4 right-4">
                        <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-full shadow-lg">
                          <Trophy className="w-3 h-3" />
                          Викторина
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                      {lesson.content.slice(0, 100).replace(/[#*`]/g, '')}...
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                          author?.role === 'teacher' 
                            ? "bg-gradient-to-br from-purple-400 to-pink-500"
                            : "bg-gradient-to-br from-primary-400 to-cyan-500"
                        )}>
                          {author?.name?.[0] || '?'}
                        </div>
                        <div className="text-xs">
                          <p className="font-medium text-slate-700">{author?.name || 'Автор'}</p>
                          <p className="text-slate-400 flex items-center gap-1">
                            {author?.role === 'teacher' && <GraduationCap className="w-3 h-3" />}
                            {author?.role === 'teacher' ? 'Учитель' : 'Ученик'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          
          {filteredLessons.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Ничего не найдено</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Попробуйте изменить параметры поиска или создайте новый урок
              </p>
              <Link 
                to="/create-lesson"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all btn-shine"
              >
                <Sparkles className="w-5 h-5" />
                Создать урок
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
