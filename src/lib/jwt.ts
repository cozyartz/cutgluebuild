// JWT Authentication utilities for Cloudflare Workers
// Uses Web Crypto API for HMAC signing

import type { Env } from './database';

export interface JWTPayload {
  sub: string; // user id
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JWTManager {
  private readonly algorithm = 'HS256';
  private readonly issuer = 'cutgluebuild';
  private readonly audience = 'cutgluebuild-app';
  
  // Access token expires in 15 minutes
  private readonly accessTokenTTL = 15 * 60; // 15 minutes
  // Refresh token expires in 30 days
  private readonly refreshTokenTTL = 30 * 24 * 60 * 60; // 30 days

  constructor(private env: Env) {}

  private async getSecretKey(keyName: string): Promise<CryptoKey> {
    const secret = keyName === 'access' 
      ? this.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      : this.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  private base64UrlEncode(data: ArrayBuffer): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(str: string): ArrayBuffer {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async createAccessToken(userId: string, email: string, sessionId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: userId,
      email,
      sessionId,
      iat: now,
      exp: now + this.accessTokenTTL,
      iss: this.issuer,
      aud: this.audience
    };

    return this.signToken(payload, 'access');
  }

  async createRefreshToken(userId: string, email: string, sessionId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: userId,
      email,
      sessionId,
      iat: now,
      exp: now + this.refreshTokenTTL,
      iss: this.issuer,
      aud: this.audience
    };

    return this.signToken(payload, 'refresh');
  }

  async createTokenPair(userId: string, email: string, sessionId: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(userId, email, sessionId),
      this.createRefreshToken(userId, email, sessionId)
    ]);

    return { accessToken, refreshToken };
  }

  private async signToken(payload: JWTPayload, keyType: 'access' | 'refresh'): Promise<string> {
    const header = {
      alg: this.algorithm,
      typ: 'JWT'
    };

    const encoder = new TextEncoder();
    const headerB64 = this.base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const payloadB64 = this.base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    
    const data = `${headerB64}.${payloadB64}`;
    const key = await this.getSecretKey(keyType);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureB64 = this.base64UrlEncode(signature);

    return `${data}.${signatureB64}`;
  }

  async verifyToken(token: string, keyType: 'access' | 'refresh' = 'access'): Promise<JWTPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // Verify signature
      const data = `${headerB64}.${payloadB64}`;
      const encoder = new TextEncoder();
      const key = await this.getSecretKey(keyType);
      const signature = this.base64UrlDecode(signatureB64);
      
      const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
      if (!isValid) {
        return null;
      }

      // Decode and validate payload
      const payloadJson = new TextDecoder().decode(this.base64UrlDecode(payloadB64));
      const payload: JWTPayload = JSON.parse(payloadJson);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      // Check issuer and audience
      if (payload.iss !== this.issuer || payload.aud !== this.audience) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    if (!payload) {
      return null;
    }

    // Create new access token with same user info
    return this.createAccessToken(payload.sub, payload.email, payload.sessionId);
  }

  extractTokenFromAuthHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  getTokenExpiry(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payloadJson = new TextDecoder().decode(this.base64UrlDecode(parts[1]));
      const payload: JWTPayload = JSON.parse(payloadJson);
      return payload.exp;
    } catch {
      return null;
    }
  }
}

export { JWTManager };

// Password hashing utilities using Web Crypto API
export class PasswordManager {
  private readonly saltLength = 16;
  private readonly iterations = 100000;

  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // Derive key using PBKDF2
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 32 bytes
    );
    
    // Combine salt and hash
    const combined = new Uint8Array(this.saltLength + 32);
    combined.set(salt);
    combined.set(new Uint8Array(derivedKey), this.saltLength);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      
      // Decode the stored hash
      const combined = new Uint8Array(
        atob(hash).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract salt and hash
      const salt = combined.slice(0, this.saltLength);
      const storedHash = combined.slice(this.saltLength);
      
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      // Derive key using same parameters
      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );
      
      // Compare hashes
      const derivedArray = new Uint8Array(derivedKey);
      if (derivedArray.length !== storedHash.length) {
        return false;
      }
      
      // Constant-time comparison
      let result = 0;
      for (let i = 0; i < derivedArray.length; i++) {
        result |= derivedArray[i] ^ storedHash[i];
      }
      
      return result === 0;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

// Export factory functions
export function createJWTManager(env: Env): JWTManager {
  return new JWTManager(env);
}

export function createPasswordManager(): PasswordManager {
  return new PasswordManager();
}
