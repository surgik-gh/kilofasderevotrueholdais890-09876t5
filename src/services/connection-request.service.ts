/**
 * Connection Request Service
 * Handles connection requests between users (parent-child, teacher-school, student-school)
 * 
 * Requirements:
 * - 2.1: Create connection requests with pending status
 * - 2.2: Accept/reject connection requests
 * - 2.3: Create permanent parent-child links
 * - 2.5: Teacher-school connection requests
 * - 2.6: School-student connection requests
 * - 2.7: Validate connection request types
 * - 2.8: Display connection requests to recipients
 * - 11.1: Send notifications for connection requests
 */

import { supabase } from '../lib/supabase';
import type { ConnectionRequest } from '../types/platform';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateConnectionRequestParams {
  from_user_id: string;
  to_user_id: string;
  request_type: 'parent_child' | 'teacher_school' | 'student_school';
  message?: string;
}

export interface ConnectionRequestError {
  code: string;
  message: string;
}

// ============================================================================
// CONNECTION REQUEST SERVICE
// ============================================================================

export class ConnectionRequestService {
  // ============================================================================
  // CREATE CONNECTION REQUEST
  // ============================================================================

  /**
   * Create a connection request
   * - Creates a request with pending status
   * - Validates user roles match request type
   * - Prevents duplicate requests
   * - Sends notification to recipient
   * 
   * @param params Connection request parameters
   * @returns Created connection request
   * @throws Error if validation fails or creation fails
   * 
   * Requirements: 2.1, 2.5, 2.6, 2.7, 11.1
   */
  async createRequest(params: CreateConnectionRequestParams): Promise<ConnectionRequest> {
    const { from_user_id, to_user_id, request_type, message } = params;

    // Validate required fields
    if (!from_user_id || !to_user_id || !request_type) {
      throw this.createError('MISSING_FIELDS', 'From user ID, to user ID, and request type are required');
    }

    // Prevent self-connection
    if (from_user_id === to_user_id) {
      throw this.createError('INVALID_REQUEST', 'Cannot create connection request to yourself');
    }

    // Validate request type
    if (!['parent_child', 'teacher_school', 'student_school'].includes(request_type)) {
      throw this.createError('INVALID_REQUEST_TYPE', 'Invalid request type');
    }

    try {
      // Get user profiles to validate roles
      const { data: fromUser, error: fromError } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', from_user_id)
        .single();

      if (fromError || !fromUser) {
        throw this.createError('USER_NOT_FOUND', 'Sender user not found');
      }

      const { data: toUser, error: toError } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', to_user_id)
        .single();

      if (toError || !toUser) {
        throw this.createError('USER_NOT_FOUND', 'Recipient user not found');
      }

      // Validate roles match request type
      await this.validateRequestRoles(request_type, fromUser.role, toUser.role, from_user_id, to_user_id);

      // Check for existing pending or accepted request
      const { data: existingRequest, error: existingError } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('from_user_id', from_user_id)
        .eq('to_user_id', to_user_id)
        .eq('request_type', request_type)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existingError) {
        throw this.handleSupabaseError(existingError);
      }

      if (existingRequest) {
        throw this.createError('DUPLICATE_REQUEST', 'Connection request already exists');
      }

      // Create connection request with pending status
      const { data: request, error: createError } = await supabase
        .from('connection_requests')
        .insert({
          from_user_id,
          to_user_id,
          request_type,
          status: 'pending',
          message: message || null,
        })
        .select()
        .single();

      if (createError) {
        throw this.handleSupabaseError(createError);
      }

      if (!request) {
        throw this.createError('CREATE_FAILED', 'Failed to create connection request');
      }

      // Send notification to recipient
      await this.createNotification({
        user_id: to_user_id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${fromUser.full_name} sent you a connection request`,
        data: {
          request_id: request.id,
          request_type,
          from_user_id,
          from_user_name: fromUser.full_name,
        },
      });

      return request as ConnectionRequest;
    } catch (error) {
      if (this.isConnectionRequestError(error)) {
        throw error;
      }
      throw this.createError('CREATE_FAILED', `Failed to create connection request: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // ACCEPT CONNECTION REQUEST
  // ============================================================================

  /**
   * Accept a connection request
   * - Updates request status to accepted
   * - Creates appropriate link (parent_child_links or school_memberships)
   * - Sends notification to requester
   * - For parent-child: creates permanent link
   * - For teacher-school: creates school membership
   * - For student-school: creates school membership and auto-links parents
   * 
   * @param requestId Connection request ID
   * @param userId User ID accepting the request (must be recipient)
   * @returns Updated connection request
   * @throws Error if unauthorized or acceptance fails
   * 
   * Requirements: 2.2, 2.3, 11.1
   */
  async acceptRequest(requestId: string, userId: string): Promise<ConnectionRequest> {
    if (!requestId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Request ID and user ID are required');
    }

    try {
      // Get the connection request
      const { data: request, error: requestError } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        throw this.createError('REQUEST_NOT_FOUND', 'Connection request not found');
      }

      // Verify user is the recipient
      if (request.to_user_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'Only the recipient can accept this request');
      }

      // Verify request is pending
      if (request.status !== 'pending') {
        throw this.createError('INVALID_STATUS', `Request is already ${request.status}`);
      }

      // Create appropriate link based on request type
      if (request.request_type === 'parent_child') {
        await this.createParentChildLink(request.from_user_id, request.to_user_id);
      } else if (request.request_type === 'teacher_school') {
        await this.createSchoolMembership(request.to_user_id, request.from_user_id, 'teacher');
      } else if (request.request_type === 'student_school') {
        await this.createSchoolMembership(request.to_user_id, request.from_user_id, 'student');
        // Auto-link parents to school
        await this.autoLinkParentsToSchool(request.from_user_id, request.to_user_id);
      }

      // Update request status to accepted
      const { data: updatedRequest, error: updateError } = await supabase
        .from('connection_requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedRequest) {
        throw this.createError('UPDATE_FAILED', 'Failed to update connection request');
      }

      // Send notification to requester
      await this.createNotification({
        user_id: request.from_user_id,
        type: 'connection_request',
        title: 'Connection Request Accepted',
        message: `Your connection request was accepted`,
        data: {
          request_id: requestId,
          request_type: request.request_type,
          accepted_by: userId,
        },
      });

      return updatedRequest as ConnectionRequest;
    } catch (error) {
      if (this.isConnectionRequestError(error)) {
        throw error;
      }
      throw this.createError('ACCEPT_FAILED', `Failed to accept connection request: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // REJECT CONNECTION REQUEST
  // ============================================================================

  /**
   * Reject a connection request
   * - Updates request status to rejected
   * - Does not create any links
   * 
   * @param requestId Connection request ID
   * @param userId User ID rejecting the request (must be recipient)
   * @returns Updated connection request
   * @throws Error if unauthorized or rejection fails
   * 
   * Requirements: 2.2
   */
  async rejectRequest(requestId: string, userId: string): Promise<ConnectionRequest> {
    if (!requestId || !userId) {
      throw this.createError('MISSING_FIELDS', 'Request ID and user ID are required');
    }

    try {
      // Get the connection request
      const { data: request, error: requestError } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        throw this.createError('REQUEST_NOT_FOUND', 'Connection request not found');
      }

      // Verify user is the recipient
      if (request.to_user_id !== userId) {
        throw this.createError('UNAUTHORIZED', 'Only the recipient can reject this request');
      }

      // Verify request is pending
      if (request.status !== 'pending') {
        throw this.createError('INVALID_STATUS', `Request is already ${request.status}`);
      }

      // Update request status to rejected
      const { data: updatedRequest, error: updateError } = await supabase
        .from('connection_requests')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedRequest) {
        throw this.createError('UPDATE_FAILED', 'Failed to update connection request');
      }

      return updatedRequest as ConnectionRequest;
    } catch (error) {
      if (this.isConnectionRequestError(error)) {
        throw error;
      }
      throw this.createError('REJECT_FAILED', `Failed to reject connection request: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // GET REQUESTS FOR USER
  // ============================================================================

  /**
   * Get all connection requests for a user
   * - Returns both sent and received requests
   * - Optionally filter by status
   * 
   * @param userId User ID
   * @param status Optional status filter
   * @returns Array of connection requests
   * 
   * Requirements: 2.8
   */
  async getRequestsForUser(
    userId: string,
    status?: 'pending' | 'accepted' | 'rejected'
  ): Promise<{ sent: ConnectionRequest[]; received: ConnectionRequest[] }> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Build query for sent requests
      let sentQuery = supabase
        .from('connection_requests')
        .select('*')
        .eq('from_user_id', userId);

      if (status) {
        sentQuery = sentQuery.eq('status', status);
      }

      const { data: sentRequests, error: sentError } = await sentQuery
        .order('created_at', { ascending: false });

      if (sentError) {
        throw this.handleSupabaseError(sentError);
      }

      // Build query for received requests
      let receivedQuery = supabase
        .from('connection_requests')
        .select('*')
        .eq('to_user_id', userId);

      if (status) {
        receivedQuery = receivedQuery.eq('status', status);
      }

      const { data: receivedRequests, error: receivedError } = await receivedQuery
        .order('created_at', { ascending: false });

      if (receivedError) {
        throw this.handleSupabaseError(receivedError);
      }

      return {
        sent: (sentRequests || []) as ConnectionRequest[],
        received: (receivedRequests || []) as ConnectionRequest[],
      };
    } catch (error) {
      if (this.isConnectionRequestError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch connection requests: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // GET PENDING REQUESTS
  // ============================================================================

  /**
   * Get pending connection requests for a user
   * - Returns only received requests with pending status
   * - Used to display requests awaiting user action
   * 
   * @param userId User ID
   * @returns Array of pending connection requests
   * 
   * Requirements: 2.8
   */
  async getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw this.handleSupabaseError(error);
      }

      return (data || []) as ConnectionRequest[];
    } catch (error) {
      if (this.isConnectionRequestError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch pending requests: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate that user roles match the request type
   */
  private async validateRequestRoles(
    requestType: string,
    fromRole: string,
    toRole: string,
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    if (requestType === 'parent_child') {
      // Parent sending request to student
      if (fromRole !== 'parent') {
        throw this.createError('INVALID_ROLE', 'Only parents can send parent-child connection requests');
      }
      if (toRole !== 'student') {
        throw this.createError('INVALID_ROLE', 'Parent-child requests can only be sent to students');
      }
    } else if (requestType === 'teacher_school') {
      // Teacher sending request to school
      if (fromRole !== 'teacher') {
        throw this.createError('INVALID_ROLE', 'Only teachers can send teacher-school connection requests');
      }
      // Verify to_user_id is a school
      const { data: school, error } = await supabase
        .from('schools')
        .select('id')
        .eq('id', toUserId)
        .single();
      
      if (error || !school) {
        throw this.createError('INVALID_TARGET', 'Target must be a valid school');
      }
    } else if (requestType === 'student_school') {
      // School sending request to student
      // Verify from_user_id is a school
      const { data: school, error } = await supabase
        .from('schools')
        .select('id')
        .eq('id', fromUserId)
        .single();
      
      if (error || !school) {
        throw this.createError('INVALID_SENDER', 'Sender must be a valid school');
      }
      
      if (toRole !== 'student') {
        throw this.createError('INVALID_ROLE', 'Student-school requests can only be sent to students');
      }
    }
  }

  /**
   * Create a parent-child link
   */
  private async createParentChildLink(parentId: string, childId: string): Promise<void> {
    const { error } = await supabase
      .from('parent_child_links')
      .insert({
        parent_id: parentId,
        child_id: childId,
      });

    if (error) {
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Create a school membership
   */
  private async createSchoolMembership(
    schoolId: string,
    userId: string,
    role: 'teacher' | 'student'
  ): Promise<void> {
    const { error } = await supabase
      .from('school_memberships')
      .insert({
        school_id: schoolId,
        user_id: userId,
        role,
      });

    if (error) {
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Auto-link parents to school when student joins
   */
  private async autoLinkParentsToSchool(studentId: string, schoolId: string): Promise<void> {
    // Get all parents linked to this student
    const { data: parentLinks, error: linksError } = await supabase
      .from('parent_child_links')
      .select('parent_id')
      .eq('child_id', studentId);

    if (linksError || !parentLinks || parentLinks.length === 0) {
      return; // No parents to link
    }

    // Create school memberships for all parents
    const memberships = parentLinks.map(link => ({
      school_id: schoolId,
      user_id: link.parent_id,
      role: 'parent' as const,
    }));

    // Insert memberships (ignore duplicates)
    const { error: insertError } = await supabase
      .from('school_memberships')
      .upsert(memberships, { 
        onConflict: 'school_id,user_id',
        ignoreDuplicates: true 
      });

    if (insertError) {
      // Log error but don't throw - parent linking is not critical
      console.error('Failed to auto-link parents to school:', insertError);
    }
  }

  /**
   * Create a notification
   */
  private async createNotification(params: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || null,
        read: false,
      });

    if (error) {
      // Log error but don't throw - notification failure shouldn't block the main operation
      console.error('Failed to create notification:', error);
    }
  }

  /**
   * Create a ConnectionRequestError
   */
  private createError(code: string, message: string): ConnectionRequestError {
    return { code, message };
  }

  /**
   * Check if error is a ConnectionRequestError
   */
  private isConnectionRequestError(error: unknown): error is ConnectionRequestError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to ConnectionRequestError
   */
  private handleSupabaseError(error: { message: string; code?: string }): ConnectionRequestError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Resource not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to perform this action');
    }

    if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
      return this.createError('DUPLICATE', 'Connection or link already exists');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const connectionRequestService = new ConnectionRequestService();
