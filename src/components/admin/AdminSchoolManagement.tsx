import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Plus, Edit, Trash2, Users, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface School {
  id: string;
  name: string;
  address?: string;
  created_at: string;
}

interface SchoolMember {
  id: string;
  user_id: string;
  school_id: string;
  role: 'teacher' | 'student';
  user_profile: {
    full_name: string;
    email: string;
    role: string;
  };
}

export const AdminSchoolManagement: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [schoolMembers, setSchoolMembers] = useState<SchoolMember[]>([]);
  const [newSchool, setNewSchool] = useState({ name: '', address: '' });

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredSchools(schools.filter(school => 
        school.name.toLowerCase().includes(query) ||
        school.address?.toLowerCase().includes(query)
      ));
    } else {
      setFilteredSchools(schools);
    }
  }, [schools, searchQuery]);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Failed to load schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolMembers = async (schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from('school_memberships')
        .select(`
          *,
          user_profile:user_profiles(full_name, email, role)
        `)
        .eq('school_id', schoolId);
      
      if (error) throw error;
      setSchoolMembers(data || []);
    } catch (error) {
      console.error('Failed to load school members:', error);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('schools')
        .insert([{ name: newSchool.name, address: newSchool.address }]);
      
      if (error) throw error;
      
      await loadSchools();
      setShowCreateModal(false);
      setNewSchool({ name: '', address: '' });
      alert('Школа создана');
    } catch (error) {
      console.error('Failed to create school:', error);
      alert('Ошибка при создании школы');
    }
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    
    try {
      const { error } = await supabase
        .from('schools')
        .update({ name: selectedSchool.name, address: selectedSchool.address })
        .eq('id', selectedSchool.id);
      
      if (error) throw error;
      
      await loadSchools();
      setShowEditModal(false);
      setSelectedSchool(null);
      alert('Школа обновлена');
    } catch (error) {
      console.error('Failed to update school:', error);
      alert('Ошибка при обновлении школы');
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;
    
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolToDelete.id);
      
      if (error) throw error;
      
      await loadSchools();
      setShowDeleteConfirm(false);
      setSchoolToDelete(null);
      alert('Школа удалена');
    } catch (error) {
      console.error('Failed to delete school:', error);
      alert('Ошибка при удалении школы');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Удалить участника из школы?')) return;
    
    try {
      const { error } = await supabase
        .from('school_memberships')
        .delete()
        .eq('id', membershipId);
      
      if (error) throw error;
      
      if (selectedSchool) {
        await loadSchoolMembers(selectedSchool.id);
      }
      alert('Участник удалён');
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Ошибка при удалении участника');
    }
  };

  const handleViewMembers = async (school: School) => {
    setSelectedSchool(school);
    await loadSchoolMembers(school.id);
    setShowMembersModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Управление школами</h2>
          <p className="text-slate-500">Всего школ: {schools.length}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Создать школу
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск школ..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Schools List */}
      {loading ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <School className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-slate-500">Загрузка школ...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{school.name}</h3>
                    {school.address && (
                      <p className="text-sm text-slate-500">{school.address}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewMembers(school)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Участники
                </button>
                <button
                  onClick={() => {
                    setSelectedSchool(school);
                    setShowEditModal(true);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => {
                    setSchoolToDelete(school);
                    setShowDeleteConfirm(true);
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create School Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">Создание школы</h2>
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Название школы</label>
                  <input
                    type="text"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Адрес</label>
                  <input
                    type="text"
                    value={newSchool.address}
                    onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit School Modal */}
      <AnimatePresence>
        {showEditModal && selectedSchool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6">Редактирование школы</h2>
              <form onSubmit={handleUpdateSchool} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Название школы</label>
                  <input
                    type="text"
                    value={selectedSchool.name}
                    onChange={(e) => setSelectedSchool({ ...selectedSchool, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Адрес</label>
                  <input
                    type="text"
                    value={selectedSchool.address || ''}
                    onChange={(e) => setSelectedSchool({ ...selectedSchool, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && schoolToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-red-600">Подтверждение удаления</h2>
              <p className="text-slate-600 mb-6">
                Вы уверены, что хотите удалить школу <span className="font-semibold">{schoolToDelete.name}</span>? 
                Это действие нельзя отменить.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteSchool}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Удалить
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSchoolToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {showMembersModal && selectedSchool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMembersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Участники школы: {selectedSchool.name}</h2>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {schoolMembers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Нет участников</p>
              ) : (
                <div className="space-y-3">
                  {schoolMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800">{member.user_profile.full_name}</p>
                        <p className="text-sm text-slate-500">{member.user_profile.email}</p>
                        <span className={cn(
                          "inline-block mt-1 px-2 py-1 rounded-full text-xs font-bold",
                          member.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {member.role === 'teacher' ? '👨‍🏫 Учитель' : '🎓 Ученик'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Удалить из школы"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
