/**
 * ChatWindow Component
 * 
 * Displays messages in real-time, handles message sending,
 * shows typing indicators, and manages Supabase Realtime subscriptions
 * 
 * Requirements: 7.5
 */

import { useState, useRef, useEffect } from 'react';
import { Send, User, Users, MessageCircle, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { chatService } from '@/services/chat.service';
import type { Chat, ChatMessage, UserProfile } from '@/lib/supabase';

interface ChatWindowProps {
  chat: Chat;
  currentUser: UserProfile;
  onCopyInvitationCode?: () => void;
  copiedCode?: boolean;
}

export function ChatWindow({ chat, currentUser, onCopyInvitationCode, copiedCode }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when chat changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const chatMessages = await chatService.getMessages(chat.id);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToMessages(chat.id, (newMessage) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Show typing indicator briefly when receiving messages from others
      if (newMessage.sender_id !== currentUser.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chat.id, currentUser.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await chatService.sendMessage(chat.id, currentUser.id, inputText.trim());
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getChatName = () => {
    return chat.name || 'Chat';
  };

  const getChatType = () => {
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{getChatName()}</h3>
            <p className="text-sm text-slate-500">{getChatType()}</p>
          </div>
        </div>
        
        {/* Invitation Code */}
        {onCopyInvitationCode && (
          <button
            onClick={onCopyInvitationCode}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 rounded-xl hover:shadow-md transition-all"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">{chat.invitation_code}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Начните диалог</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Напишите первое сообщение, чтобы начать общение в {getChatName()}
            </p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "flex max-w-[80%]",
              msg.sender_id === currentUser.id ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md",
              msg.sender_id === currentUser.id
                ? "bg-gradient-to-br from-indigo-500 to-purple-500 ml-3" 
                : "bg-gradient-to-br from-emerald-400 to-teal-500 mr-3"
            )}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.sender_id === currentUser.id
                ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-tr-none" 
                : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div 
                    animate={{ y: [0, -6, 0] }} 
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                  />
                  <motion.div 
                    animate={{ y: [0, -6, 0] }} 
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  />
                  <motion.div 
                    animate={{ y: [0, -6, 0] }} 
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    className="w-2 h-2 rounded-full bg-emerald-600"
                  />
                </div>
                <span className="text-xs text-slate-400 ml-2">Печатает...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Напишите сообщение..."
            disabled={isSending}
            className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-shine"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
