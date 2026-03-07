import { useEffect } from 'react';
import { useStore } from '../store';
import { tokenEconomyService } from '../services/token-economy.service';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for token economy operations with optimistic updates
 */
export function useTokens() {
  const {
    profile,
    wisdomCoins,
    transactions,
    freeExpertQueries,
    setWisdomCoins,
    updateWisdomCoins,
    setTransactions,
    addTransaction,
    setFreeExpertQueries,
    decrementFreeExpertQueries,
    setLoading,
    setError,
  } = useStore();

  // Load initial token data
  useEffect(() => {
    if (!isSupabaseConfigured() || !profile) return;

    loadTokenData();
  }, [profile?.id]);

  const loadTokenData = async () => {
    if (!profile) return;

    try {
      const balance = await tokenEconomyService.getBalance(profile.id);
      setWisdomCoins(balance);

      // Load recent transactions
      const { data: txData } = await tokenEconomyService.getTransactionHistory(profile.id, 50);
      if (txData) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Failed to load token data:', error);
    }
  };

  const deductTokens = async (amount: number, reason: string) => {
    if (!profile) throw new Error('Not authenticated');

    // Optimistic update
    updateWisdomCoins(-amount);

    try {
      const transaction = await tokenEconomyService.deductTokens(profile.id, amount, reason);
      addTransaction(transaction);
      return transaction;
    } catch (error) {
      // Rollback on error
      updateWisdomCoins(amount);
      throw error;
    }
  };

  const grantTokens = async (amount: number, reason: string) => {
    if (!profile) throw new Error('Not authenticated');

    // Optimistic update
    updateWisdomCoins(amount);

    try {
      const transaction = await tokenEconomyService.grantTokens(profile.id, amount, reason);
      addTransaction(transaction);
      return transaction;
    } catch (error) {
      // Rollback on error
      updateWisdomCoins(-amount);
      throw error;
    }
  };

  const hasEnoughTokens = async (amount: number): Promise<boolean> => {
    if (!profile) return false;
    
    if (!isSupabaseConfigured()) {
      return wisdomCoins >= amount;
    }

    return await tokenEconomyService.hasEnoughTokens(profile.id, amount);
  };

  const useExpertQuery = () => {
    if (freeExpertQueries > 0) {
      decrementFreeExpertQueries();
      return { usedFreeQuery: true, cost: 0 };
    }
    return { usedFreeQuery: false, cost: 0 }; // Cost will be calculated based on tokens
  };

  return {
    wisdomCoins,
    transactions,
    freeExpertQueries,
    deductTokens,
    grantTokens,
    hasEnoughTokens,
    useExpertQuery,
    refreshBalance: loadTokenData,
  };
}
