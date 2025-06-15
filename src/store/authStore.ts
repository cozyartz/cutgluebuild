import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthUser } from '../lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,

      // Actions
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user, session } = await authService.signIn(email, password);
          set({ user: user as AuthUser, session });
        } catch (error) {
          console.error('Sign in error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true });
        try {
          await authService.signUp(email, password, fullName);
          // Note: User will be set when email is confirmed
        } catch (error) {
          console.error('Sign up error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
          set({ user: null, session: null });
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
          // Get current session
          const session = await authService.getSession();
          
          if (session?.user) {
            // Get full user profile
            const user = await authService.getCurrentUser();
            set({ user, session });
          }

          // Listen for auth changes
          authService.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (session?.user) {
              const user = await authService.getCurrentUser();
              set({ user, session });
            } else {
              set({ user: null, session: null });
            }
          });

        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      refreshUser: async () => {
        try {
          const user = await authService.getCurrentUser();
          set({ user });
        } catch (error) {
          console.error('Refresh user error:', error);
          // If refresh fails, user might be signed out
          set({ user: null, session: null });
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist user and session, not loading states
        user: state.user,
        session: state.session
      })
    }
  )
);

// Selectors for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

// Helper hooks
export const useSubscriptionTier = () => {
  const user = useUser();
  return user?.profile?.subscription_tier || 'free';
};

export const useCanAccessFeature = (feature: string) => {
  const tier = useSubscriptionTier();
  
  const featureAccess: Record<string, string[]> = {
    'premium_templates': ['maker', 'pro'],
    'unlimited_ai': ['pro'],
    'priority_support': ['maker', 'pro'],
    'api_access': ['pro'],
    'white_label': ['pro']
  };

  return featureAccess[feature]?.includes(tier) || false;
};

// Initialize auth on app start
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}