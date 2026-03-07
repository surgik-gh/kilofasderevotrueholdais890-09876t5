/**
 * Custom Toast Notification System
 * Replaces browser alerts with styled in-app notifications
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { createRoot } from 'react-dom/client';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-500',
    bg: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-600',
  },
  error: {
    icon: XCircle,
    gradient: 'from-red-500 to-rose-500',
    bg: 'from-red-50 to-rose-50',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-50 to-orange-50',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: Info,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600',
  },
};

function ToastComponent({ message, type, duration = 5000, onClose }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed top-4 right-4 z-[9999] w-96 max-w-[calc(100vw-2rem)]"
    >
      <div className="relative liquid-glass rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        <div className={`p-5 bg-gradient-to-br ${config.bg}`}>
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg shrink-0`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm text-slate-800 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        <div className="h-1 bg-slate-200">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`h-full bg-gradient-to-r ${config.gradient}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Toast container management
let toastContainer: HTMLDivElement | null = null;
let toastRoot: ReturnType<typeof createRoot> | null = null;
const activeToasts = new Map<string, () => void>();

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
    toastRoot = createRoot(toastContainer);
  }
  return { container: toastContainer, root: toastRoot! };
}

function renderToasts() {
  const { root } = getToastContainer();
  const toasts = Array.from(activeToasts.entries());

  root.render(
    <AnimatePresence>
      {toasts.map(([id, onClose], index) => {
        const toastData = (window as any).__toastData?.[id];
        if (!toastData) return null;

        return (
          <div key={id} style={{ position: 'fixed', top: `${16 + index * 100}px`, right: '16px' }}>
            <ToastComponent
              message={toastData.message}
              type={toastData.type}
              duration={toastData.duration}
              onClose={onClose}
            />
          </div>
        );
      })}
    </AnimatePresence>
  );
}

function showToast(message: string, type: ToastType, duration = 5000) {
  const id = `toast-${Date.now()}-${Math.random()}`;

  // Store toast data globally
  if (!(window as any).__toastData) {
    (window as any).__toastData = {};
  }
  (window as any).__toastData[id] = { message, type, duration };

  const onClose = () => {
    activeToasts.delete(id);
    delete (window as any).__toastData[id];
    renderToasts();
  };

  activeToasts.set(id, onClose);
  renderToasts();

  // Auto-close after duration
  setTimeout(onClose, duration);
}

// Public API
export const toast = {
  success: (message: string, duration?: number) => showToast(message, 'success', duration),
  error: (message: string, duration?: number) => showToast(message, 'error', duration),
  warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  info: (message: string, duration?: number) => showToast(message, 'info', duration),
};
