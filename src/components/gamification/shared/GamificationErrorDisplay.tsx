import { AlertCircle, RefreshCw, X, TrendingUp, Award, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GamificationErrorDisplayProps {
  error: string | Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  context?: 'achievements' | 'quests' | 'experience' | 'challenges' | 'milestones' | 'streaks' | 'events';
  className?: string;
}

const contextIcons = {
  achievements: Award,
  quests: Target,
  experience: TrendingUp,
  challenges: Target,
  milestones: Award,
  streaks: TrendingUp,
  events: Award,
};

const contextMessages = {
  achievements: 'Не удалось загрузить достижения',
  quests: 'Не удалось загрузить квесты',
  experience: 'Не удалось загрузить опыт',
  challenges: 'Не удалось загрузить челленджи',
  milestones: 'Не удалось загрузить вехи',
  streaks: 'Не удалось загрузить серии',
  events: 'Не удалось загрузить события',
};

export function GamificationErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  context,
  className = '' 
}: GamificationErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const Icon = context ? contextIcons[context] : AlertCircle;
  const contextMessage = context ? contextMessages[context] : 'Произошла ошибка';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`p-4 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-red-800 mb-1">
              {contextMessage}
            </h3>
            <p className="text-sm text-red-700">
              {errorMessage}
            </p>
            {onRetry && (
              <p className="text-xs text-red-600 mt-2">
                Попробуйте обновить страницу или повторить попытку
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="p-2.5 bg-white hover:bg-red-50 rounded-xl transition-colors shadow-sm border border-red-200"
                title="Повторить"
              >
                <RefreshCw className="w-4 h-4 text-red-600" />
              </motion.button>
            )}
            
            {onDismiss && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="p-2.5 bg-white hover:bg-red-50 rounded-xl transition-colors shadow-sm border border-red-200"
                title="Закрыть"
              >
                <X className="w-4 h-4 text-red-600" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Inline error display for smaller contexts
export function InlineGamificationError({ 
  error, 
  onRetry 
}: { 
  error: string | Error | null; 
  onRetry?: () => void;
}) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm"
    >
      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
      <span className="text-red-700 flex-1">{errorMessage}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Повторить
        </button>
      )}
    </motion.div>
  );
}

// Empty state with error context
export function GamificationEmptyState({
  title,
  message,
  icon: Icon = AlertCircle,
  action,
  actionLabel,
}: {
  title: string;
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-600 mb-6 max-w-md">
        {message}
      </p>

      {action && actionLabel && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
