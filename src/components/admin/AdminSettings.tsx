import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Brain, Coins, Shield, Bell, Save } from 'lucide-react';
import { cn } from '@/utils/cn';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // AI Configuration
    aiModel: 'gpt-oss-120b',
    aiTemperature: 0.7,
    aiMaxTokens: 2000,
    
    // Limits
    maxQuizzesPerDay: 10,
    maxRoadmapsPerWeek: 3,
    maxChatMessagesPerDay: 100,
    
    // Coins
    quizGenerationCost: 2,
    roadmapGenerationCost: 4,
    initialStudentCoins: 50,
    initialTeacherCoins: 150,
    initialParentCoins: 30,
    
    // Subscription Tiers
    freeTierMonthlyCoins: 10,
    premiumTierMonthlyCoins: 100,
    premiumTierPrice: 499,
    
    // Notifications
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notifyOnConnectionRequest: true,
    notifyOnQuizComplete: true,
    notifyOnNewQuest: true,
    
    // Security
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    enableTwoFactor: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would save to database or config file
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    alert('Настройки сохранены');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Настройки системы</h2>
          <p className="text-slate-500">Конфигурация платформы</p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:shadow-lg'
          )}
        >
          <Save className="w-5 h-5" />
          {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>

      {/* AI Configuration */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-bold text-slate-800">Конфигурация AI</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Модель</label>
            <input
              type="text"
              value={settings.aiModel}
              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Temperature</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={settings.aiTemperature}
              onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Max Tokens</label>
            <input
              type="number"
              value={settings.aiMaxTokens}
              onChange={(e) => setSettings({ ...settings, aiMaxTokens: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-bold text-slate-800">Лимиты</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Квизов в день</label>
            <input
              type="number"
              value={settings.maxQuizzesPerDay}
              onChange={(e) => setSettings({ ...settings, maxQuizzesPerDay: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Roadmaps в неделю</label>
            <input
              type="number"
              value={settings.maxRoadmapsPerWeek}
              onChange={(e) => setSettings({ ...settings, maxRoadmapsPerWeek: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Сообщений в чате в день</label>
            <input
              type="number"
              value={settings.maxChatMessagesPerDay}
              onChange={(e) => setSettings({ ...settings, maxChatMessagesPerDay: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Coins Configuration */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="w-6 h-6 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">Настройка монет</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-700 mb-3">Стоимость операций</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Генерация квиза</label>
                <input
                  type="number"
                  value={settings.quizGenerationCost}
                  onChange={(e) => setSettings({ ...settings, quizGenerationCost: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Генерация roadmap</label>
                <input
                  type="number"
                  value={settings.roadmapGenerationCost}
                  onChange={(e) => setSettings({ ...settings, roadmapGenerationCost: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-3">Начальный баланс</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ученик</label>
                <input
                  type="number"
                  value={settings.initialStudentCoins}
                  onChange={(e) => setSettings({ ...settings, initialStudentCoins: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Учитель</label>
                <input
                  type="number"
                  value={settings.initialTeacherCoins}
                  onChange={(e) => setSettings({ ...settings, initialTeacherCoins: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Родитель</label>
                <input
                  type="number"
                  value={settings.initialParentCoins}
                  onChange={(e) => setSettings({ ...settings, initialParentCoins: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-bold text-slate-800">Уведомления</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableEmailNotifications}
              onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-primary-500 focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-slate-700">Email уведомления</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifyOnConnectionRequest}
              onChange={(e) => setSettings({ ...settings, notifyOnConnectionRequest: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-primary-500 focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-slate-700">Уведомлять о запросах на связь</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifyOnQuizComplete}
              onChange={(e) => setSettings({ ...settings, notifyOnQuizComplete: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-primary-500 focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-slate-700">Уведомлять о завершении квизов</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifyOnNewQuest}
              onChange={(e) => setSettings({ ...settings, notifyOnNewQuest: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-primary-500 focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-slate-700">Уведомлять о новых квестах</span>
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-bold text-slate-800">Безопасность</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Таймаут сессии (часы)</label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Макс. попыток входа</label>
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-primary-500 focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-slate-700">Требовать подтверждение email</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableTwoFactor}
              onChange={(e) => setSettings({ ...settings, enableTwoFactor: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-slate-300 text-primary-500 focus:ring-4 focus:ring-primary-500/20"
            />
            <span className="text-slate-700">Включить двухфакторную аутентификацию</span>
          </label>
        </div>
      </div>
    </div>
  );
};
