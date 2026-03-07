/**
 * TokenBalance Component
 * Displays current Wisdom Coins balance, transaction history, and free expert queries
 * 
 * Requirements:
 * - 13.5: Display current balance and transaction history
 * - 11.2, 11.3: Display free expert queries remaining
 */

import { useState } from 'react';
import { Coins, TrendingUp, TrendingDown, Clock, MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTokens } from '@/hooks';
import { useStore } from '@/store';
import type { Transaction } from '@/store';

interface TokenBalanceProps {
  userId?: string; // Optional - will use current user from store if not provided
  className?: string;
  showHistory?: boolean;
  compact?: boolean;
}

export function TokenBalance({ 
  userId, 
  className, 
  showHistory = true,
  compact = false 
}: TokenBalanceProps) {
  const { wisdomCoins, transactions, freeExpertQueries } = useTokens();
  const { isLoading, error: storeError } = useStore();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const balance = wisdomCoins;
  const freeQueries = freeExpertQueries;
  const loading = isLoading;
  const error = storeError;

  const getTransactionIcon = (type: Transaction['transaction_type']) => {
    const iconMap: Record<Transaction['transaction_type'], any> = {
      initial_grant: TrendingUp,
      daily_login: TrendingUp,
      biweekly_grant: TrendingUp,
      leaderboard_reward: TrendingUp,
      lesson_creation: TrendingDown,
      quiz_creation: TrendingDown,
      expert_chat_usage: TrendingDown,
      subscription_purchase: TrendingDown,
    };
    return iconMap[type] || Clock;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className={cn("glass rounded-2xl p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("glass rounded-2xl p-6", className)}>
        <div className="text-center text-red-600 py-4">
          {error}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-3 glass rounded-xl px-4 py-2", className)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Монеты мудрости</div>
            <div className="text-lg font-bold text-slate-900">{balance}</div>
          </div>
        </div>
        
        {freeQueries > 0 && (
          <>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              <div>
                <div className="text-xs text-slate-500">Бесплатные запросы</div>
                <div className="text-lg font-bold text-primary-600">{freeQueries}</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      {/* Balance Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">Баланс</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-black text-slate-900">{balance}</div>
            </div>
            <span className="text-slate-500">монет</span>
          </div>
        </div>

        {freeQueries > 0 && (
          <div className="text-right">
            <div className="text-sm font-medium text-slate-500 mb-1">Бесплатные запросы</div>
            <div className="flex items-center gap-2 justify-end">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <div className="text-2xl font-bold text-primary-600">{freeQueries}</div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {showHistory && transactions.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex items-center justify-between w-full mb-3 hover:text-primary-600 transition-colors"
          >
            <h4 className="text-sm font-semibold text-slate-700">История транзакций</h4>
            {historyExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {historyExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                {transactions.slice(0, 10).map((transaction) => {
                  const Icon = getTransactionIcon(transaction.transaction_type);
                  const isPositive = transaction.amount > 0;

                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isPositive 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {transaction.description}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "text-sm font-bold shrink-0 ml-3",
                        getTransactionColor(transaction.amount)
                      )}>
                        {isPositive ? '+' : ''}{transaction.amount}
                      </div>
                    </motion.div>
                  );
                })}

                {transactions.length > 10 && (
                  <div className="text-center pt-2">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Показать все ({transactions.length})
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showHistory && transactions.length === 0 && (
        <div className="border-t border-slate-200 pt-4">
          <div className="text-center text-slate-400 py-4 text-sm">
            История транзакций пуста
          </div>
        </div>
      )}
    </div>
  );
}
