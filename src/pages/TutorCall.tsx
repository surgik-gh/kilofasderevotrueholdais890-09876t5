/**
 * Tutor Call Page
 * Main page for voice calls with AI tutor
 */

import React, { useState } from 'react';
import { TutorCallInterface } from '../components/tutor-call/TutorCallInterface';
import { TutorCallHistory } from '../components/tutor-call/TutorCallHistory';
import { Phone, History } from 'lucide-react';

type TabType = 'call' | 'history';

export const TutorCall: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('call');
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleCallEnd = () => {
    // Refresh history when call ends
    setRefreshHistory((prev) => prev + 1);
    // Switch to history tab
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Репетитор
          </h1>
          <p className="text-gray-600">
            Голосовые звонки с искусственным интеллектом для помощи в обучении
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('call')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'call'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                <span>Звонок</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <History className="w-5 h-5" />
                <span>История</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'call' ? (
            <TutorCallInterface onCallEnd={handleCallEnd} />
          ) : (
            <TutorCallHistory key={refreshHistory} />
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Как работает AI Репетитор?
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">1.</span>
              <p>
                Нажмите "Начать звонок" и разрешите доступ к микрофону
              </p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">2.</span>
              <p>
                Задавайте вопросы голосом - AI репетитор ответит вам
              </p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">3.</span>
              <p>
                Стоимость: 10 монет мудрости за минуту (минимум 5 минут)
              </p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600">4.</span>
              <p>
                Премиум подписки получают скидку до 30%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
