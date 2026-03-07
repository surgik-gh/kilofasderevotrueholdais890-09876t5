/**
 * Notification Service
 * Handles system notifications for users
 * 
 * Requirements:
 * - 11.1: Create notifications for connection requests
 * - 11.2: Create notifications for quiz completion
 * - 11.3: Create notifications for lesson assignment
 * - 11.4: Create notifications for quest availability
 * - 11.5: Create notifications for challenge availability
 * - 11.6: Create notifications for support responses
 * - 11.7: Get notifications for user
 * - 11.8: Mark notifications as read
 * - 11.9: Get unread notification count
 * - 11.10: Configure notification preferences
 */

import { supabase } from '../lib/supabase';
import type { Notification } from '../types/platform';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 
  | 'connection_request'
  | 'quiz_completed'
  | 'lesson_assigned'
  | 'quest_available'
  | 'challenge_available'
  | 'support_response'
  | 'other';

export interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationError {
  code: string;
  message: string;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  // ============================================================================
  // CREATE NOTIFICATION
  // ============================================================================

  /**
   * Create a notification for a user
   * - Creates notification with unread status
   * - Supports all notification types
   * - Stores optional metadata in data field
   * 
   * @param params Notification parameters
   * @returns Created notification
   * @throws Error if creation fails
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const { user_id, type, title, message, data } = params;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      throw this.createError('MISSING_FIELDS', 'User ID, type, title, and message are required');
    }

    // Validate notification type
    const validTypes: NotificationType[] = [
      'connection_request',
      'quiz_completed',
      'lesson_assigned',
      'quest_available',
      'challenge_available',
      'support_response',
      'other',
    ];

    if (!validTypes.includes(type)) {
      throw this.createError('INVALID_TYPE', `Invalid notification type: ${type}`);
    }

    try {
      // Verify user exists
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user_id)
        .single();

      if (userError || !user) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Create notification
      const { data: notification, error: createError } = await supabase
        .from('notifications')
        .insert({
          user_id,
          type,
          title,
          message,
          data: data || null,
          read: false,
        })
        .select()
        .single();

      if (createError) {
        throw this.handleSupabaseError(createError);
      }

      if (!notification) {
        throw this.createError('CREATE_FAILED', 'Failed to create notification');
      }

      return notification as Notification;
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('CREATE_FAILED', `Failed to create notification: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // GET NOTIFICATIONS
  // ============================================================================

  /**
   * Get notifications for a user
   * - Returns notifications ordered by creation date (newest first)
   * - Optionally filter by read status
   * - Optionally filter by type
   * - Supports pagination
   * 
   * @param userId User ID
   * @param options Optional filters and pagination
   * @returns Array of notifications
   * 
   * Requirements: 11.7
   */
  async getNotifications(
    userId: string,
    options?: {
      read?: boolean;
      type?: NotificationType;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Build query
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (options?.read !== undefined) {
        query = query.eq('read', options.read);
      }

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Notification[];
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch notifications: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // MARK AS READ
  // ============================================================================

  /**
   * Mark a notification as read
   * - Updates read status to true
   * - Verifies user owns the notification
   * 
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Updated notification
   * @throws Error if unauthorized or update fails
   * 
   * Requirements: 11.8
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    if (!notificationId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Notification ID and user ID are required');
    }

    try {
      // Get notification to verify ownership
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        throw this.createError('NOT_FOUND', 'Notification not found');
      }

      // Verify user owns the notification
      if (notification.user_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to modify this notification');
      }

      // Update read status
      const { data: updatedNotification, error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedNotification) {
        throw this.createError('UPDATE_FAILED', 'Failed to update notification');
      }

      return updatedNotification as Notification;
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to mark notification as read: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // MARK ALL AS READ
  // ============================================================================

  /**
   * Mark all notifications as read for a user
   * - Updates all unread notifications to read status
   * - Only affects notifications owned by the user
   * 
   * @param userId User ID
   * @returns Number of notifications marked as read
   * 
   * Requirements: 11.8
   */
  async markAllAsRead(userId: string): Promise<number> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Update all unread notifications for user
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
        .select();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return data?.length || 0;
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to mark all notifications as read: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // GET UNREAD COUNT
  // ============================================================================

  /**
   * Get count of unread notifications for a user
   * - Returns total number of unread notifications
   * - Optionally filter by type
   * 
   * @param userId User ID
   * @param type Optional notification type filter
   * @returns Count of unread notifications
   * 
   * Requirements: 11.9
   */
  async getUnreadCount(userId: string, type?: NotificationType): Promise<number> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Build query
      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      // Apply type filter if provided
      if (type) {
        query = query.eq('type', type);
      }

      const { count, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return count || 0;
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to get unread count: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // DELETE NOTIFICATION
  // ============================================================================

  /**
   * Delete a notification
   * - Permanently removes notification
   * - Verifies user owns the notification
   * 
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @throws Error if unauthorized or deletion fails
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Notification ID and user ID are required');
    }

    try {
      // Get notification to verify ownership
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        throw this.createError('NOT_FOUND', 'Notification not found');
      }

      // Verify user owns the notification
      if (notification.user_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'You do not have permission to delete this notification');
      }

      // Delete notification
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) {
        throw this.handleSupabaseError(deleteError);
      }
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('DELETE_FAILED', `Failed to delete notification: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // BULK CREATE NOTIFICATIONS
  // ============================================================================

  /**
   * Create multiple notifications at once
   * - Useful for sending notifications to multiple users
   * - All notifications must have the same type, title, and message
   * - Each can have different user_id and data
   * 
   * @param notifications Array of notification parameters
   * @returns Array of created notifications
   */
  async bulkCreateNotifications(
    notifications: CreateNotificationParams[]
  ): Promise<Notification[]> {
    if (!notifications || notifications.length === 0) {
      throw this.createError('MISSING_FIELDS', 'Notifications array is required');
    }

    try {
      // Validate all notifications
      for (const notif of notifications) {
        if (!notif.user_id || !notif.type || !notif.title || !notif.message) {
          throw this.createError('MISSING_FIELDS', 'All notifications must have user_id, type, title, and message');
        }
      }

      // Prepare notification records
      const records = notifications.map(notif => ({
        user_id: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data || null,
        read: false,
      }));

      // Insert all notifications
      const { data, error } = await supabase
        .from('notifications')
        .insert(records)
        .select();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as Notification[];
    } catch (error) {
      if (this.isNotificationError(error)) {
        throw error;
      }
      throw this.createError('CREATE_FAILED', `Failed to create notifications: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a NotificationError
   */
  private createError(code: string, message: string): NotificationError {
    return { code, message };
  }

  /**
   * Check if error is a NotificationError
   */
  private isNotificationError(error: unknown): error is NotificationError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to NotificationError
   */
  private handleSupabaseError(error: { message: string; code?: string }): NotificationError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Resource not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to perform this action');
    }

    if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
      return this.createError('DUPLICATE', 'Notification already exists');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
