import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { clearAllStorage, clearAppStorage, getStorageInfo } from '@/utils/clearStorage';
import { Link } from 'react-router-dom';

export function Debug() {
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const currentUser = useStore((state) => state.currentUser);
  const profile = useStore((state) => state.profile);
  const session = useStore((state) => state.session);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  useEffect(() => {
    setSupabaseConfigured(isSupabaseConfigured());
    setStorageInfo(getStorageInfo());
  }, []);

  const handleClearAll = () => {
    if (confirm('Очистить весь localStorage? Это удалит все данные!')) {
      clearAllStorage();
      window.location.reload();
    }
  };

  const handleClearApp = () => {
    if (confirm('Очистить данные приложения?')) {
      clearAppStorage();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🔧 Debug Panel
          </h1>
          <p className="text-slate-600">
            Информация для отладки приложения
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Навигация</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Главная
            </Link>
            <Link to="/login" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Вход
            </Link>
            <Link to="/register" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              Регистрация
            </Link>
            {currentUser && (
              <Link to="/dashboard" className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Supabase Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Статус Supabase</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${supabaseConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {supabaseConfigured ? '✅ Настроен' : '❌ Не настроен'}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              <p>URL: {(import.meta as any).env.VITE_SUPABASE_URL || 'не задан'}</p>
              <p>Key: {(import.meta as any).env.VITE_SUPABASE_ANON_KEY ? '***' + (import.meta as any).env.VITE_SUPABASE_ANON_KEY.slice(-10) : 'не задан'}</p>
            </div>
            {!supabaseConfigured && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-800">
                  <strong>Как настроить:</strong>
                  <br />
                  1. Создайте проект на supabase.com
                  <br />
                  2. Скопируйте URL и anon key
                  <br />
                  3. Добавьте их в файл .env
                  <br />
                  4. Перезапустите dev сервер
                  <br />
                  <br />
                  Подробная инструкция: <code>SUPABASE_SETUP_GUIDE.md</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Current User */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Текущий пользователь</h2>
          
          {/* New Supabase Profile */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Profile (Supabase)</h3>
            {profile ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Имя:</strong> {profile.full_name}</p>
                <p><strong>Роль:</strong> {profile.role}</p>
                <p><strong>ID:</strong> {profile.id}</p>
                <p><strong>Монеты:</strong> {profile.wisdom_coins}</p>
                <p><strong>Подписка:</strong> {profile.subscription_tier}</p>
                {profile.school_id && <p><strong>Школа:</strong> {profile.school_id}</p>}
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600">Показать полный profile</summary>
                  <pre className="mt-2 p-4 bg-slate-50 rounded text-xs overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-slate-600">Profile не загружен</p>
            )}
          </div>

          {/* Session */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Session (Supabase)</h3>
            {session ? (
              <div className="space-y-2">
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600">Показать полную session</summary>
                  <pre className="mt-2 p-4 bg-slate-50 rounded text-xs overflow-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-slate-600">Session не активна</p>
            )}
          </div>

          {/* Legacy currentUser */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Legacy currentUser (Demo режим)</h3>
            {currentUser ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Имя:</strong> {currentUser.name}</p>
                <p><strong>Роль:</strong> {currentUser.role}</p>
                <p><strong>ID:</strong> {currentUser.id}</p>
                {currentUser.schoolId && <p><strong>Школа:</strong> {currentUser.schoolId}</p>}
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600">Показать полный currentUser</summary>
                  <pre className="mt-2 p-4 bg-slate-50 rounded text-xs overflow-auto">
                    {JSON.stringify(currentUser, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-slate-600">currentUser не установлен (используется Supabase режим)</p>
            )}
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">LocalStorage</h2>
          {storageInfo && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Размер: {(storageInfo.totalSize / 1024).toFixed(2)} KB
              </p>
              
              <div>
                <h3 className="font-semibold mb-2">localStorage ({Object.keys(storageInfo.localStorage).length} ключей)</h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {Object.entries(storageInfo.localStorage).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-2 bg-slate-50 rounded text-xs">
                      <div className="font-mono font-bold text-blue-600">{key}</div>
                      <div className="mt-1 text-slate-600 break-all">
                        {typeof value === 'string' && value.length > 200 
                          ? value.substring(0, 200) + '...' 
                          : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(storageInfo.sessionStorage).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">sessionStorage ({Object.keys(storageInfo.sessionStorage).length} ключей)</h3>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {Object.entries(storageInfo.sessionStorage).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-2 bg-slate-50 rounded text-xs">
                        <div className="font-mono font-bold text-purple-600">{key}</div>
                        <div className="mt-1 text-slate-600 break-all">
                          {typeof value === 'string' && value.length > 200 
                            ? value.substring(0, 200) + '...' 
                            : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Действия</h2>
          <div className="space-y-3">
            <button
              onClick={() => setStorageInfo(getStorageInfo())}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 Обновить информацию
            </button>
            <button
              onClick={handleClearApp}
              className="w-full px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              🧹 Очистить данные приложения
            </button>
            <button
              onClick={handleClearAll}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ⚠️ Очистить весь localStorage
            </button>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Переменные окружения</h2>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-slate-50 rounded">
              <strong>VITE_SUPABASE_URL:</strong> {(import.meta as any).env.VITE_SUPABASE_URL || 'не задан'}
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <strong>VITE_SUPABASE_ANON_KEY:</strong> {(import.meta as any).env.VITE_SUPABASE_ANON_KEY ? '***' : 'не задан'}
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <strong>VITE_GROQ_API_KEY:</strong> {(import.meta as any).env.VITE_GROQ_API_KEY ? '***' : 'не задан'}
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <strong>MODE:</strong> {(import.meta as any).env.MODE}
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <strong>DEV:</strong> {(import.meta as any).env.DEV ? 'true' : 'false'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
