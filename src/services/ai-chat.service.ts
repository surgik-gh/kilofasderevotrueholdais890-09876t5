/**
 * AI Chat Service
 * Handles AI chat sessions and message persistence
 * 
 * Requirements:
 * - 3.1: Save user and AI messages to database
 * - 3.2: AI responds to messages
 * - 3.3: Load chat history from database
 * - 3.4: Store message metadata (user_id, content, role, timestamp, session_id)
 * - 3.5: Group messages by chat_session_id
 * - 3.6: Create new chat sessions
 * - 3.7: Display list of previous chat sessions
 */

import { supabase } from '../lib/supabase';
import { sendExpertChatMessage } from './ai.service';
import type { AIChatSession, AIChatMessage } from '../types/platform';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateSessionData {
  userId: string;
  title?: string;
}

export interface SendMessageData {
  sessionId: string;
  userId: string;
  content: string;
}

export interface AIChatError {
  code: string;
  message: string;
}

// ============================================================================
// AI CHAT SERVICE
// ============================================================================

export class AIChatService {
  /**
   * Create a new AI chat session
   * - Creates session record in database
   * - Returns session data
   * 
   * @param data Session creation data
   * @returns Created session
   * @throws Error if creation fails
   * 
   * Requirements: 3.6
   */
  async createSession(data: CreateSessionData): Promise<AIChatSession> {
    const { userId, title } = data;

    // Validate required fields
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Create session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: userId,
          title: title || 'Новый чат',
        })
        .select()
        .single();

      if (sessionError) {
        throw this.handleSupabaseError(sessionError);
      }

      if (!sessionData) {
        throw this.createError('CREATION_FAILED', 'Failed to create chat session');
      }

      return sessionData as AIChatSession;
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('CREATION_FAILED', `Failed to create session: ${(error as Error).message}`);
    }
  }

  /**
   * Get all chat sessions for a user
   * - Returns sessions ordered by most recent
   * - Includes session metadata
   * 
   * @param userId User ID
   * @returns Array of chat sessions
   * 
   * Requirements: 3.7
   */
  async getSessions(userId: string): Promise<AIChatSession[]> {
    // Validate required fields
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as AIChatSession[];
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch sessions: ${(error as Error).message}`);
    }
  }

  /**
   * Get messages for a chat session
   * - Returns all messages in chronological order
   * - Includes both user and assistant messages
   * 
   * @param sessionId Session ID
   * @returns Array of messages
   * 
   * Requirements: 3.3, 3.4, 3.5
   */
  async getMessages(sessionId: string): Promise<AIChatMessage[]> {
    // Validate required fields
    if (!sessionId) {
      throw this.createError('MISSING_FIELDS', 'Session ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as AIChatMessage[];
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch messages: ${(error as Error).message}`);
    }
  }

  /**
   * Send a message and get AI response
   * - Saves user message to database
   * - Calls AI service to get response
   * - Saves AI response to database
   * - Updates session timestamp
   * - Returns AI response message
   * 
   * @param data Message data
   * @returns AI response message
   * @throws Error if send fails or AI service fails
   * 
   * Requirements: 3.1, 3.2, 3.4
   */
  async sendMessage(data: SendMessageData): Promise<AIChatMessage> {
    const { sessionId, userId, content } = data;

    // Validate required fields
    if (!sessionId || !userId || !content) {
      throw this.createError('MISSING_FIELDS', 'Session ID, user ID, and content are required');
    }

    // Validate content is not empty
    if (!content.trim()) {
      throw this.createError('EMPTY_MESSAGE', 'Message content cannot be empty');
    }

    try {
      // 1. Save user message to database
      const { data: userMessageData, error: userMessageError } = await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role: 'user',
          content: content.trim(),
        })
        .select()
        .single();

      if (userMessageError) {
        throw this.handleSupabaseError(userMessageError);
      }

      if (!userMessageData) {
        throw this.createError('SAVE_FAILED', 'Failed to save user message');
      }

      // 2. Get conversation history for context
      const conversationHistory = await this.getMessages(sessionId);

      // Convert to format expected by AI service
      const historyForAI = conversationHistory.map(msg => ({
        id: msg.id,
        chat_id: sessionId,
        sender_id: msg.user_id,
        content: msg.content,
        sent_at: msg.created_at,
      }));

      // 3. Call AI service to get response
      let aiResponse: string;
      try {
        aiResponse = await sendExpertChatMessage(historyForAI, content, userId);
      } catch (aiError) {
        // If AI service fails, still return the user message but throw error
        throw this.createError('AI_SERVICE_ERROR', `AI service failed: ${(aiError as Error).message}`);
      }

      // 4. Save AI response to database
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role: 'assistant',
          content: aiResponse,
        })
        .select()
        .single();

      if (aiMessageError) {
        throw this.handleSupabaseError(aiMessageError);
      }

      if (!aiMessageData) {
        throw this.createError('SAVE_FAILED', 'Failed to save AI response');
      }

      // 5. Update session timestamp
      await this.updateSessionTimestamp(sessionId);

      // Return AI response message
      return aiMessageData as AIChatMessage;
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('SEND_FAILED', `Failed to send message: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a chat session
   * - Deletes session and all associated messages (CASCADE)
   * - Only session owner can delete
   * 
   * @param sessionId Session ID
   * @param userId User ID (for authorization)
   * @throws Error if not authorized or delete fails
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    // Validate required fields
    if (!sessionId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Session ID and user ID are required');
    }

    try {
      // Verify session belongs to user
      const { data: session, error: fetchError } = await supabase
        .from('ai_chat_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        throw this.handleSupabaseError(fetchError);
      }

      if (!session) {
        throw this.createError('NOT_FOUND', 'Session not found');
      }

      if (session.user_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to delete this session');
      }

      // Delete session (messages will be deleted by CASCADE)
      const { error: deleteError } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) {
        throw this.handleSupabaseError(deleteError);
      }
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('DELETE_FAILED', `Failed to delete session: ${(error as Error).message}`);
    }
  }

  /**
   * Update session title
   * - Updates the title of a chat session
   * - Only session owner can update
   * 
   * @param sessionId Session ID
   * @param userId User ID (for authorization)
   * @param title New title
   * @throws Error if not authorized or update fails
   */
  async updateSessionTitle(sessionId: string, userId: string, title: string): Promise<AIChatSession> {
    // Validate required fields
    if (!sessionId || !userId || !title) {
      throw this.createError('MISSING_FIELDS', 'Session ID, user ID, and title are required');
    }

    try {
      // Update session title
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .update({ title: title.trim(), updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('UPDATE_FAILED', 'Failed to update session title');
      }

      return data as AIChatSession;
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update session title: ${(error as Error).message}`);
    }
  }

  /**
   * Get a single session by ID
   * - Returns session data
   * - Verifies user has access
   * 
   * @param sessionId Session ID
   * @param userId User ID (for authorization)
   * @returns Session data
   * @throws Error if not found or not authorized
   */
  async getSession(sessionId: string, userId: string): Promise<AIChatSession> {
    // Validate required fields
    if (!sessionId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Session ID and user ID are required');
    }

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Session not found');
      }

      return data as AIChatSession;
    } catch (error) {
      if (this.isAIChatError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch session: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Update session timestamp
   * - Updates the updated_at field to current time
   * - Used when new messages are added
   */
  private async updateSessionTimestamp(sessionId: string): Promise<void> {
    await supabase
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  /**
   * Create an AIChatError
   */
  private createError(code: string, message: string): AIChatError {
    return { code, message };
  }

  /**
   * Check if error is an AIChatError
   */
  private isAIChatError(error: unknown): error is AIChatError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to AIChatError
   */
  private handleSupabaseError(error: { message: string; code?: string }): AIChatError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Resource not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this resource');
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
export const aiChatService = new AIChatService();
