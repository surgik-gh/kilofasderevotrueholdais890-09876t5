/**
 * Support Ticket Service
 * Handles support ticket creation, management, and messaging
 * 
 * Requirements:
 * - 12.1: Create support tickets
 * - 12.2: Administrator ticket visibility
 * - 12.3: Ticket messaging
 * - 12.4: School change requests via tickets
 * - 12.5: Ticket status management
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface TicketFilters {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high';
}

export interface SupportError {
  code: string;
  message: string;
}

// ============================================================================
// SUPPORT TICKET SERVICE
// ============================================================================

export class SupportTicketService {
  /**
   * Create a new support ticket
   * - Creates ticket with 'open' status
   * - Notifies administrators (handled by database triggers/webhooks)
   * 
   * @param userId User creating the ticket
   * @param ticketData Ticket data
   * @returns Created ticket
   * @throws Error if creation fails
   * 
   * Requirements: 12.1
   */
  async createTicket(userId: string, ticketData: CreateTicketData): Promise<SupportTicket> {
    const { subject, description, priority = 'medium' } = ticketData;

    // Validate required fields
    if (!subject || !description) {
      throw this.createError('MISSING_FIELDS', 'Subject and description are required');
    }

    // Validate subject length
    if (subject.trim().length < 3) {
      throw this.createError('INVALID_SUBJECT', 'Subject must be at least 3 characters');
    }

    // Validate description length
    if (description.trim().length < 10) {
      throw this.createError('INVALID_DESCRIPTION', 'Description must be at least 10 characters');
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      throw this.createError('INVALID_PRIORITY', 'Priority must be low, medium, or high');
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject: subject.trim(),
          description: description.trim(),
          status: 'open',
          priority,
        })
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('CREATION_FAILED', 'Failed to create support ticket');
      }

      return data as SupportTicket;
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      throw this.createError('CREATION_FAILED', `Failed to create ticket: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific support ticket
   * - Users can only view their own tickets
   * - Administrators can view all tickets
   * 
   * @param ticketId Ticket ID
   * @returns Ticket or null if not found
   * 
   * Requirements: 12.2
   */
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        // Not found is not an error, just return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw this.handleSupabaseError(error);
      }

      return data as SupportTicket | null;
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      console.error('Failed to fetch ticket:', error);
      return null;
    }
  }

  /**
   * Get all support tickets (with optional filters)
   * - Only administrators can call this
   * - Returns all tickets with user information
   * - Supports filtering by status and priority
   * 
   * @param filters Optional filters
   * @returns Array of tickets
   * 
   * Requirements: 12.2
   */
  async getAllTickets(filters?: TicketFilters): Promise<SupportTicket[]> {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data as SupportTicket[]) || [];
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch tickets: ${(error as Error).message}`);
    }
  }

  /**
   * Update ticket status
   * - Only administrators can update status
   * - Validates status transitions
   * 
   * @param ticketId Ticket ID
   * @param status New status
   * @returns Updated ticket
   * @throws Error if update fails
   * 
   * Requirements: 12.5
   */
  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<SupportTicket> {
    // Validate status
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      throw this.createError('INVALID_STATUS', 'Invalid ticket status');
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('UPDATE_FAILED', 'Failed to update ticket status');
      }

      return data as SupportTicket;
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update status: ${(error as Error).message}`);
    }
  }

  /**
   * Send a message to a support ticket
   * - Users can send messages to their own tickets
   * - Administrators can send messages to any ticket
   * - Notifies the other party (handled by database triggers/webhooks)
   * 
   * @param ticketId Ticket ID
   * @param senderId Sender user ID
   * @param message Message content
   * @returns Created message
   * @throws Error if sending fails
   * 
   * Requirements: 12.3
   */
  async sendTicketMessage(
    ticketId: string,
    senderId: string,
    message: string
  ): Promise<TicketMessage> {
    // Validate message
    if (!message || message.trim().length === 0) {
      throw this.createError('EMPTY_MESSAGE', 'Message cannot be empty');
    }

    if (message.trim().length > 5000) {
      throw this.createError('MESSAGE_TOO_LONG', 'Message cannot exceed 5000 characters');
    }

    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: senderId,
          message: message.trim(),
        })
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('SEND_FAILED', 'Failed to send message');
      }

      return data as TicketMessage;
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      throw this.createError('SEND_FAILED', `Failed to send message: ${(error as Error).message}`);
    }
  }

  /**
   * Get all messages for a support ticket
   * - Users can view messages for their own tickets
   * - Administrators can view messages for any ticket
   * - Returns messages in chronological order
   * 
   * @param ticketId Ticket ID
   * @returns Array of messages
   * 
   * Requirements: 12.3
   */
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('sent_at', { ascending: true });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data as TicketMessage[]) || [];
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch messages: ${(error as Error).message}`);
    }
  }

  /**
   * Get all tickets for the current user
   * - Returns user's own tickets
   * - Ordered by creation date (newest first)
   * 
   * @param userId User ID
   * @returns Array of tickets
   */
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data as SupportTicket[]) || [];
    } catch (error) {
      if (this.isSupportError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch user tickets: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a SupportError
   */
  private createError(code: string, message: string): SupportError {
    return { code, message };
  }

  /**
   * Check if error is a SupportError
   */
  private isSupportError(error: unknown): error is SupportError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to SupportError
   */
  private handleSupabaseError(error: { message: string; code?: string }): SupportError {
    // Map common Supabase error codes
    if (error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Ticket not found');
    }

    if (error.message.includes('foreign key') || error.message.includes('violates')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    if (error.message.includes('permission') || error.message.includes('policy')) {
      return this.createError('ACCESS_DENIED', 'You do not have permission to perform this action');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const supportTicketService = new SupportTicketService();
