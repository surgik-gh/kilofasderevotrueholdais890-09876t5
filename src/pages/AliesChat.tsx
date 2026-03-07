import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Send, Bot, User, Coins, AlertTriangle, Sparkles, Zap, BookOpen, Calculator, Lightbulb, HelpCircle, Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { estimateTokens } from '@/services/ai.service';
import { tokenEconomyService } from '@/services/token-economy.service';
import { aiChatService } from '@/services/ai-chat.service';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/supabase';
import type { AIChatSession, AIChatMessage } from '@/types/platform';

const quickPrompts = [
  { icon: Calculator, text: 'Объясни теорему Пифагора', color: 'from-blue-400 to-cyan-400' },
  { icon: BookOpen, text: 'Помоги с сочинением', color: 'from-purple-400 to-pink-400' },
  { icon: Lightbulb, text: 'Как решать квадратные уравнения?', color: 'from-amber-400 to-orange-400' },
  { icon: HelpCircle, text: 'Что такое фотосинтез?', color: 'from-emerald-400 to-teal-400' },
];

export function AliesChat() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [balance, setBalance] = useState(0);
  const [freeQueriesRemaining, setFreeQueriesRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user, balance, and sessions
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        
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
          setBalance(profile.wisdom_coins);
          setFreeQueriesRemaining(profile.free_expert_queries_remaining);
          
          // Load chat sessions
          await loadSessions(user.id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load sessions for user
  const loadSessions = async (userId: string) => {
    try {
      const userSessions = await aiChatService.getSessions(userId);
      setSessions(userSessions);
      
      // If there are sessions, load the most recent one
      if (userSessions.length > 0 && !currentSession) {
        await selectSession(userSessions[0]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Не удалось загрузить историю чатов.');
    }
  };

  // Load messages for a session
  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const sessionMessages = await aiChatService.getMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Не удалось загрузить сообщения.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Select a session
  const selectSession = async (session: AIChatSession) => {
    setCurrentSession(session);
    await loadMessages(session.id);
  };

  // Create new session
  const createNewSession = async () => {
    if (!currentUser) return;
    
    try {
      setError(null);
      const newSession = await aiChatService.createSession({
        userId: currentUser.id,
        title: 'Новый чат',
      });
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Не удалось создать новый чат.');
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      setError(null);
      await aiChatService.deleteSession(sessionId, currentUser.id);
      
      // Remove from list
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted current session, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        
        // Select first remaining session if any
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          await selectSession(remainingSessions[0]);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Не удалось удалить чат.');
    }
  };

  // Start editing session title
  const startEditingTitle = (session: AIChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title || 'Новый чат');
  };

  // Save edited title
  const saveEditedTitle = async (sessionId: string) => {
    if (!currentUser || !editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    
    try {
      setError(null);
      const updatedSession = await aiChatService.updateSessionTitle(
        sessionId,
        currentUser.id,
        editingTitle.trim()
      );
      
      // Update in list
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      
      // Update current session if it's the one being edited
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession);
      }
      
      setEditingSessionId(null);
    } catch (error) {
      console.error('Error updating title:', error);
      setError('Не удалось обновить название чата.');
    }
  };

  // Cancel editing title
  const cancelEditingTitle = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim() || !currentUser) return;

    // Create session if none exists
    if (!currentSession) {
      await createNewSession();
      // Wait a bit for session to be created
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!currentSession) {
      setError('Не удалось создать сессию чата.');
      return;
    }

    // Estimate tokens for the message
    const estimatedTokens = estimateTokens(messageText);
    const estimatedCost = tokenEconomyService.calculateExpertChatCost(estimatedTokens);

    // Check if user has free queries remaining
    const hasFreeQuery = freeQueriesRemaining > 0;

    // If no free queries, check balance
    if (!hasFreeQuery && balance < estimatedCost) {
      setError(`Недостаточно монет! Для этого запроса нужно примерно ${estimatedCost} монет. У вас: ${balance} монет.`);
      return;
    }

    // Add user message to UI immediately
    const tempUserMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      session_id: currentSession.id,
      user_id: currentUser.id,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);
    setInputText('');
    setIsTyping(true);
    setError(null);

    try {
      // Send message and get AI response (this saves both to database)
      const aiMessage = await aiChatService.sendMessage({
        sessionId: currentSession.id,
        userId: currentUser.id,
        content: messageText,
      });

      // Estimate response tokens
      const responseTokens = estimateTokens(aiMessage.content);
      const totalTokens = estimatedTokens + responseTokens;
      const actualCost = tokenEconomyService.calculateExpertChatCost(totalTokens);

      // Deduct cost
      if (hasFreeQuery) {
        // Use free query
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            free_expert_queries_remaining: freeQueriesRemaining - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (!updateError) {
          setFreeQueriesRemaining(prev => prev - 1);
        }
      } else {
        // Deduct coins
        await tokenEconomyService.deductTokens(
          currentUser.id,
          actualCost,
          'expert_chat_usage'
        );
        setBalance(prev => prev - actualCost);
      }

      // Add AI message to UI
      setMessages(prev => [...prev, aiMessage]);
      
      // Update session in list (move to top)
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== currentSession.id);
        return [currentSession, ...updated];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(`Произошла ошибка: ${errorMessage}`);
      
      // Add error message to chat
      const errorMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        session_id: currentSession.id,
        user_id: currentUser.id,
        role: 'assistant',
        content: `Произошла ошибка: ${errorMessage}\n\nПопробуйте еще раз.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Загрузка...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isThinking={isTyping}>
      <div className="h-[calc(100vh-8rem)] min-h-[500px] md:h-[calc(100vh-10rem)] flex gap-4">
        {/* Sessions Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 flex-shrink-0 flex flex-col rounded-3xl overflow-hidden shadow-2xl liquid-glass"
        >
          {/* Sidebar Header */}
          <div className="p-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Мои чаты
              </h2>
              <button
                onClick={createNewSession}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                title="Создать новый чат"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-white/80 text-sm">
              {sessions.length} {sessions.length === 1 ? 'чат' : sessions.length < 5 ? 'чата' : 'чатов'}
            </p>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  Нет сохраненных чатов
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Создайте новый чат, чтобы начать
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all group relative",
                    currentSession?.id === session.id
                      ? "bg-primary-100 border-2 border-primary-300"
                      : "bg-white/60 border border-slate-200 hover:bg-white hover:border-primary-200"
                  )}
                  onClick={() => selectSession(session)}
                >
                  {editingSessionId === session.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditedTitle(session.id);
                          if (e.key === 'Escape') cancelEditingTitle();
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditedTitle(session.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditingTitle}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 text-sm truncate">
                            {session.title || 'Новый чат'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(session.updated_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingTitle(session);
                            }}
                            className="p-1 text-slate-600 hover:text-primary-600 hover:bg-primary-100 rounded"
                            title="Переименовать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  <Bot className="w-8 h-8 text-white relative z-10" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
                    Alies AI
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </h1>
                  <p className="text-slate-500">
                    {currentSession ? currentSession.title || 'Новый чат' : 'Умный помощник для учёбы'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-700">{balance}</span>
                </div>
                {freeQueriesRemaining > 0 && (
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{freeQueriesRemaining} бесплатных</span>
                  </div>
                )}
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    {freeQueriesRemaining > 0 ? 'Бесплатно' : '~1 монета / вопрос'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Chat Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col rounded-3xl overflow-hidden shadow-2xl liquid-glass"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-500 text-sm">Загрузка сообщений...</p>
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                  {messages.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center py-8"
                    >
                      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100 flex items-center justify-center relative">
                        <Bot className="w-12 h-12 text-primary-500" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-3xl border-2 border-dashed border-primary-200"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">Привет! Я Alies AI</h3>
                      <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Задай мне любой вопрос по учёбе — математика, физика, литература, история и многое другое. Я помогу разобраться!
                      </p>
                      
                      {/* Quick Prompts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        {quickPrompts.map((prompt, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleSend(prompt.text)}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all text-left group"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform",
                              prompt.color
                            )}>
                              <prompt.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary-600 transition-colors">
                              {prompt.text}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "flex max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                        msg.role === 'user'
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 ml-3" 
                          : "bg-gradient-to-br from-primary-400 to-cyan-500 mr-3"
                      )}>
                        {msg.role === 'user'
                          ? <User className="w-5 h-5 text-white" /> 
                          : <Bot className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-md",
                        msg.role === 'user'
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm" 
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm"
                      )}>
                        {msg.role === 'assistant' && msg.content.includes('ошибка') ? (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>{msg.content}</span>
                          </div>
                        ) : msg.role === 'assistant' ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-md">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <motion.div 
                              animate={{ y: [0, -6, 0] }} 
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 rounded-full bg-primary-400"
                            />
                            <motion.div 
                              animate={{ y: [0, -6, 0] }} 
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                              className="w-2 h-2 rounded-full bg-primary-500"
                            />
                            <motion.div 
                              animate={{ y: [0, -6, 0] }} 
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                              className="w-2 h-2 rounded-full bg-primary-600"
                            />
                          </div>
                          <span className="text-xs text-slate-400 ml-2">Думаю...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Задайте вопрос Alies AI..."
                    disabled={isTyping}
                    className="w-full px-5 py-4 pr-14 border-2 border-slate-200 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all text-slate-700 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400">
                    {freeQueriesRemaining > 0 ? (
                      <>
                        <Sparkles className="w-3 h-3 text-green-500" />
                        <span className="text-green-600 font-medium">Бесплатно</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-3 h-3" />
                        <span>~1</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  className="px-6 py-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-xl hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-shine flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Отправить</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
