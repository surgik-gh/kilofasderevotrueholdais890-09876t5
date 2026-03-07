/**
 * Notifications Page
 * 
 * Full page view for notifications with tabs for list and settings
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { NotificationList } from '@/components/notifications/NotificationList';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { Bell, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

type Tab = 'list' | 'settings';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<Tab>('list');

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              activeTab === 'list'
                ? "bg-primary-500 text-white shadow-lg"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Bell className="w-4 h-4" />
            Уведомления
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              activeTab === 'settings'
                ? "bg-primary-500 text-white shadow-lg"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <NotificationList />
        ) : (
          <NotificationSettings />
        )}
      </div>
    </Layout>
  );
}
