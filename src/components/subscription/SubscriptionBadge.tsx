/**
 * SubscriptionBadge Component
 * Displays current subscription tier and its benefits
 * 
 * Requirements:
 * - 9.1-9.12: Student subscription tiers and benefits
 * - 10.1-10.12: Teacher subscription tiers and benefits
 */

import { useState } from 'react';
import { Crown, Zap, Star, Rocket, Sparkles, ChevronDown, ChevronUp, Coins, MessageSquare, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { subscriptionService } from '@/services/subscription.service';
import type { SubscriptionTier } from '@/lib/supabase';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  className?: string;
  showBenefits?: boolean;
  compact?: boolean;
}

export function SubscriptionBadge({ 
  tier, 
  className, 
  showBenefits = true,
  compact = false 
}: SubscriptionBadgeProps) {
  const [benefitsExpanded, setBenefitsExpanded] = useState(false);
  const details = subscriptionService.getSubscriptionDetails(tier);

  // Extract tier name and role
  const [role, tierName] = tier.split('_') as [string, string];
  const displayName = tierName.charAt(0).toUpperCase() + tierName.slice(1);
  const isStudent = role === 'student';

  // Icon mapping
  const iconMap: Record<string, any> = {
    freemium: Zap,
    promium: Star,
    premium: Crown,
    legend: Rocket,
    maxi: Sparkles
  };

  // Gradient mapping
  const gradientMap: Record<string, string> = {
    freemium: 'from-slate-400 to-slate-500',
    promium: isStudent ? 'from-blue-400 to-cyan-400' : 'from-emerald-400 to-teal-400',
    premium: isStudent ? 'from-purple-500 to-pink-500' : 'from-violet-500 to-purple-500',
    legend: 'from-amber-400 to-orange-500',
    maxi: 'from-rose-400 to-red-500'
  };

  // Background gradient mapping
  const bgGradientMap: Record<string, string> = {
    freemium: 'from-slate-50 to-slate-100',
    promium: isStudent ? 'from-blue-50 to-cyan-50' : 'from-emerald-50 to-teal-50',
    premium: isStudent ? 'from-purple-50 to-pink-50' : 'from-violet-50 to-purple-50',
    legend: 'from-amber-50 to-orange-50',
    maxi: 'from-rose-50 to-red-50'
  };

  const Icon = iconMap[tierName] || Zap;
  const gradient = gradientMap[tierName] || 'from-slate-400 to-slate-500';
  const bgGradient = bgGradientMap[tierName] || 'from-slate-50 to-slate-100';

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        `bg-gradient-to-r ${gradient}`,
        className
      )}>
        <Icon className="w-4 h-4 text-white" />
        <span className="text-sm font-bold text-white">{displayName}</span>
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className={cn(
        "p-6 bg-gradient-to-br",
        bgGradient
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            gradient
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-600 mb-1">
              {isStudent ? 'Ученик' : 'Учитель'}
            </div>
            <h3 className="text-2xl font-black text-slate-900">{displayName}</h3>
            {details.price > 0 && (
              <div className="text-sm text-slate-600 mt-1">
                {details.price}₽ / месяц
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benefits */}
      {showBenefits && (
        <div className="p-6">
          <button
            onClick={() => setBenefitsExpanded(!benefitsExpanded)}
            className="flex items-center justify-between w-full mb-4 hover:text-primary-600 transition-colors"
          >
            <h4 className="text-sm font-semibold text-slate-700">Преимущества подписки</h4>
            {benefitsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {benefitsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Biweekly Tokens */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {details.biweekly_tokens} монет каждые 2 недели
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Автоматическое пополнение баланса
                    </div>
                  </div>
                </div>

                {/* Daily Login Bonus */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {details.daily_login_tokens} монет за ежедневный вход
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Награда за активность
                    </div>
                  </div>
                </div>

                {/* Free Expert Queries */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {details.free_expert_queries} бесплатных запросов к эксперту
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Консультации с ИИ без затрат монет
                    </div>
                  </div>
                </div>

                {/* Additional Benefits */}
                {tierName !== 'freemium' && (
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Дополнительные возможности:
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {tierName === 'promium' && (
                        <>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            {isStudent ? 'Приоритетная генерация контента' : 'Расширенные отчёты'}
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            {isStudent ? 'Расширенная аналитика' : 'Групповые задания'}
                          </li>
                        </>
                      )}
                      {tierName === 'premium' && (
                        <>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            VIP поддержка
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            {isStudent ? 'Эксклюзивный контент' : 'Интеграция с дневником'}
                          </li>
                          {!isStudent && (
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary-500" />
                              Шаблоны уроков
                            </li>
                          )}
                        </>
                      )}
                      {(tierName === 'legend' || tierName === 'maxi') && (
                        <>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            Персональный {isStudent ? 'куратор' : 'менеджер'}
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            {isStudent ? 'Ранний доступ к новым функциям' : 'API доступ'}
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-500" />
                            {isStudent ? 'Уникальный значок профиля' : 'Белая метка для школы'}
                          </li>
                          {!isStudent && (
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary-500" />
                              Неограниченные ученики
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
