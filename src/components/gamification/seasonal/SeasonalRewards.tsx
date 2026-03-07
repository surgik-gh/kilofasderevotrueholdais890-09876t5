import { motion } from 'framer-motion';
import { Gift, Coins, Zap, Award, CheckCircle, Lock } from 'lucide-react';

interface RewardTier {
  rank: number;
  rankRange?: string;
  coins: number;
  xp: number;
  badges: string[];
  description: string;
}

interface SeasonalRewardsProps {
  userRank: number | null;
  rewardsClaimed: boolean;
  onClaimRewards?: () => void;
  isEventActive: boolean;
  className?: string;
}

export function SeasonalRewards({
  userRank,
  rewardsClaimed,
  onClaimRewards,
  isEventActive,
  className = '',
}: SeasonalRewardsProps) {
  const rewardTiers: RewardTier[] = [
    {
      rank: 1,
      coins: 500,
      xp: 1000,
      badges: ['seasonal_champion'],
      description: '🥇 Чемпион события',
    },
    {
      rank: 2,
      coins: 300,
      xp: 600,
      badges: ['seasonal_runner_up'],
      description: '🥈 Второе место',
    },
    {
      rank: 3,
      coins: 200,
      xp: 400,
      badges: ['seasonal_third_place'],
      description: '🥉 Третье место',
    },
    {
      rank: 4,
      rankRange: '4-10',
      coins: 150,
      xp: 300,
      badges: [],
      description: '🏆 Топ-10',
    },
    {
      rank: 11,
      rankRange: '11-50',
      coins: 100,
      xp: 200,
      badges: [],
      description: '⭐ Топ-50',
    },
    {
      rank: 51,
      rankRange: '51+',
      coins: 50,
      xp: 100,
      badges: [],
      description: '🎯 Участие',
    },
  ];

  const getUserReward = (): RewardTier | null => {
    if (!userRank) return rewardTiers[rewardTiers.length - 1]; // Participation reward
    
    for (const tier of rewardTiers) {
      if (tier.rankRange) {
        const [min, max] = tier.rankRange.split('-').map(r => r === '+' ? Infinity : parseInt(r));
        if (userRank >= min && userRank <= max) {
          return tier;
        }
      } else if (tier.rank === userRank) {
        return tier;
      }
    }
    
    return rewardTiers[rewardTiers.length - 1];
  };

  const userReward = getUserReward();
  const canClaimRewards = !isEventActive && !rewardsClaimed && userReward;

  const getBadgeIcon = (badgeCode: string) => {
    const badges: Record<string, string> = {
      'seasonal_champion': '👑',
      'seasonal_runner_up': '🥈',
      'seasonal_third_place': '🥉',
    };
    return badges[badgeCode] || '🏅';
  };

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary-600" />
        Награды события
      </h3>

      {/* User's Reward */}
      {userReward && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-6 border-2 border-primary-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 font-medium mb-1">Ваша награда</p>
              <p className="text-xl font-black text-slate-900">
                {userReward.description}
              </p>
            </div>
            {rewardsClaimed && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Получено</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-slate-600">Монеты</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                +{userReward.coins}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-600">Опыт</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                +{userReward.xp}
              </p>
            </div>
          </div>

          {userReward.badges.length > 0 && (
            <div className="bg-white rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-slate-600 font-medium">Особые значки</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userReward.badges.map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    <span>{getBadgeIcon(badge)}</span>
                    <span className="capitalize">{badge.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canClaimRewards && onClaimRewards && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClaimRewards}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Получить награды
            </motion.button>
          )}

          {isEventActive && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Награды будут доступны после завершения события
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* All Reward Tiers */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Все уровни наград
        </p>
        
        {rewardTiers.map((tier, index) => {
          const isUserTier = userReward && (
            (tier.rankRange && userReward.rankRange === tier.rankRange) ||
            (tier.rank === userRank)
          );

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                rounded-lg p-4 border-2 transition-all
                ${isUserTier 
                  ? 'bg-gradient-to-r from-primary-50 to-purple-50 border-primary-300' 
                  : 'bg-white border-slate-200'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`font-bold ${isUserTier ? 'text-primary-700' : 'text-slate-700'}`}>
                  {tier.description}
                </p>
                {isUserTier && (
                  <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                    Ваш уровень
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-600" />
                  <span className="font-semibold text-slate-700">
                    {tier.coins}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-600" />
                  <span className="font-semibold text-slate-700">
                    {tier.xp}
                  </span>
                </div>
                {tier.badges.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-indigo-600" />
                    <span className="font-semibold text-slate-700">
                      +{tier.badges.length} значок
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
