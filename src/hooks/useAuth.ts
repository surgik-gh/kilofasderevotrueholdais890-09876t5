import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { authService } from '../services/auth.service';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for authentication operations with Zustand store integration
 */
export function useAuth() {
  const navigate = useNavigate();
  const {
    session,
    user,
    profile,
    setSession,
    setProfile,
    logout: storeLogout,
    setLoading,
    setError,
  } = useStore();

  // Initialize auth state from Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session, session?.user || null);
      
      if (session?.user) {
        // Fetch user profile
        loadProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session, session?.user || null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const profile = await authService.login({ email, password });
      setProfile(profile);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'teacher' | 'parent' | 'administrator';
    schoolId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      let profile;
      if (data.role === 'student') {
        if (!data.schoolId) throw new Error('School ID required for students');
        profile = await authService.registerStudent({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          schoolId: data.schoolId,
        });
      } else {
        profile = await authService.registerOtherRole({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: data.role,
        });
      }
      
      setProfile(profile);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      storeLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    profile,
    isAuthenticated: !!session && !!profile,
    isLoading: useStore((state) => state.isLoading),
    error: useStore((state) => state.error),
    login,
    register,
    logout,
  };
}
