/**
 * Chat Service
 * Handles chat creation, messaging, and real-time subscriptions
 * 
 * Requirements:
 * - 7.1: Chat creation with unique invitation code
 * - 7.2: Join chat by invitation code
 * - 7.3: Search public chats
 * - 7.5: Real-time messaging with Supabase Realtime
 */

import { supabase } from '../lib/supabase';
import type { 
  Chat, 
  ChatMessage,
  UserProfile 
} from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateChatData {
  name: string;
  type: 'public' | 'school_parent' | 'school_teacher' | 'direct';
  schoolId?: string | null;
  createdBy: string;
}

export interface ChatError {
  code: string;
  message: string;
}

// ============================================================================
// CHAT SERVICE
// ============================================================================

export class ChatService {
  /**
   * Create a new chat
   * - Generates unique invitation code
   * - Creates chat record
   * - Adds creator as first member
   * 
   * @param data Chat creation data
   * @returns Created chat
   * @throws Error if creation fails
   * 
   * Requirements: 7.1
   */
  async createChat(data: CreateChatData): Promise<Chat> {
    const { name, type, schoolId, createdBy } = data;

    // Validate required fields
    if (!name || !type || !createdBy) {
      throw this.createError('MISSING_FIELDS', 'Name, type, and creator ID are required');
    }

    // Validate type
    if (!['public', 'school_parent', 'school_teacher', 'direct'].includes(type)) {
      throw this.createError('INVALID_TYPE', 'Invalid chat type');
    }

    // Validate school_id for school chats
    if ((type === 'school_parent' || type === 'school_teacher') && !schoolId) {
      throw this.createError('MISSING_SCHOOL', 'School ID is required for school chats');
    }

    try {
      // Generate unique invitation code
      const invitationCode = await this.generateUniqueInvitationCode();

      // Create chat in database
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          name,
          type,
          school_id: schoolId || null,
          invitation_code: invitationCode,
          created_by: createdBy,
        })
        .select()
        .single();

      if (chatError) {
        throw this.handleSupabaseError(chatError);
      }

      if (!chatData) {
        throw this.createError('CREATION_FAILED', 'Failed to create chat');
      }

      // Add creator as first member
      await this.addMember(chatData.id, createdBy);

      return chatData as Chat;
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('CREATION_FAILED', `Failed to create chat: ${(error as Error).message}`);
    }
  }

  /**
   * Join a chat by invitation code
   * - Validates invitation code
   * - Checks if user is already a member
   * - Adds user to chat
   * 
   * @param invitationCode Invitation code
   * @param userId User ID
   * @returns Chat data
   * @throws Error if invalid code or already a member
   * 
   * Requirements: 7.2
   */
  async joinChatByInvitation(invitationCode: string, userId: string): Promise<Chat> {
    // Validate required fields
    if (!invitationCode || !userId) {
      throw this.createError('MISSING_FIELDS', 'Invitation code and user ID are required');
    }

    try {
      // Find chat by invitation code
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('invitation_code', invitationCode)
        .single();

      if (chatError || !chatData) {
        throw this.createError('NOT_FOUND', 'Chat not found');
      }

      // Check if user is already a member
      const { data: existingMembership, error: membershipError } = await supabase
        .from('chat_memberships')
        .select('id')
        .eq('chat_id', chatData.id)
        .eq('user_id', userId)
        .single();

      if (existingMembership && !membershipError) {
        throw this.createError('ALREADY_MEMBER', 'You are already a member of this chat');
      }

      // Add user to chat
      await this.addMember(chatData.id, userId);

      return chatData as Chat;
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('JOIN_FAILED', `Failed to join chat: ${(error as Error).message}`);
    }
  }

  /**
   * Search for public chats
   * - Returns all public chats matching query
   * - Searches by name
   * 
   * @param query Search query (optional)
   * @returns Array of public chats
   * 
   * Requirements: 7.3
   */
  async searchChats(query?: string): Promise<Chat[]> {
    try {
      let dbQuery = supabase
        .from('chats')
        .select('*')
        .eq('type', 'public');

      // Add name filter if query provided
      if (query && query.trim()) {
        dbQuery = dbQuery.ilike('name', `%${query.trim()}%`);
      }

      const { data, error } = await dbQuery.order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Chat[];
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('SEARCH_FAILED', `Failed to search chats: ${(error as Error).message}`);
    }
  }

  /**
   * Send a message to a chat
   * - Validates user is a member
   * - Creates message record
   * - Real-time subscribers will receive the message
   * 
   * @param chatId Chat ID
   * @param senderId Sender user ID
   * @param content Message content
   * @returns Created message
   * @throws Error if not a member or send fails
   * 
   * Requirements: 7.5
   */
  async sendMessage(chatId: string, senderId: string, content: string): Promise<ChatMessage> {
    // Validate required fields
    if (!chatId || !senderId || !content) {
      throw this.createError('MISSING_FIELDS', 'Chat ID, sender ID, and content are required');
    }

    // Validate content is not empty
    if (!content.trim()) {
      throw this.createError('EMPTY_MESSAGE', 'Message content cannot be empty');
    }

    try {
      // Verify user is a member of the chat
      const isMember = await this.isMember(chatId, senderId);
      
      if (!isMember) {
        throw this.createError('NOT_MEMBER', 'You must be a member of this chat to send messages');
      }

      // Create message
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: content.trim(),
        })
        .select()
        .single();

      if (messageError) {
        throw this.handleSupabaseError(messageError);
      }

      if (!messageData) {
        throw this.createError('SEND_FAILED', 'Failed to send message');
      }

      return messageData as ChatMessage;
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('SEND_FAILED', `Failed to send message: ${(error as Error).message}`);
    }
  }

  /**
   * Subscribe to messages in a chat
   * - Sets up real-time subscription
   * - Calls callback for each new message
   * - Returns unsubscribe function
   * 
   * @param chatId Chat ID
   * @param callback Function to call for each new message
   * @returns Unsubscribe function
   * 
   * Requirements: 7.5
   */
  subscribeToMessages(
    chatId: string,
    callback: (message: ChatMessage) => void
  ): () => void {
    // Create a channel for this chat
    const channel: RealtimeChannel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          // Call callback with new message
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get chat members
   * - Returns all users who are members of the chat
   * - Includes user profile information
   * 
   * @param chatId Chat ID
   * @returns Array of user profiles
   */
  async getChatMembers(chatId: string): Promise<UserProfile[]> {
    try {
      // Get member user IDs
      const { data: memberships, error: membershipError } = await supabase
        .from('chat_memberships')
        .select('user_id')
        .eq('chat_id', chatId);

      if (membershipError) {
        throw this.handleSupabaseError(membershipError);
      }

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const userIds = memberships.map(m => m.user_id);

      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      if (profileError) {
        throw this.handleSupabaseError(profileError);
      }

      return (profiles || []) as UserProfile[];
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch chat members: ${(error as Error).message}`);
    }
  }

  /**
   * Leave a chat
   * - Removes user from chat membership
   * - User can no longer send or receive messages
   * 
   * @param chatId Chat ID
   * @param userId User ID
   * @throws Error if not a member or leave fails
   */
  async leaveChat(chatId: string, userId: string): Promise<void> {
    try {
      // Verify user is a member
      const isMember = await this.isMember(chatId, userId);
      
      if (!isMember) {
        throw this.createError('NOT_MEMBER', 'You are not a member of this chat');
      }

      // Remove membership
      const { error } = await supabase
        .from('chat_memberships')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        throw this.handleSupabaseError(error);
      }
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('LEAVE_FAILED', `Failed to leave chat: ${(error as Error).message}`);
    }
  }

  /**
   * Get chats for a user
   * - Returns all chats the user is a member of
   * - Ordered by most recent activity
   * 
   * @param userId User ID
   * @returns Array of chats
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // Get chat IDs from memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('chat_memberships')
        .select('chat_id')
        .eq('user_id', userId);

      if (membershipError) {
        throw this.handleSupabaseError(membershipError);
      }

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const chatIds = memberships.map(m => m.chat_id);

      // Fetch chats
      const { data: chats, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('created_at', { ascending: false });

      if (chatError) {
        throw this.handleSupabaseError(chatError);
      }

      return (chats || []) as Chat[];
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user chats: ${(error as Error).message}`);
    }
  }

  /**
   * Get messages for a chat
   * - Returns all messages in the chat
   * - Ordered by sent time
   * - Optionally limit number of messages
   * 
   * @param chatId Chat ID
   * @param limit Optional limit on number of messages
   * @returns Array of messages
   */
  async getMessages(chatId: string, limit?: number): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as ChatMessage[];
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch messages: ${(error as Error).message}`);
    }
  }

  /**
   * Get a chat by ID
   * - Returns chat data
   * 
   * @param chatId Chat ID
   * @returns Chat data
   * @throws Error if chat not found
   */
  async getChat(chatId: string): Promise<Chat> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Chat not found');
      }

      return data as Chat;
    } catch (error) {
      if (this.isChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch chat: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate a unique invitation code
   * - Creates a random 8-character alphanumeric code
   * - Ensures uniqueness by checking database
   * 
   * Requirements: 7.1
   */
  private async generateUniqueInvitationCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 8;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate random code
      let code = '';
      for (let i = 0; i < codeLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if code already exists
      const { error } = await supabase
        .from('chats')
        .select('id')
        .eq('invitation_code', code)
        .single();

      // If no chat found with this code, it's unique
      if (error && error.code === 'PGRST116') {
        return code;
      }

      attempts++;
    }

    throw this.createError('CODE_GENERATION_FAILED', 'Failed to generate unique invitation code');
  }

  /**
   * Add a member to a chat
   */
  private async addMember(chatId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_memberships')
      .insert({
        chat_id: chatId,
        user_id: userId,
      });

    if (error) {
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Check if a user is a member of a chat
   */
  private async isMember(chatId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_memberships')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    // If no error, user is a member
    return !error;
  }

  /**
   * Create a ChatError
   */
  private createError(code: string, message: string): ChatError {
    return { code, message };
  }

  /**
   * Check if error is a ChatError
   */
  private isChatError(error: unknown): error is ChatError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to ChatError
   */
  private handleSupabaseError(error: { message: string; code?: string }): ChatError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Chat not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this chat');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Duplicate entry');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const chatService = new ChatService();
