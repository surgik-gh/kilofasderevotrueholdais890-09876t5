/**
 * TicketChat Component
 * Displays ticket messages and allows sending new messages
 * 
 * Requirements:
 * - 12.3: Ticket messaging
 * - 12.5: Show ticket status
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supportTicketService, TicketMessage } from '../../services/support.service';
import { supabase } from '../../lib/supabase';

interface TicketChatProps {
  ticketId: string;
}

export const TicketChat: React.FC<TicketChatProps> = ({ ticketId }) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    getCurrentUser();
  }, [ticketId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const fetchedMessages = await supportTicketService.getTicketMessages(ticketId);
      setMessages(fetchedMessages);

      // Fetch user profiles for all message senders
      const userIds = [...new Set(fetchedMessages.map(m => m.sender_id))];
      const profiles: Record<string, any> = {};
      
      for (const userId of userIds) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, full_name, role')
          .eq('id', userId)
          .single();
        
        if (data) {
          profiles[userId] = data;
        }
      }
      
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      await supportTicketService.sendTicketMessage(ticketId, currentUserId, newMessage);
      setNewMessage('');
      
      // Reload messages
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500">
        <div className="animate-pulse">Загрузка сообщений...</div>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-slate-200 pt-4 mt-4">
      <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Send className="w-4 h-4" />
        Переписка по тикету
      </h4>

      {/* Messages List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>Пока нет сообщений</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const sender = userProfiles[message.sender_id];
              const isCurrentUser = message.sender_id === currentUserId;
              const isAdmin = sender?.role === 'administrator';

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    isAdmin 
                      ? 'bg-gradient-to-br from-red-400 to-rose-500' 
                      : 'bg-gradient-to-br from-primary-400 to-purple-500'
                  }`}>
                    {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!isCurrentUser && (
                        <span className="text-xs font-semibold text-slate-600">
                          {sender?.full_name || 'Пользователь'}
                          {isAdmin && ' (Администратор)'}
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs font-semibold text-slate-600">Вы</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(message.sent_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-xl ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white' 
                        : isAdmin
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-slate-800 border-2 border-green-200'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Напишите сообщение..."
          className="flex-1 px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
};
