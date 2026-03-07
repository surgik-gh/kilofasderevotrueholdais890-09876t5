import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Coins, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface UserSubscription {
  id: string;
  full_name: string;
  email: string;
  subscription_tier: string;
  wisdom_coins: number;
  created_at: string;
}

export const AdminSubscriptionManagement: React.FC = () => {
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    totalCoins: 0,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, subscription_tier, wisdom_coins, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);

      // Calculate stats
      const totalUsers = data?.length || 0;
      const freeUsers = data?.filter(u => u.subscription_tier === 'free').length || 0;
      const premiumUsers = data?.filter(u => u.subscription_tier === 'premium').length || 0;
      const totalCoins = data?.reduce((sum, u) => sum + (u.wisdom_coins || 0), 0) || 0;

      setStats({ totalUsers, freeUsers, premiumUsers, totalCoins });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTier = async (userId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_tier: newTier })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      alert('Тариф изменён');
    } catch (error) {
      console.error('Failed to change tier:', error);
      alert('Ошибка при изменении тарифа');
    }
  };

  const handleAddCoins = async (userId: string, amount: number) => {
    if (amount <= 0) return;

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({ wisdom_coins: user.wisdom_coins + amount })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      alert(`Начислено ${amount} монет`);
    } catch (error) {
      console.error('Failed to add coins:', error);
      alert('Ошибка при начислении монет');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Управление подписками</h2>
        <p className="text-slate-500">Тарифы и монеты пользователей</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Всего пользователей</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Free</p>
              <p className="text-2xl font-bold text-slate-800">{stats.freeUsers}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Premium</p>
              <p className="text-2xl font-bold text-slate-800">{stats.premiumUsers}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Всего монет</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCoins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CreditCard className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-slate-500">Загрузка...</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Пользователь</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Тариф</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Монеты</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800">{user.full_name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.subscription_tier}
                        onChange={(e) => handleChangeTier(user.id, e.target.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border-2 outline-none transition-all",
                          user.subscription_tier === 'premium'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        )}
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-amber-600">{user.wisdom_coins} 🪙</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          const amount = prompt('Сколько монет начислить?');
                          if (amount) handleAddCoins(user.id, parseInt(amount));
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                      >
                        Начислить монеты
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
