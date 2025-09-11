import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthUser, type AuthSession } from '../lib/auth';

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  sessionId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setSessionId: (sessionId: string | null) => void;
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
      sessionId: null,
      isLoading: false,
      isInitialized: false,

      // Actions
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setSessionId: (sessionId) => set({ sessionId }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user, session } = await authService.signIn(email, password);
          if (user && session) {
            set({ 
              user,
              session, 
              sessionId: session.id 
            });
            
            // Set session cookie
            document.cookie = `cutglue_session=${session.id}; Path=/; Max-Age=${30 * 24 * 60 * 60}; Secure; SameSite=Strict`;
          }
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
          const { user, session } = await authService.signUp(email, password, fullName);
          if (user && session) {
            set({ 
              user,
              session, 
              sessionId: session.id 
            });
            
            // Set session cookie
            document.cookie = `cutglue_session=${session.id}; Path=/; Max-Age=${30 * 24 * 60 * 60}; Secure; SameSite=Strict`;
          }
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
          const { sessionId } = get();
          if (sessionId) {
            await authService.signOut(sessionId);
          }
          
          // Clear session cookie
          document.cookie = 'cutglue_session=; Path=/; Max-Age=0';
          
          set({ 
            user: null, 
            session: null, 
            sessionId: null 
          });
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
          // Get session ID from cookie
          let sessionId = get().sessionId;
          
          if (!sessionId && typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const sessionCookie = cookies.find(c => c.trim().startsWith('cutglue_session='));
            if (sessionCookie) {
              sessionId = sessionCookie.split('=')[1];
              set({ sessionId });
            }
          }
          
          if (sessionId) {
            // Validate session and get user
            const user = await authService.getCurrentUser(sessionId);
            const session = await authService.getSession(sessionId);
            
            if (user && session) {
              set({ user, session });
            } else {
              // Invalid session, clear it
              set({ 
                user: null, 
                session: null, 
                sessionId: null 
              });
              if (typeof document !== 'undefined') {
                document.cookie = 'cutglue_session=; Path=/; Max-Age=0';
              }
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear any invalid state
          set({ 
            user: null, 
            session: null, 
            sessionId: null 
          });
          if (typeof document !== 'undefined') {
            document.cookie = 'cutglue_session=; Path=/; Max-Age=0';
          }
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      refreshUser: async () => {
        const { sessionId } = get();
        if (!sessionId) return;

        try {
          const user = await authService.getCurrentUser(sessionId);
          if (user) {
            set({ user });
          } else {
            // Session expired or invalid
            set({ 
              user: null, 
              session: null, 
              sessionId: null 
            });
            if (typeof document !== 'undefined') {
              document.cookie = 'cutglue_session=; Path=/; Max-Age=0';
            }
          }
        } catch (error) {
          console.error('Refresh user error:', error);
          // If refresh fails, user might be signed out
          set({ 
            user: null, 
            session: null, 
            sessionId: null 
          });
          if (typeof document !== 'undefined') {
            document.cookie = 'cutglue_session=; Path=/; Max-Age=0';
          }
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Persist user, session, and sessionId
        user: state.user,
        session: state.session,
        sessionId: state.sessionId
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
  return user?.profile?.subscription_tier || null;
};

export const useCanAccessFeature = (feature: string) => {
  const tier = useSubscriptionTier();
  if (!tier) return false;
  
  const featureAccess: Record<string, string[]> = {
    'ai_generation_unlimited': ['professional'],
    'premium_templates': ['professional'],
    'gcode_generation': ['professional'],
    'priority_support': ['starter', 'professional'],
    'commercial_license': ['starter', 'professional'],
    'api_access': ['professional'],
    'white_label': ['professional'],
    'phone_support': ['professional']
  };

  return featureAccess[feature]?.includes(tier) || false;
};

// Usage limits by tier
export const useUsageLimits = () => {
  const tier = useSubscriptionTier();
  
  if (!tier) {
    return {
      ai_designs: 0,
      templates: 0,
      exports: 0,
      duration_days: 0
    };
  }
  
  const limits = {
    starter: {
      ai_designs: 25,
      templates: 100,
      exports: 50,
      duration_days: -1 // unlimited
    },
    professional: {
      ai_designs: -1, // unlimited
      templates: -1, // unlimited
      exports: -1, // unlimited
      duration_days: -1 // unlimited
    }
  };

  return limits[tier as keyof typeof limits] || limits.starter;
};

// Initialize auth on app start
if (typeof window !== 'undefined') {
  // Use setTimeout to avoid executing during React hydration
  setTimeout(() => {
    useAuthStore.getState().initialize();
  }, 0);
}