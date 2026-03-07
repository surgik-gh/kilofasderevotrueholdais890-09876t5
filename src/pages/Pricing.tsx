import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useStore } from '@/store';
import { Check, Crown, Zap, Star, Rocket, Sparkles, GraduationCap, Users, Lightbulb, BookOpen, Target, Bot, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { generatePaymentUrl, STUDENT_PLANS, TEACHER_PLANS } from '@/services/robokassa';
import { subscriptionService } from '@/services/subscription.service';
import type { SubscriptionDetails } from '@/services/subscription.service';

export function Pricing() {
  const { currentUser } = useStore();
  const isTeacher = currentUser?.role === 'teacher';
  const isParent = currentUser?.role === 'parent';
  const isAdmin = currentUser?.role === 'admin';
  const isSchool = currentUser?.role === 'school';
  
  // Strictly separate views: students see student plans, teachers see teacher plans
  // Admin and School can toggle
  const canToggle = isAdmin || isSchool;
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>(isTeacher ? 'teacher' : 'student');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionDetails[]>([]);

  // Load subscription tiers from service
  useEffect(() => {
    const role = viewMode === 'student' ? 'student' : 'teacher';
    const tiers = subscriptionService.getSubscriptionTiersByRole(role);
    setSubscriptionTiers(tiers);
  }, [viewMode]);

  // Map subscription tiers to display plans
  const plans = subscriptionTiers.map((tier, index) => {
    const tierName = tier.tier.split('_')[1]; // Extract 'freemium', 'promium', etc.
    const displayName = tierName.charAt(0).toUpperCase() + tierName.slice(1);
    
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
      promium: viewMode === 'student' ? 'from-blue-400 to-cyan-400' : 'from-emerald-400 to-teal-400',
      premium: viewMode === 'student' ? 'from-purple-500 to-pink-500' : 'from-violet-500 to-purple-500',
      legend: 'from-amber-400 to-orange-500',
      maxi: 'from-rose-400 to-red-500'
    };
    
    const features = [
      `${tier.biweekly_tokens} токенов каждые две недели`,
      `${tier.daily_login_tokens} токенов за ежедневный вход`,
      `${tier.free_expert_queries} обращений к эксперт-чату`,
    ];
    
    // Add tier-specific features
    if (tierName === 'promium') {
      features.push(viewMode === 'student' ? 'Приоритетная генерация' : 'Расширенные отчёты');
      features.push(viewMode === 'student' ? 'Расширенная аналитика' : 'Групповые задания');
    } else if (tierName === 'premium') {
      features.push('VIP поддержка');
      features.push(viewMode === 'student' ? 'Эксклюзивный контент' : 'Интеграция с дневником');
      features.push(viewMode === 'teacher' ? 'Шаблоны уроков' : 'Приоритетная поддержка');
    } else if (tierName === 'legend' || tierName === 'maxi') {
      features.push('Персональный ' + (viewMode === 'student' ? 'куратор' : 'менеджер'));
      features.push(viewMode === 'student' ? 'Ранний доступ к новым функциям' : 'API доступ');
      features.push(viewMode === 'student' ? 'Уникальный значок профиля' : 'Белая метка для школы');
      if (viewMode === 'teacher') {
        features.push('Неограниченные ученики');
      }
    } else if (tierName === 'freemium') {
      features.push(viewMode === 'student' ? 'Доступ к урокам' : 'Создание уроков');
      features.push(viewMode === 'student' ? 'Участие в таблице лидеров' : 'Базовая аналитика');
    }
    
    return {
      name: displayName,
      price: tier.price.toString(),
      period: tier.price === 0 ? 'бесплатно' : '/ месяц',
      icon: iconMap[tierName] || Zap,
      gradient: gradientMap[tierName] || 'from-slate-400 to-slate-500',
      bgGradient: 'from-slate-50 to-slate-100',
      popular: tierName === 'premium',
      features,
      buttonText: tier.price === 0 ? 'Текущий план' : `Выбрать ${displayName}`,
      disabled: tier.price === 0,
      tier: tier.tier
    };
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 font-medium text-sm mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Инвестируйте в образование
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-text">Выберите свой путь</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto mb-8"
          >
            Получите больше монет мудрости и доступ к ИИ-эксперту для максимально эффективного обучения
          </motion.p>

          {/* Role Toggle - only visible to admins and school accounts */}
          {canToggle && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex p-1.5 rounded-2xl bg-white/80 shadow-lg backdrop-blur-sm border border-slate-200/50"
            >
              <button
                onClick={() => setViewMode('student')}
                className={cn(
                  "px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
                  viewMode === 'student' 
                    ? "bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-lg shadow-primary-500/30" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <GraduationCap className="w-5 h-5" />
                Для учеников
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={cn(
                  "px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
                  viewMode === 'teacher' 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Users className="w-5 h-5" />
                Для учителей
              </button>
            </motion.div>
          )}
          
          {/* Info for regular users about their subscription */}
          {!canToggle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500 bg-white/60 px-6 py-3 rounded-xl inline-flex items-center gap-2"
            >
              {isTeacher ? (
                <>
                  <Users className="w-5 h-5 text-purple-500" />
                  Планы для учителей
                </>
              ) : (
                <>
                  <GraduationCap className="w-5 h-5 text-primary-500" />
                  {isParent ? 'Планы для ваших детей' : 'Планы для учеников'}
                </>
              )}
            </motion.p>
          )}

          {isParent && (
            <p className="text-sm text-slate-500 mt-4 flex items-center justify-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Как родитель, вы можете приобрести подписку для своего ребёнка
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "relative rounded-3xl p-1 transition-all duration-300 card-hover",
                plan.popular && "scale-105 z-10"
              )}
            >
              {/* Gradient border for popular */}
              {plan.popular && (
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${plan.gradient} opacity-100`} />
              )}
              
              <div className={cn(
                "relative h-full rounded-3xl p-6 flex flex-col",
                plan.popular 
                  ? "bg-white" 
                  : "glass"
              )}>
                {/* Popular Badge */}
                {plan.popular && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r ${plan.gradient} text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1`}>
                    <Star className="w-3 h-3" />
                    ПОПУЛЯРНЫЙ
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>

                {/* Name & Price */}
                <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-lg text-slate-500 ml-1">₽</span>
                  <span className="text-sm text-slate-400 ml-2">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={async () => {
                    if (plan.disabled || !currentUser) return;
                    
                    // Get the plan ID based on tier
                    const planId = viewMode === 'student' 
                      ? STUDENT_PLANS.find(p => p.name.toLowerCase().includes(plan.name.toLowerCase()))?.id
                      : TEACHER_PLANS.find(p => p.name.toLowerCase().includes(plan.name.toLowerCase()))?.id;
                    
                    if (!planId) {
                      alert('План не найден');
                      return;
                    }
                    
                    setLoadingPlan(plan.name);
                    try {
                      const paymentUrl = await generatePaymentUrl(
                        planId,
                        currentUser.id,
                        currentUser.email
                      );
                      
                      // Redirect to Robokassa payment page
                      window.open(paymentUrl, '_blank');
                    } catch (error) {
                      console.error('Payment error:', error);
                      alert('Ошибка при создании платежа. Попробуйте позже.');
                    } finally {
                      setLoadingPlan(null);
                    }
                  }}
                  disabled={plan.disabled || loadingPlan === plan.name}
                  className={cn(
                    "w-full py-4 px-4 rounded-xl font-bold transition-all duration-300 btn-shine flex items-center justify-center gap-2",
                    plan.disabled
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : plan.popular
                        ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`
                        : "bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5"
                  )}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      {!plan.disabled && <ExternalLink className="w-4 h-4" />}
                      {plan.buttonText}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="glass rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Как работают монеты мудрости?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-slate-800">Создание урока</p>
                <p className="text-slate-500">5 монет</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-slate-800">Создание викторины</p>
                <p className="text-slate-500">5 монет</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mx-auto mb-2">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-slate-800">Вопрос эксперту</p>
                <p className="text-slate-500">1 монета</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
