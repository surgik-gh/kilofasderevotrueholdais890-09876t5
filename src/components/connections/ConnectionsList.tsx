/**
 * Connections List Component
 * Displays established connections for the current user
 * 
 * Requirements:
 * - 2.4: Display permanent parent-child links
 * - 2.9: Display connections for parents (children)
 * - 2.10: Display connections for teachers/students (schools)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserConnection {
  id: string;
  full_name: string;
  email: string;
  role: string;
  connection_type: 'child' | 'parent' | 'school' | 'teacher' | 'student';
  created_at: string;
}

interface SchoolConnection {
  id: string;
  name: string;
  address?: string;
  connection_type: 'school';
  role_in_school: 'teacher' | 'student' | 'parent';
  created_at: string;
}

type Connection = UserConnection | SchoolConnection;

export function ConnectionsList() {
  const { user, profile } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConnections();
    }
  }, [user?.id]);

  const loadConnections = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const allConnections: Connection[] = [];

      const effectiveRole = profile?.role;
      if (!effectiveRole) {
        setConnections([]);
        return;
      }

      // Load connections based on user role
      if (effectiveRole === 'parent') {
        // Load children
        const { data: childLinks, error: childError } = await supabase
          .from('parent_child_links')
          .select('child_id, created_at')
          .eq('parent_id', user.id);

        if (childError) throw childError;

        if (childLinks && childLinks.length > 0) {
          const childIds = childLinks.map(link => link.child_id);
          const { data: children, error: childrenError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, role')
            .in('id', childIds);

          if (childrenError) throw childrenError;

          if (children) {
            allConnections.push(
              ...children.map(child => {
                const link = childLinks.find(l => l.child_id === child.id);
                return {
                  ...child,
                  connection_type: 'child' as const,
                  created_at: link?.created_at || new Date().toISOString(),
                };
              })
            );
          }
        }

        // Load schools (through children)
        const { data: schoolMemberships, error: schoolError } = await supabase
          .from('school_memberships')
          .select('school_id, role, created_at')
          .eq('user_id', user.id);

        if (schoolError) throw schoolError;

        if (schoolMemberships && schoolMemberships.length > 0) {
          const schoolIds = schoolMemberships.map(m => m.school_id);
          const { data: schools, error: schoolsError } = await supabase
            .from('schools')
            .select('id, name, address')
            .in('id', schoolIds);

          if (schoolsError) throw schoolsError;

          if (schools) {
            allConnections.push(
              ...schools.map(school => {
                const membership = schoolMemberships.find(m => m.school_id === school.id);
                return {
                  ...school,
                  connection_type: 'school' as const,
                  role_in_school: membership?.role || 'parent' as const,
                  created_at: membership?.created_at || new Date().toISOString(),
                };
              })
            );
          }
        }
      } else if (effectiveRole === 'student') {
        // Load parents
        const { data: parentLinks, error: parentError } = await supabase
          .from('parent_child_links')
          .select('parent_id, created_at')
          .eq('child_id', user.id);

        if (parentError) throw parentError;

        if (parentLinks && parentLinks.length > 0) {
          const parentIds = parentLinks.map(link => link.parent_id);
          const { data: parents, error: parentsError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, role')
            .in('id', parentIds);

          if (parentsError) throw parentsError;

          if (parents) {
            allConnections.push(
              ...parents.map(parent => {
                const link = parentLinks.find(l => l.parent_id === parent.id);
                return {
                  ...parent,
                  connection_type: 'parent' as const,
                  created_at: link?.created_at || new Date().toISOString(),
                };
              })
            );
          }
        }

        // Load schools
        const { data: schoolMemberships, error: schoolError } = await supabase
          .from('school_memberships')
          .select('school_id, role, created_at')
          .eq('user_id', user.id);

        if (schoolError) throw schoolError;

        if (schoolMemberships && schoolMemberships.length > 0) {
          const schoolIds = schoolMemberships.map(m => m.school_id);
          const { data: schools, error: schoolsError } = await supabase
            .from('schools')
            .select('id, name, address')
            .in('id', schoolIds);

          if (schoolsError) throw schoolsError;

          if (schools) {
            allConnections.push(
              ...schools.map(school => {
                const membership = schoolMemberships.find(m => m.school_id === school.id);
                return {
                  ...school,
                  connection_type: 'school' as const,
                  role_in_school: membership?.role || 'student' as const,
                  created_at: membership?.created_at || new Date().toISOString(),
                };
              })
            );
          }
        }
      } else if (effectiveRole === 'teacher') {
        // Load schools
        const { data: schoolMemberships, error: schoolError } = await supabase
          .from('school_memberships')
          .select('school_id, role, created_at')
          .eq('user_id', user.id);

        if (schoolError) throw schoolError;

        if (schoolMemberships && schoolMemberships.length > 0) {
          const schoolIds = schoolMemberships.map(m => m.school_id);
          const { data: schools, error: schoolsError } = await supabase
            .from('schools')
            .select('id, name, address')
            .in('id', schoolIds);

          if (schoolsError) throw schoolsError;

          if (schools) {
            allConnections.push(
              ...schools.map(school => {
                const membership = schoolMemberships.find(m => m.school_id === school.id);
                return {
                  ...school,
                  connection_type: 'school' as const,
                  role_in_school: membership?.role || 'teacher' as const,
                  created_at: membership?.created_at || new Date().toISOString(),
                };
              })
            );
          }
        }
      }

      setConnections(allConnections);
    } catch (err) {
      console.error('Failed to load connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'child':
        return (
          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'parent':
        return (
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'school':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  const getConnectionLabel = (type: string) => {
    switch (type) {
      case 'child':
        return 'Child';
      case 'parent':
        return 'Parent';
      case 'school':
        return 'School';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      default:
        return type;
    }
  };

  const isUserConnection = (conn: Connection): conn is UserConnection => {
    return 'email' in conn;
  };

  const isSchoolConnection = (conn: Connection): conn is SchoolConnection => {
    return 'name' in conn && !('email' in conn);
  };

  const canUnlink = (connection: Connection): boolean => {
    // Parent-child links cannot be unlinked by regular users
    if (connection.connection_type === 'parent' || connection.connection_type === 'child') {
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">My Connections</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {connections.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No connections yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Send connection requests to start building your network.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getConnectionIcon(connection.connection_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {getConnectionLabel(connection.connection_type)}
                    </span>
                    {!canUnlink(connection) && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Permanent
                      </span>
                    )}
                  </div>

                  {isUserConnection(connection) && (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {connection.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {connection.email}
                      </p>
                    </>
                  )}

                  {isSchoolConnection(connection) && (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {connection.name}
                      </p>
                      {connection.address && (
                        <p className="text-xs text-gray-500 truncate">
                          {connection.address}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-1 capitalize">
                        Role: {connection.role_in_school}
                      </p>
                    </>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Connected: {new Date(connection.created_at).toLocaleDateString()}
                  </p>

                  {!canUnlink(connection) && (
                    <p className="text-xs text-yellow-700 mt-2 italic">
                      This connection cannot be removed without administrator approval
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box for parent-child connections */}
      {connections.some(c => c.connection_type === 'parent' || c.connection_type === 'child') && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-900">About Parent-Child Connections</h3>
              <p className="text-xs text-yellow-800 mt-1">
                Parent-child connections are permanent and cannot be removed by users. 
                This ensures continuous monitoring and safety. Contact an administrator if you need to modify these connections.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
