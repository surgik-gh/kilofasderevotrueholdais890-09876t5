import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, Sparkles } from 'lucide-react';
import type { SeasonalEvent } from '../../../store';

interface SeasonalEventBannerProps {
  event: SeasonalEvent;
  userPoints?: number;
  userRank?: number | null;
  daysRemaining?: number;
  onViewDetails?: () => void;
}

export function SeasonalEventBanner({
  event,
  userPoints = 0,
  userRank = null,
  daysRemaining = 0,
  onViewDetails,
}: SeasonalEventBannerProps) {
  const getThemeGradient = (theme: string) => {
    const themes: Record<string, string> = {
      'winter': 'from-blue-500 via-cyan-500 to-teal-500',
      'spring': 'from-green-500 via-emerald-500 to-lime-500',
      'summer': 'from-yellow-500 via-orange-500 to-red-500',
      'autumn': 'from-orange-500 via-amber-500 to-yellow-500',
      'new-year': 'from-purple-500 via-pink-500 to-red-500',
      'knowledge-day': 'from-indigo-500 via-blue-500 to-cyan-500',
      'teacher-day': 'from-rose-500 via-pink-500 to-purple-500',
      'default': 'from-primary-500 via-purple-500 to-pink-500',
    };
    return themes[theme] || themes['default'];
  };

  const getThemeIcon = (theme: string) => {
    const icons: Record<string, string> = {
      'winter': '❄️',
      'spring': '🌸',
      'summer': '☀️',
      'autumn': '🍂',
      'new-year': '🎉',
      'knowledge-day': '📚',
      'teacher-day': '🍎',
      'default': '✨',
    };
    return icons[theme] || icons['default'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getThemeGradient(event.theme)}`} />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{ x: `${Math.random() * 100}%`, y: '100%', opacity: 0 }}
            animate={{
              y: '-10%',
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Event Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{getThemeIcon(event.theme)}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
                    Сезонное событие
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black">
                  {event.name}
                </h2>
              </div>
            </div>
            
            <p className="text-white/90 text-sm md:text-base mb-4 max-w-2xl">
              {event.description}
            </p>

            {/* Event Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {daysRemaining > 0 ? `${daysRemaining} дней осталось` : 'Завершено'}
                </span>
              </div>
              
              {userPoints > 0 && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {userPoints} очков
                  </span>
                </div>
              )}
              
              {userRank && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold">
                    Место #{userRank}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {onViewDetails && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewDetails}
              className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Подробнее
            </motion.button>
          )}
        </div>

        {/* Event Dates */}
        <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-2 text-sm text-white/80">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(event.start_date).toLocaleDateString('ru-RU')} - {new Date(event.end_date).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
