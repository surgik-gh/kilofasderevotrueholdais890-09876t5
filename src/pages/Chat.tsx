import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Send, Bot, User, Users, MessageCircle, Search, ArrowRight, Copy, Check, Plus, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { chatService } from '@/services/chat.service';
import { supabase } from '@/lib/supabase';
import { ChatWindow } from '@/components/chat';
import type { Chat as ChatType, ChatMessage, UserProfile } from '@/lib/supabase';

export function Chat() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'public' | 'school_parent' | 'school_teacher' | 'direct'>('public');
  const [invitationCode, setInvitationCode] = useState('');
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Load current user and chats
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUser(profile as UserProfile);
          
          // Load user's chats
          const userChats = await chatService.getUserChats(user.id);
          setChats(userChats);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCopyInvitationCode = () => {
    if (!activeChat) return;
    navigator.clipboard.writeText(activeChat.invitation_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim() || !currentUser) return;

    try {
      const chat = await chatService.createChat({
        name: newChatName.trim(),
        type: newChatType,
        schoolId: newChatType.startsWith('school_') ? currentUser.school_id : null,
        createdBy: currentUser.id,
      });

      setChats(prev => [...prev, chat]);
      setShowCreateChat(false);
      setNewChatName('');
      setActiveChatId(chat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  };

  const handleJoinByCode = async () => {
    if (!invitationCode.trim() || !currentUser) return;

    try {
      const chat = await chatService.joinChatByInvitation(invitationCode.trim(), currentUser.id);
      setChats(prev => [...prev, chat]);
      setShowJoinByCode(false);
      setInvitationCode('');
      setActiveChatId(chat.id);
    } catch (error: any) {
      console.error('Error joining chat:', error);
      alert(error.message || 'Failed to join chat. Please check the invitation code.');
    }
  };

  const getChatName = (chat: ChatType) => {
    return chat.name || 'Chat';
  };

  const getChatType = (chat: ChatType) => {
    switch (chat.type) {
      case 'public':
        return 'Public Chat';
      case 'school_parent':
        return 'Parent Chat';
      case 'school_teacher':
        return 'Teacher Chat';
      case 'direct':
        return 'Direct Message';
      default:
        return '';
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    const name = getChatName(chat).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading chats...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-8rem)]"
      >
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Сообщения</h1>
            <p className="text-slate-500 mt-1">Общайтесь с учителями и одноклассниками</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick link to Alies AI */}
            <Link
              to="/alies-chat"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl liquid-glass hover:shadow-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800">Alies AI</p>
                <p className="text-xs text-slate-500">Задать вопрос ИИ</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Create Chat Button */}
            <button
              onClick={() => setShowCreateChat(true)}
              className="px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-2xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Создать чат</span>
            </button>

            {/* Join by Code Button */}
            <button
              onClick={() => setShowJoinByCode(true)}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <LinkIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Присоединиться</span>
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex rounded-3xl overflow-hidden shadow-2xl h-[calc(100%-5rem)]">
          {/* Chat List */}
          <div className="w-80 liquid-glass border-r border-white/20 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск чатов..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/30 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                />
              </div>
            </div>

            {/* Chats list */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length > 0 ? filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={cn(
                    "w-full p-4 flex items-center gap-4 transition-all text-left border-l-4",
                    activeChatId === chat.id 
                      ? "bg-white/80 border-primary-500 shadow-md" 
                      : "border-transparent hover:bg-white/50"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{getChatName(chat)}</p>
                    <p className="text-xs text-slate-500 truncate">{getChatType(chat)}</p>
                  </div>
                </button>
              )) : (
                <div className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">
                    {searchQuery ? 'Чаты не найдены' : 'Нет доступных чатов'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Создайте новый чат или присоединитесь по коду
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-white">
            <AnimatePresence mode="wait">
              {activeChat && currentUser ? (
                <motion.div
                  key={activeChat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <ChatWindow
                    chat={activeChat}
                    currentUser={currentUser}
                    onCopyInvitationCode={handleCopyInvitationCode}
                    copiedCode={copiedCode}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
                    <MessageCircle className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Сообщения</h3>
                  <p className="text-slate-500 max-w-md mb-6">
                    Выберите чат из списка слева для начала общения или создайте новый чат
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateChat(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all btn-shine"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Создать чат</span>
                    </button>
                    <Link
                      to="/alies-chat"
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all btn-shine"
                    >
                      <Bot className="w-5 h-5" />
                      <span>Открыть Alies AI</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Create Chat Modal */}
        {showCreateChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Создать новый чат</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Название чата
                  </label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Введите название..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Тип чата
                  </label>
                  <select
                    value={newChatType}
                    onChange={(e) => setNewChatType(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  >
                    <option value="public">Публичный</option>
                    <option value="school_parent">Родительский (школа)</option>
                    <option value="school_teacher">Учительский (школа)</option>
                    <option value="direct">Личный</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateChat(false)}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCreateChat}
                    disabled={!newChatName.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Создать
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Join by Code Modal */}
        {showJoinByCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoinByCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Присоединиться к чату</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Код приглашения
                  </label>
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    placeholder="Введите код..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all font-mono text-lg tracking-wider"
                    maxLength={8}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Введите 8-значный код приглашения
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowJoinByCode(false)}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleJoinByCode}
                    disabled={invitationCode.length !== 8}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Присоединиться
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
