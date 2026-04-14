import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useStore } from '../store';
import { 
  Users, GraduationCap, MessageCircle, TrendingUp, 
  School, Search, Mail, ChevronRight
} from 'lucide-react';
import { parentSchoolService, type School as SchoolType } from '../services/parent-school.service';
import type { UserProfile, Chat } from '../lib/supabase';

type Tab = 'overview' | 'teachers' | 'students' | 'chats';

export default function SchoolDashboard() {
  const profile = useStore((state) => state.profile);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // School data
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [parentChats, setParentChats] = useState<Chat[]>([]);
  const [teacherChats, setTeacherChats] = useState<Chat[]>([]);

  if (!profile || profile.role !== 'parent') return null;

  // Fetch school data
  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!profile.school_id) {
        setError('Вы не привязаны к школе');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch school information
        const schoolData = await parentSchoolService.getSchool(profile.school_id);
        setSchool(schoolData);

        // Fetch school members
        const [teachersData, studentsData, parentsData] = await Promise.all([
          parentSchoolService.getSchoolMembers(profile.school_id, 'teacher'),
          parentSchoolService.getSchoolMembers(profile.school_id, 'student'),
          parentSchoolService.getSchoolMembers(profile.school_id, 'parent'),
        ]);

        setTeachers(teachersData);
        setStudents(studentsData);
        setParents(parentsData);

        // Fetch school chats for parent
        const chats = await parentSchoolService.getSchoolChatsForParent(profile.id, profile.school_id);
        setParentChats(chats.filter(c => c.type === 'school_parent'));
        setTeacherChats(chats.filter(c => c.type === 'school_teacher'));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching school data:', err);
        setError('Не удалось загрузить данные школы');
        setLoading(false);
      }
    };

    fetchSchoolData();
  }, [profile]);

  const filteredTeachers = teachers.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: TrendingUp },
    { id: 'teachers', label: 'Учителя', icon: Users },
    { id: 'students', label: 'Ученики', icon: GraduationCap },
    { id: 'chats', label: 'Чаты', icon: MessageCircle }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка данных школы...</p>
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
            <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
            {school?.name || 'Школа'}
          </h1>
          <p className="text-gray-600 mt-1">
            {school?.address || 'Информация о школе'}
          </p>
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
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Учителей', value: teachers.length, icon: Users, color: 'from-emerald-500 to-teal-500' },
                { label: 'Учеников', value: students.length, icon: GraduationCap, color: 'from-blue-500 to-cyan-500' },
                { label: 'Родителей', value: parents.length, icon: Users, color: 'from-purple-500 to-pink-500' },
                { label: 'Чатов', value: parentChats.length + teacherChats.length, icon: MessageCircle, color: 'from-orange-500 to-red-500' }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="liquid-glass rounded-xl p-4"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* School Information */}
            <div className="liquid-glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-500" />
                Информация о школе
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-gray-600">Название:</span>
                  <span className="font-medium text-gray-800">{school?.name}</span>
                </div>
                {school?.address && (
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <span className="text-gray-600">Адрес:</span>
                    <span className="font-medium text-gray-800">{school.address}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="text-gray-600">Дата создания:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(school?.created_at || '').toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'teachers' && (
          <motion.div
            key="teachers"
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
                  placeholder="Поиск учителей..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>

            {/* Teachers List */}
            {filteredTeachers.length === 0 ? (
              <div className="liquid-glass rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Нет учителей</h3>
                <p className="text-gray-500">В школе пока нет зарегистрированных учителей</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map(teacher => (
                  <motion.div
                    key={teacher.id}
                    whileHover={{ scale: 1.02 }}
                    className="liquid-glass rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {teacher.full_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{teacher.full_name}</h3>
                        <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Учитель
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

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
                  placeholder="Поиск учеников..."
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
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Нет учеников</h3>
                <p className="text-gray-500">В школе пока нет зарегистрированных учеников</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                  <motion.div
                    key={student.id}
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
                        Ученик
                      </span>
                      <span className="text-gray-500 text-xs">
                        {student.wisdom_coins} монет
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'chats' && (
          <motion.div
            key="chats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Parent Chats */}
            <div className="liquid-glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                Чаты для родителей
              </h3>
              {parentChats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Нет доступных чатов для родителей</p>
              ) : (
                <div className="space-y-3">
                  {parentChats.map(chat => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{chat.name}</h4>
                          <p className="text-sm text-gray-500">
                            Создан {new Date(chat.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Chats */}
            <div className="liquid-glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                Чаты с учителями
              </h3>
              {teacherChats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Нет доступных чатов с учителями</p>
              ) : (
                <div className="space-y-3">
                  {teacherChats.map(chat => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{chat.name}</h4>
                          <p className="text-sm text-gray-500">
                            Создан {new Date(chat.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </Layout>
  );
}
