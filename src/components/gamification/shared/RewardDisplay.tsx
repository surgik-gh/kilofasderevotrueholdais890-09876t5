import { motion } from 'framer-motion';
import { Coins, Sparkles, Trophy, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AnimatedCounter } from './AnimatedCounter';

interface Reward {
  coins?: number;
  xp?: number;
  badge?: string;
  special?: string;
}

interface RewardDisplayProps {
  reward: Reward;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  animated?: boolean;
}

/**
 * RewardDisplay Component
 * 
 * Displays rewards (coins, XP, badges) with animations
 * 
 * Requirements:
 * - 10.1-10.7: Display rewards for achievements, quests, milestones, etc.
 */
export function RewardDisplay({
  reward,
  className = '',
  size = 'md',
  layout = 'horizontal',
  animated = true,
}: RewardDisplayProps) {
  const sizeConfig = {
    sm: {
      icon: 'w-5 h-5',
      iconContainer: 'w-6 h-6',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      gap: 'gap-2',
    },
    md: {
      icon: 'w-6 h-6',
      iconContainer: 'w-8 h-8',
      text: 'text-base',
      padding: 'px-4 py-2',
      gap: 'gap-3',
    },
    lg: {
      icon: 'w-8 h-8',
      iconContainer: 'w-10 h-10',
      text: 'text-lg',
      padding: 'px-5 py-3',
      gap: 'gap-4',
    },
  };

  const config = sizeConfig[size];
  const containerClass = layout === 'horizontal' ? 'flex-row' : 'flex-col';

  return (
    <div className={cn('flex items-center justify-center', config.gap, containerClass, className)}>
      {/* Coins */}
      {reward.coins !== undefined && reward.coins > 0 && (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.8, y: 20 } : {}}
          animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            'flex items-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm',
            config.gap,
            config.padding
          )}
        >
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md',
              config.iconContainer
            )}
          >
            <Coins className={cn(config.icon, 'text-white')} />
          </div>
          <span className={cn(config.text, 'font-bold text-amber-700')}>
            {animated ? (
              <AnimatedCounter value={reward.coins} prefix="+" />
            ) : (
              `+${reward.coins}`
            )}
          </span>
        </motion.div>
      )}

      {/* XP */}
      {reward.xp !== undefined && reward.xp > 0 && (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.8, y: 20 } : {}}
          animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            'flex items-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm',
            config.gap,
            config.padding
          )}
        >
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md',
              config.iconContainer
            )}
          >
            <Sparkles className={cn(config.icon, 'text-white')} />
          </div>
          <span className={cn(config.text, 'font-bold text-blue-700')}>
            {animated ? (
              <AnimatedCounter value={reward.xp} prefix="+" suffix=" XP" />
            ) : (
              `+${reward.xp} XP`
            )}
          </span>
        </motion.div>
      )}

      {/* Badge */}
      {reward.badge && (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.8, y: 20 } : {}}
          animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            'flex items-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm',
            config.gap,
            config.padding
          )}
        >
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md',
              config.iconContainer
            )}
          >
            <Trophy className={cn(config.icon, 'text-white')} />
          </div>
          <span className={cn(config.text, 'font-bold text-purple-700')}>
            {reward.badge}
          </span>
        </motion.div>
      )}

      {/* Special reward */}
      {reward.special && (
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.8, y: 20 } : {}}
          animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            'flex items-center rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm',
            config.gap,
            config.padding
          )}
        >
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md',
              config.iconContainer
            )}
          >
            <Star className={cn(config.icon, 'text-white')} />
          </div>
          <span className={cn(config.text, 'font-bold text-green-700')}>
            {reward.special}
          </span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * CompactRewardDisplay Component
 * 
 * A more compact version for inline display
 */
interface CompactRewardDisplayProps {
  coins?: number;
  xp?: number;
  className?: string;
}

export function CompactRewardDisplay({
  coins,
  xp,
  className = '',
}: CompactRewardDisplayProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      {coins !== undefined && coins > 0 && (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
          <Coins className="w-4 h-4" />
          +{coins}
        </span>
      )}
      {xp !== undefined && xp > 0 && (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
          <Sparkles className="w-4 h-4" />
          +{xp}
        </span>
      )}
    </div>
  );
}

/**
 * FloatingReward Component
 * 
 * Animated floating reward that appears and floats up
 */
interface FloatingRewardProps {
  type: 'coins' | 'xp';
  amount: number;
  x: number;
  y: number;
  onComplete?: () => void;
}

export function FloatingReward({
  type,
  amount,
  x,
  y,
  onComplete,
}: FloatingRewardProps) {
  const config = {
    coins: {
      icon: Coins,
      color: 'text-amber-500',
      prefix: '+',
      suffix: '',
    },
    xp: {
      icon: Sparkles,
      color: 'text-blue-500',
      prefix: '+',
      suffix: ' XP',
    },
  };

  const { icon: Icon, color, prefix, suffix } = config[type];

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, x, y }}
      animate={{
        opacity: 0,
        scale: 1.5,
        y: y - 100,
      }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white shadow-lg">
        <Icon className={cn('w-4 h-4', color)} />
        <span className={cn('text-sm font-bold', color)}>
          {prefix}
          {amount}
          {suffix}
        </span>
      </div>
    </motion.div>
  );
}
