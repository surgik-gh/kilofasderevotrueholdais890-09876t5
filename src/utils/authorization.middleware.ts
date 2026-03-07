/**
 * Authorization Middleware
 * Provides role-based access control and permission checking
 * Requirements: 14.7, 14.8
 */

import { supabase } from '../lib/supabase';

export type UserRole = 'student' | 'parent' | 'teacher' | 'administrator';

export interface AuthContext {
  userId: string;
  role: UserRole;
  email: string;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Gets the current authenticated user context
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      userId: user.id,
      role: profile.role as UserRole,
      email: user.email || ''
    };
  } catch (error) {
    console.error('Failed to get auth context:', error);
    return null;
  }
}

/**
 * Checks if user is authenticated
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    throw new Error('Authentication required');
  }

  return context;
}

/**
 * Checks if user has a specific role
 */
export async function requireRole(requiredRole: UserRole): Promise<AuthContext> {
  const context = await requireAuth();

  if (context.role !== requiredRole) {
    logUnauthorizedAccess(context.userId, `Required role: ${requiredRole}, actual: ${context.role}`);
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }

  return context;
}

/**
 * Checks if user has one of the specified roles
 */
export async function requireAnyRole(requiredRoles: UserRole[]): Promise<AuthContext> {
  const context = await requireAuth();

  if (!requiredRoles.includes(context.role)) {
    logUnauthorizedAccess(
      context.userId,
      `Required roles: ${requiredRoles.join(', ')}, actual: ${context.role}`
    );
    throw new Error(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
  }

  return context;
}

/**
 * Checks if user is an administrator
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole('administrator');
}

/**
 * Checks if user is a teacher
 */
export async function requireTeacher(): Promise<AuthContext> {
  return requireRole('teacher');
}

/**
 * Checks if user is a student
 */
export async function requireStudent(): Promise<AuthContext> {
  return requireRole('student');
}

/**
 * Checks if user is a parent
 */
export async function requireParent(): Promise<AuthContext> {
  return requireRole('parent');
}

/**
 * Checks if user can access another user's data
 */
export async function canAccessUserData(
  targetUserId: string
): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // User can always access their own data
  if (context.userId === targetUserId) {
    return { allowed: true };
  }

  // Administrators can access any user's data
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  // Parents can access their children's data
  if (context.role === 'parent') {
    const { data: link } = await supabase
      .from('parent_child_links')
      .select('id')
      .eq('parent_id', context.userId)
      .eq('child_id', targetUserId)
      .single();

    if (link) {
      return { allowed: true };
    }
  }

  // Teachers can access students in their schools
  if (context.role === 'teacher') {
    // Check if both are in the same school
    const { data: teacherSchools } = await supabase
      .from('school_memberships')
      .select('school_id')
      .eq('user_id', context.userId);

    const { data: studentSchools } = await supabase
      .from('school_memberships')
      .select('school_id')
      .eq('user_id', targetUserId);

    if (teacherSchools && studentSchools) {
      const teacherSchoolIds = teacherSchools.map(s => s.school_id);
      const studentSchoolIds = studentSchools.map(s => s.school_id);
      const hasCommonSchool = teacherSchoolIds.some(id => studentSchoolIds.includes(id));

      if (hasCommonSchool) {
        return { allowed: true };
      }
    }
  }

  logUnauthorizedAccess(context.userId, `Attempted to access user data: ${targetUserId}`);
  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Checks if user can modify another user's data
 */
export async function canModifyUserData(
  targetUserId: string
): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // User can modify their own data
  if (context.userId === targetUserId) {
    return { allowed: true };
  }

  // Only administrators can modify other users' data
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  logUnauthorizedAccess(context.userId, `Attempted to modify user data: ${targetUserId}`);
  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Checks if user can create content (lessons, quizzes)
 */
export async function canCreateContent(): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Teachers and administrators can create content
  if (context.role === 'teacher' || context.role === 'administrator') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Only teachers and administrators can create content' };
}

/**
 * Checks if user can moderate content
 */
export async function canModerateContent(): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Only administrators can moderate content
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Only administrators can moderate content' };
}

/**
 * Checks if user can manage schools
 */
export async function canManageSchools(): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Only administrators can manage schools
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Only administrators can manage schools' };
}

/**
 * Checks if user can manage connection requests
 */
export async function canManageConnectionRequest(
  requestId: string
): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Administrators can manage any connection request
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  // Get the connection request
  const { data: request } = await supabase
    .from('connection_requests')
    .select('from_user_id, to_user_id')
    .eq('id', requestId)
    .single();

  if (!request) {
    return { allowed: false, reason: 'Connection request not found' };
  }

  // User can manage requests they sent or received
  if (request.from_user_id === context.userId || request.to_user_id === context.userId) {
    return { allowed: true };
  }

  logUnauthorizedAccess(context.userId, `Attempted to manage connection request: ${requestId}`);
  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Checks if user can access AI chat session
 */
export async function canAccessChatSession(
  sessionId: string
): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Administrators can access any chat session
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  // Get the chat session
  const { data: session } = await supabase
    .from('ai_chat_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return { allowed: false, reason: 'Chat session not found' };
  }

  // User can only access their own chat sessions
  if (session.user_id === context.userId) {
    return { allowed: true };
  }

  logUnauthorizedAccess(context.userId, `Attempted to access chat session: ${sessionId}`);
  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Checks if user can access learning roadmap
 */
export async function canAccessRoadmap(
  roadmapId: string
): Promise<PermissionCheck> {
  const context = await getAuthContext();

  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Administrators can access any roadmap
  if (context.role === 'administrator') {
    return { allowed: true };
  }

  // Get the roadmap
  const { data: roadmap } = await supabase
    .from('learning_roadmaps')
    .select('student_id')
    .eq('id', roadmapId)
    .single();

  if (!roadmap) {
    return { allowed: false, reason: 'Roadmap not found' };
  }

  // Student can access their own roadmap
  if (roadmap.student_id === context.userId) {
    return { allowed: true };
  }

  // Parents can access their children's roadmaps
  if (context.role === 'parent') {
    const { data: link } = await supabase
      .from('parent_child_links')
      .select('id')
      .eq('parent_id', context.userId)
      .eq('child_id', roadmap.student_id)
      .single();

    if (link) {
      return { allowed: true };
    }
  }

  // Teachers can access roadmaps of students in their schools
  if (context.role === 'teacher') {
    const { data: teacherSchools } = await supabase
      .from('school_memberships')
      .select('school_id')
      .eq('user_id', context.userId);

    const { data: studentSchools } = await supabase
      .from('school_memberships')
      .select('school_id')
      .eq('user_id', roadmap.student_id);

    if (teacherSchools && studentSchools) {
      const teacherSchoolIds = teacherSchools.map(s => s.school_id);
      const studentSchoolIds = studentSchools.map(s => s.school_id);
      const hasCommonSchool = teacherSchoolIds.some(id => studentSchoolIds.includes(id));

      if (hasCommonSchool) {
        return { allowed: true };
      }
    }
  }

  logUnauthorizedAccess(context.userId, `Attempted to access roadmap: ${roadmapId}`);
  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Checks if user has sufficient wisdom coins
 */
export async function hasWisdomCoins(
  userId: string,
  requiredAmount: number
): Promise<PermissionCheck> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('wisdom_coins')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { allowed: false, reason: 'User profile not found' };
  }

  if (profile.wisdom_coins < requiredAmount) {
    return {
      allowed: false,
      reason: `Insufficient wisdom coins. Required: ${requiredAmount}, available: ${profile.wisdom_coins}`
    };
  }

  return { allowed: true };
}

/**
 * Logs unauthorized access attempts
 */
export function logUnauthorizedAccess(
  userId: string,
  details: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    details,
    severity: 'MEDIUM',
    type: 'UNAUTHORIZED_ACCESS_ATTEMPT'
  };

  console.warn('[SECURITY] Unauthorized Access Attempt:', logEntry);

  // In production, send to security monitoring service
}

/**
 * Authorization middleware wrapper
 */
export function withAuthorization<T extends any[], R>(
  checkFunction: () => Promise<PermissionCheck>,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const check = await checkFunction();

    if (!check.allowed) {
      throw new Error(check.reason || 'Unauthorized');
    }

    return handler(...args);
  };
}

/**
 * Role-based middleware wrapper
 */
export function withRole<T extends any[], R>(
  requiredRole: UserRole | UserRole[],
  handler: (context: AuthContext, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const context = Array.isArray(requiredRole)
      ? await requireAnyRole(requiredRole)
      : await requireRole(requiredRole);

    return handler(context, ...args);
  };
}

// Export authorization utilities
export const Authorization = {
  getAuthContext,
  requireAuth,
  requireRole,
  requireAnyRole,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireParent,
  canAccessUserData,
  canModifyUserData,
  canCreateContent,
  canModerateContent,
  canManageSchools,
  canManageConnectionRequest,
  canAccessChatSession,
  canAccessRoadmap,
  hasWisdomCoins,
  logUnauthorizedAccess,
  withAuthorization,
  withRole
};
