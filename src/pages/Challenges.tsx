import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Filter, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { cn } from '@/utils/cn';
import { useChallenges } from '@/hooks/useChallenges';
import { useStore } from '@/store';
import {
  ChallengeCard,
  ChallengeCreator,
  ChallengeLeaderboard,
  ChallengeInvitation,
} from '@/components/gamification/challenges';
import {
  GamificationErrorDisplay,
  ChallengeCardSkeleton,
  SkeletonList,
} from '@/components/gamification/shared';
import type { Challenge } from '@/store';

type ChallengeFilter = 'all' | 'active' | 'pending' | 'completed';

/**
 * Challenges Page
 * 
 * Main page for viewing and managing challenges
 * 
 * Requirements:
 * - 5.1-5.8: Display and manage challenges
 */
export default function Challenges() {
  const { profile } = useStore();
  const {
    challenges,
    isLoading,
    error,
    loadUserChallenges,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    inviteToChallenge,
    getChallengeLeaderboard,
  } = useChallenges();

  const [filter, setFilter] = useState<ChallengeFilter>('all');
  const [showCreator, setShowCreator] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showInvitation, setShowInvitation] = useState(false);
  const [invitationChallengeId, setInvitationChallengeId] = useState<string | null>(null);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile?.id) {
      loadUserChallenges();
    }
  }, [profile?.id]);

  useEffect(() => {
    // Load participant counts and user progress for all challenges
    challenges.forEach(async (challenge) => {
      const participants = await getChallengeLeaderboard(challenge.id);
      setParticipantCounts(prev => ({ ...prev, [challenge.id]: participants.length }));
      
      const userParticipant = participants.find(p => p.user_id === profile?.id);
      if (userParticipant) {
        setUserProgress(prev => ({ ...prev, [challenge.id]: userParticipant.progress }));
      }
    });
  }, [challenges, profile?.id]);

  // Filter challenges
  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'all') return true;
    return challenge.status === filter;
  });

  // Separate challenges by type
  const pendingInvitations = filteredChallenges.filter(
    c => c.status === 'pending' && c.creator_id !== profile?.id
  );
  const activeChallenges = filteredChallenges.filter(c => c.status === 'active');
  const completedChallenges = filteredChallenges.filter(c => c.status === 'completed');

  // Handle create challenge
  const handleCreateChallenge = async (challenge: Omit<Challenge, 'id' | 'created_at' | 'status' | 'winner_id'>) => {
    const newChallenge = await createChallenge({
      ...challenge,
      status: 'pending',
      winner_id: null,
    } as any);
    if (newChallenge) {
      setShowCreator(false);
      // Show invitation modal for the new challenge
      setInvitationChallengeId(newChallenge.id);
      setShowInvitation(true);
    }
  };

  // Handle invite
  const handleInvite = async (userIds: string[]) => {
    if (invitationChallengeId) {
      await inviteToChallenge(invitationChallengeId, userIds);
      setShowInvitation(false);
      setInvitationChallengeId(null);
    }
  };

  // Handle view details
  const handleViewDetails = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
    }
  };

  // Filter buttons
  const filters: { value: ChallengeFilter; label: string; icon: any }[] = [
    { value: 'all', label: 'Все', icon: Trophy },
    { value: 'active', label: 'Активные', icon: Clock },
    { value: 'pending', label: 'Ожидают', icon: Filter },
    { value: 'completed', label: 'Завершенные', icon: CheckCircle2 },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error with retry option
  if (error && challenges.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <GamificationErrorDisplay
            error={error}
            context="challenges"
            onRetry={loadUserChallenges}
          />
        </div>
      </div>
    );
  }

  // Show skeleton loading state
  if (isLoading && challenges.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Challenges</h1>
                <p className="text-slate-600">Загрузка челленджей...</p>
              </div>
            </div>
          </div>
          <SkeletonList count={3} component={ChallengeCardSkeleton} />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Челленджи</h1>
                <p className="text-slate-600">Соревнуйтесь с друзьями и получайте награды</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreator(true)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Создать челлендж
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 overflow-x-auto pb-2"
        >
          {filters.map((filterOption) => {
            const Icon = filterOption.icon;
            const isActive = filter === filterOption.value;
            const count = challenges.filter(c => 
              filterOption.value === 'all' ? true : c.status === filterOption.value
            ).length;

            return (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {filterOption.label}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold',
                  isActive ? 'bg-white/20' : 'bg-slate-200'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-xl p-4 bg-red-50 border-2 border-red-200"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading challenges...</p>
          </div>
        )}

        {/* Pending invitations */}
        {!isLoading && pendingInvitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Приглашения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvitations.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userProgress={userProgress[challenge.id] || 0}
                  participantCount={participantCounts[challenge.id] || 0}
                  onViewDetails={handleViewDetails}
                  onAccept={acceptChallenge}
                  onDecline={declineChallenge}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Active challenges */}
        {!isLoading && activeChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Активные челленджи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userProgress={userProgress[challenge.id] || 0}
                  participantCount={participantCounts[challenge.id] || 0}
                  isCreator={challenge.creator_id === profile.id}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed challenges */}
        {!isLoading && completedChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Завершенные челленджи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userProgress={userProgress[challenge.id] || 0}
                  participantCount={participantCounts[challenge.id] || 0}
                  isCreator={challenge.creator_id === profile.id}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && filteredChallenges.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-2xl p-12 text-center"
          >
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Пока нет челленджей</h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all'
                ? 'Создайте свой первый челлендж и пригласите друзей!'
                : `Нет ${filter === 'active' ? 'активных' : filter === 'pending' ? 'ожидающих' : 'завершенных'} челленджей.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreator(true)}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Создать челлендж
              </button>
            )}
          </motion.div>
        )}

        {/* Challenge details modal */}
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Challenge info */}
                <ChallengeCard
                  challenge={selectedChallenge}
                  userProgress={userProgress[selectedChallenge.id] || 0}
                  participantCount={participantCounts[selectedChallenge.id] || 0}
                  isCreator={selectedChallenge.creator_id === profile.id}
                />

                {/* Leaderboard */}
                <ChallengeLeaderboard
                  challengeId={selectedChallenge.id}
                  targetValue={selectedChallenge.target_value}
                  currentUserId={profile.id}
                />

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {selectedChallenge.creator_id === profile.id && selectedChallenge.status === 'pending' && (
                    <button
                      onClick={() => {
                        setInvitationChallengeId(selectedChallenge.id);
                        setShowInvitation(true);
                      }}
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Пригласить участников
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="flex-1 px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Challenge creator modal */}
      {showCreator && profile && (
        <ChallengeCreator
          onClose={() => setShowCreator(false)}
          onCreate={handleCreateChallenge}
          creatorId={profile.id}
        />
      )}

      {/* Invitation modal */}
      {showInvitation && invitationChallengeId && profile && (
        <ChallengeInvitation
          challengeId={invitationChallengeId}
          onClose={() => {
            setShowInvitation(false);
            setInvitationChallengeId(null);
          }}
          onInvite={handleInvite}
          currentUserId={profile.id}
        />
      )}
    </Layout>
  );
}
