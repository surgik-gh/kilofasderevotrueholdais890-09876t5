/**
 * Connection Request List Component
 * Displays incoming connection requests with accept/reject actions
 * 
 * Requirements:
 * - 2.2: Accept/reject connection requests
 * - 2.8: Display connection requests to recipients
 */

import { useState, useEffect } from 'react';
import { connectionRequestService } from '../../services/connection-request.service';
import type { ConnectionRequest } from '../../types/platform';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ConnectionRequestWithUser extends ConnectionRequest {
  from_user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export function ConnectionRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'parent_child' | 'teacher_school' | 'student_school'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get pending requests for current user
      const pendingRequests = await connectionRequestService.getPendingRequests(user.id);

      // Fetch sender information for each request
      const requestsWithUsers = await Promise.all(
        pendingRequests.map(async (request) => {
          const { data: fromUser } = await supabase
            .from('user_profiles')
            .select('full_name, email, role')
            .eq('id', request.from_user_id)
            .single();

          return {
            ...request,
            from_user: fromUser || undefined,
          };
        })
      );

      setRequests(requestsWithUsers);
    } catch (err) {
      console.error('Failed to load connection requests:', err);
      setError('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!user?.id) return;

    try {
      setProcessingId(requestId);
      setError(null);

      await connectionRequestService.acceptRequest(requestId, user.id);

      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to accept request:', err);
      setError('Failed to accept connection request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id) return;

    try {
      setProcessingId(requestId);
      setError(null);

      await connectionRequestService.rejectRequest(requestId, user.id);

      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
      setError('Failed to reject connection request');
    } finally {
      setProcessingId(null);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'parent_child':
        return 'Parent-Child Connection';
      case 'teacher_school':
        return 'Teacher-School Connection';
      case 'student_school':
        return 'Student-School Connection';
      default:
        return type;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'parent_child':
        return 'bg-purple-100 text-purple-800';
      case 'teacher_school':
        return 'bg-blue-100 text-blue-800';
      case 'student_school':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.request_type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Connection Requests</h2>
        
        {/* Filter buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('parent_child')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'parent_child'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Parent-Child
          </button>
          <button
            onClick={() => setFilter('teacher_school')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'teacher_school'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Teacher-School
          </button>
          <button
            onClick={() => setFilter('student_school')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === 'student_school'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Student-School
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No connection requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'You have no pending connection requests.'
              : `You have no pending ${getRequestTypeLabel(filter).toLowerCase()} requests.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestTypeColor(request.request_type)}`}>
                      {getRequestTypeLabel(request.request_type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      From: {request.from_user?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.from_user?.email}
                    </p>
                    {request.from_user?.role && (
                      <p className="text-xs text-gray-500 capitalize">
                        Role: {request.from_user.role}
                      </p>
                    )}
                  </div>

                  {request.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <p className="font-medium text-xs text-gray-500 mb-1">Message:</p>
                      {request.message}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {processingId === request.id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {processingId === request.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
