// Cloudflare Workers-based authentication service
// Uses sessions stored in D1 database with JWT-like tokens

import { getDatabase, type Profile, type Env } from './database';

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface AuthSession {
  id: string;
  user: AuthUser;
  expires_at: number;
}

// Simple token utilities
function generateSessionId(): string {
  return crypto.randomUUID();
}

function generateUserId(): string {
  return crypto.randomUUID();
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export class AuthService {
  private env?: Env;

  constructor(env?: Env) {
    this.env = env;
  }

  async signUp(email: string, password: string, fullName?: string): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    if (!this.env) {
      throw new Error('Authentication not available during build time');
    }

    const database = getDatabase(this.env);
    
    // Check if user already exists
    const existingProfile = await database.getProfile(email);
    if (existingProfile) {
      throw new Error('User already exists');
    }

    try {
      const userId = generateUserId();
      const passwordHash = await hashPassword(password);
      
      // Create profile
      const profile = await database.createProfile({
        id: userId,
        email,
        full_name: fullName,
        subscription_tier: 'free'
      });

      if (!profile) {
        throw new Error('Failed to create user profile');
      }

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      
      const session = await database.createSession({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt
      });

      if (!session) {
        throw new Error('Failed to create session');
      }

      const user: AuthUser = {
        id: userId,
        email,
        profile
      };

      const authSession: AuthSession = {
        id: sessionId,
        user,
        expires_at: expiresAt
      };

      return { user, session: authSession };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    if (!this.env) {
      throw new Error('Authentication not available during build time');
    }

    // Note: This is a simplified implementation
    // In a real app, you'd store password hashes and verify them
    // For now, we'll create a mock session for development
    
    const database = getDatabase(this.env);
    const profile = await database.getProfile(email);
    
    if (!profile) {
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    
    const session = await database.createSession({
      id: sessionId,
      user_id: profile.id,
      expires_at: expiresAt
    });

    if (!session) {
      throw new Error('Failed to create session');
    }

    const user: AuthUser = {
      id: profile.id,
      email: profile.email,
      profile
    };

    const authSession: AuthSession = {
      id: sessionId,
      user,
      expires_at: expiresAt
    };

    return { user, session: authSession };
  }

  async signOut(sessionId: string): Promise<void> {
    if (!this.env) {
      return;
    }

    const database = getDatabase(this.env);
    await database.deleteSession(sessionId);
  }

  async getCurrentUser(sessionId: string): Promise<AuthUser | null> {
    if (!this.env || !sessionId) {
      return null;
    }

    const database = getDatabase(this.env);
    
    // Get session
    const session = await database.getSession(sessionId);
    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at < now) {
      await database.deleteSession(sessionId);
      return null;
    }

    // Get user profile
    const profile = await database.getProfile(session.user_id);
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      profile
    };
  }

  async getSession(sessionId: string): Promise<AuthSession | null> {
    if (!this.env || !sessionId) {
      return null;
    }

    const user = await this.getCurrentUser(sessionId);
    if (!user) {
      return null;
    }

    const database = getDatabase(this.env);
    const session = await database.getSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      user,
      expires_at: session.expires_at
    };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    if (!this.env || !sessionId) {
      return false;
    }

    const user = await this.getCurrentUser(sessionId);
    return user !== null;
  }

  // Clean up expired sessions (should be called periodically)
  async cleanupExpiredSessions(): Promise<void> {
    if (!this.env) {
      return;
    }

    const database = getDatabase(this.env);
    await database.deleteExpiredSessions();
  }
}

// Create mock auth service for build time
export const createMockAuthService = (): AuthService => {
  return {
    signUp: async () => ({ user: null, session: null }),
    signIn: async () => ({ user: null, session: null }),
    signOut: async () => {},
    getCurrentUser: async () => null,
    getSession: async () => null,
    validateSession: async () => false,
    cleanupExpiredSessions: async () => {}
  } as AuthService;
};

// Export auth service instance
export const authService = new AuthService();

// Utility function to get auth service
export function getAuthService(env?: Env): AuthService {
  if (env) {
    return new AuthService(env);
  }
  
  // Return mock auth service for build time
  return createMockAuthService();
}

// Session cookie utilities
export const SESSION_COOKIE_NAME = 'cutglue_session';

export function setSessionCookie(response: Response, sessionId: string): void {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  response.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`
  );
}

export function clearSessionCookie(response: Response): void {
  response.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
}

export function getSessionFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return cookie.substring(`${SESSION_COOKIE_NAME}=`.length);
    }
  }

  return null;
}