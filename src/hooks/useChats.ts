import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { chatService } from '../services/chat.service';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for chat operations with real-time updates
 */
export function useChats() {
  const {
    profile,
    chats,
    activeChat,
    chatMessages,
    setChats,
    addChat,
    setActiveChat,
    setChatMessages,
    addChatMessage,
    setLoading,
    setError,
  } = useStore();

  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Load user's chats
  useEffect(() => {
    if (!isSupabaseConfigured() || !profile) return;

    loadChats();
  }, [profile?.id]);

  // Subscribe to active chat messages
  useEffect(() => {
    if (!isSupabaseConfigured() || !activeChat) return;

    loadChatMessages(activeChat.id);

    // Subscribe to real-time messages
    const unsubscribe = chatService.subscribeToMessages(activeChat.id, (message) => {
      addChatMessage(activeChat.id, message);
    });

    return () => unsubscribe();
  }, [activeChat?.id]);

  const loadChats = async () => {
    if (!profile) return;

    setIsLoadingChats(true);
    setChatError(null);

    try {
      // In a real implementation, you'd fetch chats the user is a member of
      // For now, we'll use the search function
      const allChats = await chatService.searchChats('');
      setChats(allChats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load chats';
      setChatError(message);
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    setChatError(null);

    try {
      const messages = await chatService.getMessages(chatId);
      setChatMessages(chatId, messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load messages';
      setChatError(message);
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createChat = async (data: {
    name: string;
    type: 'public' | 'school_parent' | 'school_teacher' | 'direct';
    schoolId?: string;
  }) => {
    if (!profile) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const chat = await chatService.createChat({
        name: data.name,
        type: data.type,
        school_id: data.schoolId || null,
        created_by: profile.id,
      });
      
      addChat(chat);
      return chat;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create chat';
      setError(message);
      console.error('Failed to create chat:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinChat = async (invitationCode: string) => {
    if (!profile) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const chat = await chatService.joinChatByInvitation(invitationCode, profile.id);
      addChat(chat);
      return chat;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join chat';
      setError(message);
      console.error('Failed to join chat:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (chatId: string, content: string) => {
    if (!profile) throw new Error('Not authenticated');

    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: profile.id,
      content,
      sent_at: new Date().toISOString(),
    };
    addChatMessage(chatId, tempMessage);

    try {
      const message = await chatService.sendMessage(chatId, profile.id, content);
      // Replace temp message with real one
      const messages = chatMessages[chatId] || [];
      const updatedMessages = messages.map(m => m.id === tempMessage.id ? message : m);
      setChatMessages(chatId, updatedMessages);
      return message;
    } catch (error) {
      // Remove temp message on error
      const messages = chatMessages[chatId] || [];
      const updatedMessages = messages.filter(m => m.id !== tempMessage.id);
      setChatMessages(chatId, updatedMessages);
      throw error;
    }
  };

  const searchChats = async (query: string) => {
    try {
      return await chatService.searchChats(query);
    } catch (error) {
      console.error('Failed to search chats:', error);
      return [];
    }
  };

  return {
    chats,
    activeChat,
    chatMessages: activeChat ? chatMessages[activeChat.id] || [] : [],
    isLoadingChats,
    isLoadingMessages,
    chatError,
    setActiveChat,
    createChat,
    joinChat,
    sendMessage,
    searchChats,
    refreshChats: loadChats,
  };
}
