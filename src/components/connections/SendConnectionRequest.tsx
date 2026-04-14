/**
 * Send Connection Request Component
 * Form for sending connection requests to other users/schools
 * 
 * Requirements:
 * - 2.1: Create connection requests with pending status
 * - 2.5: Teacher-school connection requests
 * - 2.6: School-student connection requests
 * - 2.7: Validate connection request types
 */

import { useState } from 'react';
import { connectionRequestService } from '../../services/connection-request.service';
import { useAuth } from '../../hooks/useAuth';

type RequestType = 'parent_child' | 'teacher_school' | 'student_school';

export function SendConnectionRequest() {
  const { user, profile } = useAuth();
  const [targetId, setTargetId] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('parent_child');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAvailableRequestTypes = (): RequestType[] => {
    if (!profile) return [];

    switch (profile.role) {
      case 'parent':
        return ['parent_child'];
      case 'teacher':
        return ['teacher_school'];
      case 'student':
        return []; // Students don't send requests, they receive them
      case 'administrator':
        return ['parent_child', 'teacher_school', 'student_school'];
      default:
        return [];
    }
  };

  const getRequestTypeLabel = (type: RequestType): string => {
    switch (type) {
      case 'parent_child':
        return 'Parent-Child Connection';
      case 'teacher_school':
        return 'Teacher-School Connection';
      case 'student_school':
        return 'Student-School Connection';
    }
  };

  const getRequestTypeDescription = (type: RequestType): string => {
    switch (type) {
      case 'parent_child':
        return 'Connect with your child to monitor their progress';
      case 'teacher_school':
        return 'Join a school as a teacher';
      case 'student_school':
        return 'Invite a student to join your school';
    }
  };

  const getTargetIdLabel = (type: RequestType): string => {
    switch (type) {
      case 'parent_child':
        return 'Student ID';
      case 'teacher_school':
        return 'School ID';
      case 'student_school':
        return 'Student ID';
    }
  };

  const getTargetIdPlaceholder = (type: RequestType): string => {
    switch (type) {
      case 'parent_child':
        return 'Enter your child\'s user ID';
      case 'teacher_school':
        return 'Enter the school ID';
      case 'student_school':
        return 'Enter the student\'s user ID';
    }
  };

  const validateTargetId = (id: string): boolean => {
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('You must be logged in to send connection requests');
      return;
    }

    // Validate target ID
    if (!targetId.trim()) {
      setError('Please enter a target ID');
      return;
    }

    if (!validateTargetId(targetId)) {
      setError('Invalid ID format. Please enter a valid UUID.');
      return;
    }

    // Prevent self-connection
    if (targetId === user.id) {
      setError('You cannot send a connection request to yourself');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await connectionRequestService.createRequest({
        from_user_id: user.id,
        to_user_id: targetId,
        request_type: requestType,
        message: message.trim() || undefined,
      });

      setSuccess('Connection request sent successfully!');
      
      // Reset form
      setTargetId('');
      setMessage('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to send connection request:', err);
      setError(err.message || 'Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const availableTypes = getAvailableRequestTypes();

  if (availableTypes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          {profile?.role === 'student' 
            ? 'Students receive connection requests but cannot send them. Check your connection requests to accept invitations.'
            : 'You do not have permission to send connection requests.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Connection Request</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Type
          </label>
          <div className="space-y-2">
            {availableTypes.map((type) => (
              <label
                key={type}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  requestType === type
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="requestType"
                  value={type}
                  checked={requestType === type}
                  onChange={(e) => setRequestType(e.target.value as RequestType)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {getRequestTypeLabel(type)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getRequestTypeDescription(type)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Target ID Input */}
        <div>
          <label htmlFor="targetId" className="block text-sm font-medium text-gray-700 mb-2">
            {getTargetIdLabel(requestType)}
          </label>
          <input
            type="text"
            id="targetId"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder={getTargetIdPlaceholder(requestType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            The ID can be found in the user's or school's profile
          </p>
        </div>

        {/* Optional Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to your request..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {message.length}/500 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Sending Request...' : 'Send Connection Request'}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How to find IDs:</h3>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>User IDs can be found in user profiles</li>
          <li>School IDs can be found in school information pages</li>
          <li>Ask the person or school administrator for their ID</li>
        </ul>
      </div>
    </div>
  );
}
