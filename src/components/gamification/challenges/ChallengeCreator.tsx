import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Crown, Calendar, Users, Coins, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Challenge } from '@/store';

interface ChallengeCreatorProps {
  onClose: () => void;
  onCreate: (challenge: Omit<Challenge, 'id' | 'created_at' | 'status' | 'winner_id'>) => void;
  creatorId: string;
}

/**
 * ChallengeCreator Component
 * 
 * Modal for creating new challenges with form validation
 * 
 * Requirements:
 * - 5.1: Create challenge with specified parameters
 * - 5.2: Support different challenge types
 */
export function ChallengeCreator({ onClose, onCreate, creatorId }: ChallengeCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<'most_lessons' | 'most_quizzes' | 'highest_score'>('most_lessons');
  const [targetValue, setTargetValue] = useState(10);
  const [duration, setDuration] = useState<'1day' | '3days' | '1week' | '2weeks'>('1week');
  const [rewardCoins, setRewardCoins] = useState(100);
  const [rewardXp, setRewardXp] = useState(50);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Challenge type options
  const challengeTypes = [
    {
      value: 'most_lessons',
      label: 'Most Lessons',
      description: 'Who can create the most lessons',
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      value: 'most_quizzes',
      label: 'Most Quizzes',
      description: 'Who can complete the most quizzes',
      icon: Trophy,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      value: 'highest_score',
      label: 'Highest Score',
      description: 'Who can get the highest leaderboard score',
      icon: Crown,
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  // Duration options
  const durationOptions = [
    { value: '1day', label: '1 Day', days: 1 },
    { value: '3days', label: '3 Days', days: 3 },
    { value: '1week', label: '1 Week', days: 7 },
    { value: '2weeks', label: '2 Weeks', days: 14 },
  ];

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (targetValue < 1) {
      newErrors.targetValue = 'Target must be at least 1';
    } else if (targetValue > 1000) {
      newErrors.targetValue = 'Target cannot exceed 1000';
    }

    if (rewardCoins < 10) {
      newErrors.rewardCoins = 'Reward must be at least 10 coins';
    } else if (rewardCoins > 1000) {
      newErrors.rewardCoins = 'Reward cannot exceed 1000 coins';
    }

    if (rewardXp < 10) {
      newErrors.rewardXp = 'Reward must be at least 10 XP';
    } else if (rewardXp > 1000) {
      newErrors.rewardXp = 'Reward cannot exceed 1000 XP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    const selectedDuration = durationOptions.find(d => d.value === duration);
    endDate.setDate(endDate.getDate() + (selectedDuration?.days || 7));

    const challenge: Omit<Challenge, 'id' | 'created_at' | 'status' | 'winner_id'> = {
      creator_id: creatorId,
      title: title.trim(),
      description: description.trim(),
      challenge_type: challengeType,
      target_value: targetValue,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      reward_coins: rewardCoins,
      reward_xp: rewardXp,
    };

    onCreate(challenge);
  };

  const selectedType = challengeTypes.find(t => t.value === challengeType);
  const SelectedIcon = selectedType?.icon || Target;

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
          className="liquid-glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create Challenge</h2>
                  <p className="text-sm text-white/80">Challenge your friends to compete!</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Challenge Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekend Learning Sprint"
                className={cn(
                  'w-full px-4 py-3 rounded-lg border-2 transition-colors',
                  errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                  'focus:outline-none focus:border-indigo-500'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the challenge and what participants need to do..."
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border-2 transition-colors resize-none',
                  errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                  'focus:outline-none focus:border-indigo-500'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Challenge Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Challenge Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {challengeTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = challengeType === type.value;
                  
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setChallengeType(type.value as any)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2',
                        type.gradient
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">{type.label}</h4>
                      <p className="text-xs text-slate-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Value */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Goal
              </label>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-slate-500" />
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-lg border-2 transition-colors',
                    errors.targetValue ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                    'focus:outline-none focus:border-indigo-500'
                  )}
                />
              </div>
              {errors.targetValue && (
                <p className="mt-1 text-sm text-red-600">{errors.targetValue}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Duration
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {durationOptions.map((option) => {
                  const isSelected = duration === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDuration(option.value as any)}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all font-semibold',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      )}
                    >
                      <Calendar className="w-4 h-4 mx-auto mb-1" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reward Coins
                </label>
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <input
                    type="number"
                    value={rewardCoins}
                    onChange={(e) => setRewardCoins(parseInt(e.target.value) || 0)}
                    min={10}
                    max={1000}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-lg border-2 transition-colors',
                      errors.rewardCoins ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                      'focus:outline-none focus:border-indigo-500'
                    )}
                  />
                </div>
                {errors.rewardCoins && (
                  <p className="mt-1 text-sm text-red-600">{errors.rewardCoins}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reward XP
                </label>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <input
                    type="number"
                    value={rewardXp}
                    onChange={(e) => setRewardXp(parseInt(e.target.value) || 0)}
                    min={10}
                    max={1000}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-lg border-2 transition-colors',
                      errors.rewardXp ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                      'focus:outline-none focus:border-indigo-500'
                    )}
                  />
                </div>
                {errors.rewardXp && (
                  <p className="mt-1 text-sm text-red-600">{errors.rewardXp}</p>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Preview</h4>
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                  selectedType?.gradient
                )}>
                  <SelectedIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-800 mb-1">
                    {title || 'Challenge Title'}
                  </h5>
                  <p className="text-sm text-slate-600 mb-2">
                    {description || 'Challenge description will appear here...'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Goal: {targetValue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {durationOptions.find(d => d.value === duration)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Create Challenge
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
