import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, UserPlus, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  school_id: string | null;
}

interface ChallengeInvitationProps {
  challengeId: string;
  onClose: () => void;
  onInvite: (userIds: string[]) => void;
  currentUserId: string;
}

/**
 * ChallengeInvitation Component
 * 
 * Modal for inviting users to a challenge
 * 
 * Requirements:
 * - 5.3: Invite users to challenge
 */
export function ChallengeInvitation({
  challengeId,
  onClose,
  onInvite,
  currentUserId,
}: ChallengeInvitationProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [existingParticipants, setExistingParticipants] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
    loadExistingParticipants();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Get current user's school
      const { data: currentUser } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', currentUserId)
        .single();

      // Get users from the same school (excluding current user)
      const query = supabase
        .from('user_profiles')
        .select('id, full_name, email, school_id')
        .neq('id', currentUserId)
        .eq('role', 'student');

      if (currentUser?.school_id) {
        query.eq('school_id', currentUser.school_id);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', challengeId);

      if (error) throw error;

      setExistingParticipants(new Set((data || []).map(p => p.user_id)));
    } catch (error) {
      console.error('Failed to load existing participants:', error);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleInvite = () => {
    if (selectedUsers.size === 0) return;
    onInvite(Array.from(selectedUsers));
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (existingParticipants.has(user.id)) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="liquid-glass rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Invite to Challenge</h2>
                  <p className="text-sm text-white/80">
                    {selectedUsers.size} {selectedUsers.size === 1 ? 'user' : 'users'} selected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">
                  {searchQuery ? 'No users found' : 'No users available to invite'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.has(user.id);

                  return (
                    <motion.button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 transition-all text-left',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0',
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                            : 'bg-gradient-to-br from-slate-400 to-slate-500'
                        )}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 truncate">
                            {user.full_name}
                          </h4>
                          <p className="text-sm text-slate-600 truncate">{user.email}</p>
                        </div>

                        {/* Selection indicator */}
                        <div className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-slate-300 bg-white'
                        )}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={selectedUsers.size === 0}
                className={cn(
                  'flex-1 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2',
                  selectedUsers.size > 0
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-xl'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <UserPlus className="w-5 h-5" />
                Invite {selectedUsers.size > 0 && `(${selectedUsers.size})`}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
