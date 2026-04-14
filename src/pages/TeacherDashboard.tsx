import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useStore } from '../store';
import {
  GraduationCap, BarChart3, TrendingUp,
  Search, Mail, AlertCircle
} from 'lucide-react';
import { TeacherClassAnalytics } from '../components/analytics/TeacherClassAnalytics';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

type Tab = 'students' | 'analytics';

export default function TeacherDashboard() {
  const profile = useStore((state) => state.profile);
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!profile || profile.role !== 'teacher') {
        setError('Вы должны быть учителем, привязанным к школе');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Resolve school from memberships first, then fallback to profile.school_id
        const { data: teacherMemberships, error: teacherMembershipsError } = await supabase
          .from('school_memberships')
          .select('school_id')
          .eq('user_id', profile.id)
          .eq('role', 'teacher');

        if (teacherMembershipsError) {
          throw teacherMembershipsError;
        }

        const teacherSchoolIds = Array.from(
          new Set((teacherMemberships || []).map((m: { school_id: string }) => m.school_id))
        );

        const resolvedActiveSchoolId = profile.school_id || teacherSchoolIds[0] || null;
        setActiveSchoolId(resolvedActiveSchoolId);

        if (teacherSchoolIds.length === 0 && !resolvedActiveSchoolId) {
          setError('Вы должны быть учителем, привязанным к школе');
          setStudents([]);
          setLoading(false);
          return;
        }

        const schoolIdsForQuery = teacherSchoolIds.length > 0
          ? teacherSchoolIds
          : resolvedActiveSchoolId
            ? [resolvedActiveSchoolId]
            : [];

        // Fetch all students from teacher schools
        const { data: memberships, error: membershipsError } = await supabase
          .from('school_memberships')
          .select(`
            user_id,
            user_profiles!inner (
              id,
              full_name,
              email,
              role,
              grade,
              wisdom_coins,
              created_at
            )
          `)
          .in('school_id', schoolIdsForQuery)
          .eq('role', 'student');

        if (membershipsError) {
          throw membershipsError;
        }

        // Transform and deduplicate by user id
        const studentsMap = new Map<string, UserProfile>();
        (memberships || []).forEach((m: any) => {
          if (m.user_profiles?.id) {
            studentsMap.set(m.user_profiles.id, m.user_profiles);
          }
        });

        setStudents(Array.from(studentsMap.values()));
      } catch (err: any) {
        console.error('Error fetching students:', err);
        setError(err.message || 'Не удалось загрузить список учеников');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [profile]);

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.grade && s.grade.toString().includes(searchQuery))
  );

  const tabs = [
    { id: 'students', label: 'Ученики', icon: GraduationCap },
    { id: 'analytics', label: 'Аналитика класса', icon: BarChart3 }
  ];

  if (!profile || profile.role !== 'teacher') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Эта страница доступна только для учителей</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка данных...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Мои ученики
            </h1>
            <p className="text-gray-600 mt-1">
              Управление учениками и просмотр аналитики класса
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="liquid-glass rounded-xl px-6 py-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{students.length}</div>
                  <div className="text-xs text-gray-500">Учеников</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="liquid-glass rounded-xl p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск учеников по имени, email или классу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <div className="liquid-glass rounded-xl p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {searchQuery ? 'Ученики не найдены' : 'Нет учеников'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery
                      ? 'Попробуйте изменить параметры поиска'
                      : 'В ваших школах пока нет зарегистрированных учеников'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="liquid-glass rounded-xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {student.full_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{student.full_name}</h3>
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {student.grade ? `${student.grade} класс` : 'Ученик'}
                        </span>
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {student.wisdom_coins || 0} монет
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && activeSchoolId && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TeacherClassAnalytics
                schoolId={activeSchoolId}
                teacherId={profile.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
