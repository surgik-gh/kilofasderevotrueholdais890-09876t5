import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiErrorDisplayProps {
  error: string | Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ApiErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  className = '' 
}: ApiErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-4 rounded-xl bg-red-50 border border-red-200 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              Ошибка
            </h3>
            <p className="text-sm text-red-700">
              {errorMessage}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Повторить"
              >
                <RefreshCw className="w-4 h-4 text-red-600" />
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Закрыть"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
