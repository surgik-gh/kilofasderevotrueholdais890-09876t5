import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Plus, X, Check, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';

interface School {
  id: string;
  name: string;
  address?: string;
}

interface SchoolMembership {
  id: string;
  school_id: string;
  school?: School;
  joined_at: string;
}

interface SchoolManagementProps {
  userId: string;
  currentSchoolId?: string;
}

export function SchoolManagement({ userId, currentSchoolId }: SchoolManagementProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [memberships, setMemberships] = useState<SchoolMembership[]>([]);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('name');

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      // Load user's school memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('school_memberships')
        .select(`
          id,
          school_id,
          joined_at,
          school:schools(id, name, address)
        `)
        .eq('user_id', userId)
        .eq('role', 'teacher');

      if (membershipsError) throw membershipsError;
      setMemberships(membershipsData || []);

      // Filter available schools (not yet joined)
      const joinedSchoolIds = (membershipsData || []).map(m => m.school_id);
      const available = (schoolsData || []).filter(s => !joinedSchoolIds.includes(s.id));
      setAvailableSchools(available);

    } catch (err: any) {
      console.error('Failed to load schools:', err);
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchool = async () => {
    if (!selectedSchool) return;

    try {
      setAdding(true);
      setError('');

      // Add school membership
      const { error: insertError } = await supabase
        .from('school_memberships')
        .insert({
          user_id: userId,
          school_id: selectedSchool,
          role: 'teacher'
        });

      if (insertError) throw insertError;

      // If this is the first school, update user profile
      if (memberships.length === 0) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ school_id: selectedSchool })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      // Reload data
      await loadData();
      setSelectedSchool('');
      setAdding(false);

    } catch (err: any) {
      console.error('Failed to add school:', err);
      setError(err.message || 'Не удалось добавить школу');
      setAdding(false);
    }
  };

  const handleRemoveSchool = async (membershipId: string, schoolId: string) => {
    if (!confirm('Вы уверены, что хотите покинуть эту школу?')) return;

    try {
      setError('');

      // Remove membership
      const { error: deleteError } = await supabase
        .from('school_memberships')
        .delete()
        .eq('id', membershipId);

      if (deleteError) throw deleteError;

      // If this was the primary school, update to another or null
      if (currentSchoolId === schoolId) {
        const remainingMemberships = memberships.filter(m => m.id !== membershipId);
        const newPrimarySchool = remainingMemberships.length > 0 
          ? remainingMemberships[0].school_id 
          : null;

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ school_id: newPrimarySchool })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      // Reload data
      await loadData();

    } catch (err: any) {
      console.error('Failed to remove school:', err);
      setError(err.message || 'Не удалось удалить школу');
    }
  };

  const handleSetPrimarySchool = async (schoolId: string) => {
    try {
      setError('');

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ school_id: schoolId })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Reload to reflect changes
      await loadData();

    } catch (err: any) {
      console.error('Failed to set primary school:', err);
      setError(err.message || 'Не удалось установить основную школу');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Schools */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Мои школы ({memberships.length})
        </h3>

        {memberships.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <School className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-amber-800 font-medium mb-1">
              Вы не привязаны ни к одной школе
            </p>
            <p className="text-xs text-amber-600">
              Добавьте школу ниже, чтобы получить доступ к функциям учителя
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership) => {
              const school = membership.school;
              if (!school) return null;

              const isPrimary = currentSchoolId === school.id;

              return (
                <motion.div
                  key={membership.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    isPrimary
                      ? "bg-primary-50 border-primary-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{school.name}</h4>
                        {isPrimary && (
                          <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full">
                            Основная
                          </span>
                        )}
                      </div>
                      {school.address && (
                        <p className="text-sm text-gray-500">{school.address}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Присоединились: {new Date(membership.joined_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPrimary && (
                        <button
                          onClick={() => handleSetPrimarySchool(school.id)}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Сделать основной"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveSchool(membership.id, school.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Покинуть школу"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add School */}
      {availableSchools.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Добавить школу
          </h3>

          <div className="flex gap-3">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              disabled={adding}
            >
              <option value="">Выберите школу...</option>
              {availableSchools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleAddSchool}
              disabled={!selectedSchool || adding}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Добавление...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Добавить
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Вы можете быть привязаны к нескольким школам одновременно
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          Как это работает?
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Вы можете быть привязаны к нескольким школам</li>
          <li>• Одна школа будет основной (используется по умолчанию)</li>
          <li>• Вы можете переключать основную школу в любое время</li>
          <li>• Для доступа к функциям учителя нужна хотя бы одна школа</li>
        </ul>
      </div>
    </div>
  );
}
