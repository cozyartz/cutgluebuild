// Enhanced Cloudflare Workers-based authentication service
// Uses JWT tokens and proper password hashing

import { getDatabase, type Profile, type Env } from './database';
import { createJWTManager, createPasswordManager, type JWTPayload, type TokenPair } from './jwt';

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface AuthSession {
  id: string;
  user: AuthUser;
  tokens: TokenPair;
  expires_at: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Simple token utilities
function generateSessionId(): string {
  return crypto.randomUUID();
}

function generateUserId(): string {
  return crypto.randomUUID();
}

export class AuthService {
  private env?: Env;
  private jwtManager?: any;
  private passwordManager?: any;

  constructor(env?: Env) {
    this.env = env;
    if (env) {
      this.jwtManager = createJWTManager(env);
      this.passwordManager = createPasswordManager();
    }
  }

  async signUp(email: string, password: string, fullName?: string): Promise<{ user: AuthUser | null; session: AuthSession | null; tokens: AuthTokens | null }> {
    if (!this.env || !this.jwtManager || !this.passwordManager) {
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
      const passwordHash = await this.passwordManager.hashPassword(password);
      
      // Create profile with password hash
      const profile = await database.createProfile({
        id: userId,
        email,
        full_name: fullName,
        subscription_tier: 'free',
        password_hash: passwordHash
      });

      if (!profile) {
        throw new Error('Failed to create user profile');
      }

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      
      // Create JWT tokens
      const tokens = await this.jwtManager.createTokenPair(userId, email, sessionId);
      
      const session = await database.createSession({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt,
        refresh_token: tokens.refreshToken
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
        tokens,
        expires_at: expiresAt
      };

      const authTokens: AuthTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      };

      return { user, session: authSession, tokens: authTokens };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; session: AuthSession | null; tokens: AuthTokens | null }> {
    if (!this.env || !this.jwtManager || !this.passwordManager) {
      throw new Error('Authentication not available during build time');
    }

    const database = getDatabase(this.env);
    const profile = await database.getProfile(email);
    
    if (!profile || !profile.password_hash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.passwordManager.verifyPassword(password, profile.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    
    // Create JWT tokens
    const tokens = await this.jwtManager.createTokenPair(profile.id, email, sessionId);
    
    const session = await database.createSession({
      id: sessionId,
      user_id: profile.id,
      expires_at: expiresAt,
      refresh_token: tokens.refreshToken
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
      tokens,
      expires_at: expiresAt
    };

    const authTokens: AuthTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 15 * 60 // 15 minutes
    };

    return { user, session: authSession, tokens: authTokens };
  }

  async signOut(sessionId: string): Promise<void> {
    if (!this.env) {
      return;
    }

    const database = getDatabase(this.env);
    await database.deleteSession(sessionId);
  }

  async getCurrentUserFromToken(accessToken: string): Promise<AuthUser | null> {
    if (!this.env || !this.jwtManager) {
      return null;
    }

    const payload = await this.jwtManager.verifyToken(accessToken, 'access');
    if (!payload) {
      return null;
    }

    const database = getDatabase(this.env);
    const profile = await database.getProfile(payload.email);
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      profile
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
    if (!this.env || !this.jwtManager) {
      return null;
    }

    const payload = await this.jwtManager.verifyToken(refreshToken, 'refresh');
    if (!payload) {
      return null;
    }

    // Verify session still exists
    const database = getDatabase(this.env);
    const session = await database.getSession(payload.sessionId);
    if (!session || session.refresh_token !== refreshToken) {
      return null;
    }

    // Create new access token
    const newAccessToken = await this.jwtManager.createAccessToken(
      payload.sub,
      payload.email,
      payload.sessionId
    );

    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Keep the same refresh token
      expiresIn: 15 * 60 // 15 minutes
    };
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