// Comprehensive security middleware and utilities
// Implements defense-in-depth security measures

import type { Env } from './database';

// Security constants
const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  STRICT_RATE_LIMIT: 20, // For sensitive endpoints
  
  // Input validation
  MAX_INPUT_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 100,
  
  // JWT Security
  JWT_MIN_SECRET_LENGTH: 32,
  BCRYPT_ROUNDS: 12,
  
  // Session security
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_RENEWAL_THRESHOLD: 2 * 60 * 60 * 1000, // 2 hours
  MAX_CONCURRENT_SESSIONS: 5,
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
  
  // Security headers
  CSP_POLICY: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://workers.cloudflare.com https://*.cloudflare.com wss: https:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`,
  
  // IP blocking patterns
  BLOCKED_IP_PATTERNS: [
    /^127\.0\.0\.1$/, // Localhost (should not reach production)
    /^10\./, // Private network
    /^192\.168\./, // Private network
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private network
  ]
} as const;

// Input sanitization and validation
export class InputValidator {
  static sanitizeString(input: string, maxLength: number = SECURITY_CONFIG.MAX_INPUT_LENGTH): string {
    if (typeof input !== 'string') {
      throw new SecurityError('Input must be a string');
    }
    
    if (input.length > maxLength) {
      throw new SecurityError(`Input exceeds maximum length of ${maxLength} characters`);
    }
    
    // Remove null bytes and control characters (except allowed whitespace)
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  }
  
  static validateEmail(email: string): string {
    const sanitized = this.sanitizeString(email, SECURITY_CONFIG.MAX_EMAIL_LENGTH);
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitized)) {
      throw new SecurityError('Invalid email format');
    }
    
    return sanitized.toLowerCase();
  }
  
  static validateNumeric(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (typeof num !== 'number' || isNaN(num)) {
      throw new SecurityError('Invalid numeric value');
    }
    
    if (num < min || num > max) {
      throw new SecurityError(`Value must be between ${min} and ${max}`);
    }
    
    return num;
  }
  
  static validateSVGContent(svgContent: string): string {
    const sanitized = this.sanitizeString(svgContent, 100000); // 100KB limit
    
    // Basic SVG validation
    if (!sanitized.includes('<svg') || !sanitized.includes('</svg>')) {
      throw new SecurityError('Invalid SVG format');
    }
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /onload=/i,
      /onclick=/i,
      /onerror=/i,
      /<embed/i,
      /<object/i,
      /<iframe/i,
      /<meta/i,
      /<link/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        throw new SecurityError('SVG content contains potentially dangerous elements');
      }
    }
    
    return sanitized;
  }
  
  static validateProjectDescription(description: string): string {
    return this.sanitizeString(description, SECURITY_CONFIG.MAX_DESCRIPTION_LENGTH);
  }
  
  static validateFileName(fileName: string): string {
    const sanitized = this.sanitizeString(fileName, 255);
    
    // Check for path traversal attempts
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      throw new SecurityError('Invalid file name');
    }
    
    // Check for dangerous extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php'];
    const extension = sanitized.toLowerCase().substring(sanitized.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(extension)) {
      throw new SecurityError('File type not allowed');
    }
    
    return sanitized;
  }
}

// Rate limiting implementation
export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  
  static getInstance(): RateLimiter {
    if (!this.instance) {
      this.instance = new RateLimiter();
    }
    return this.instance;
  }
  
  isAllowed(key: string, limit: number = SECURITY_CONFIG.RATE_LIMIT_REQUESTS, windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (entry.count >= limit) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  getRemainingRequests(key: string, limit: number = SECURITY_CONFIG.RATE_LIMIT_REQUESTS): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }
  
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.resetTime;
  }
  
  clear(key?: string): void {
    if (key) {
      this.limits.delete(key);
    } else {
      this.limits.clear();
    }
  }
}

// SQL Injection prevention
export class SQLSafeQuery {
  static escapeString(value: string): string {
    if (typeof value !== 'string') {
      throw new SecurityError('Value must be a string');
    }
    
    return value.replace(/'/g, "''");
  }
  
  static validateTableName(tableName: string): string {
    const allowedTables = [
      'profiles', 'user_projects', 'project_revisions', 'templates',
      'blog_posts', 'user_sessions', 'download_analytics', 'usage_stats'
    ];
    
    if (!allowedTables.includes(tableName)) {
      throw new SecurityError('Invalid table name');
    }
    
    return tableName;
  }
  
  static validateColumnName(columnName: string): string {
    // Only allow alphanumeric characters and underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnName)) {
      throw new SecurityError('Invalid column name');
    }
    
    return columnName;
  }
  
  static buildWhereClause(conditions: Record<string, any>): { clause: string; values: any[] } {
    const clauses: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(conditions)) {
      const validKey = this.validateColumnName(key);
      clauses.push(`${validKey} = ?`);
      values.push(value);
    }
    
    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values
    };
  }
}

// Custom security error class
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

// CSRF Protection
export class CSRFProtection {
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  static validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken || token !== sessionToken) {
      return false;
    }
    return true;
  }
  
  static getTokenFromRequest(request: Request): string | null {
    // Try header first
    let token = request.headers.get('X-CSRF-Token');
    
    // If not in header, check if it's in form data
    if (!token) {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        // Would need to parse form data - simplified for now
        return null;
      }
    }
    
    return token;
  }
}

// Security headers utility
export class SecurityHeaders {
  static getSecurityHeaders(request: Request): Record<string, string> {
    const isProduction = process.env.NODE_ENV === 'production';
    const origin = request.headers.get('origin') || 'https://cutgluebuild.com';
    
    return {
      // Content Security Policy
      'Content-Security-Policy': SECURITY_CONFIG.CSP_POLICY,
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent content type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // HTTPS enforcement
      'Strict-Transport-Security': isProduction 
        ? 'max-age=31536000; includeSubDomains; preload'
        : 'max-age=3600',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      
      // CORS headers
      'Access-Control-Allow-Origin': isProduction ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      
      // Cache control for sensitive endpoints
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }
}

// IP-based security
export class IPSecurity {
  static isBlocked(ip: string): boolean {
    for (const pattern of SECURITY_CONFIG.BLOCKED_IP_PATTERNS) {
      if (pattern.test(ip)) {
        return true;
      }
    }
    return false;
  }
  
  static getClientIP(request: Request): string {
    // Check various headers for the real IP
    return (
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
      request.headers.get('X-Real-IP') ||
      request.headers.get('X-Client-IP') ||
      '0.0.0.0'
    );
  }
  
  static validateOrigin(request: Request, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return false;
    
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return origin === allowed || origin.endsWith('.' + allowed.replace('https://', ''));
    });
  }
}

// Comprehensive security middleware
export function createSecurityMiddleware(env: Env) {
  const rateLimiter = RateLimiter.getInstance();
  
  return async function securityMiddleware(
    request: Request,
    endpoint: string = 'general',
    isStrictEndpoint: boolean = false
  ): Promise<Response | null> {
    try {
      // Get client IP
      const clientIP = IPSecurity.getClientIP(request);
      
      // Check if IP is blocked
      if (IPSecurity.isBlocked(clientIP)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Rate limiting
      const rateLimit = isStrictEndpoint 
        ? SECURITY_CONFIG.STRICT_RATE_LIMIT 
        : SECURITY_CONFIG.RATE_LIMIT_REQUESTS;
      const rateLimitKey = `${clientIP}:${endpoint}`;
      
      if (!rateLimiter.isAllowed(rateLimitKey, rateLimit)) {
        const resetTime = rateLimiter.getResetTime(rateLimitKey);
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetTime: resetTime ? new Date(resetTime).toISOString() : null
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime ? Math.ceil(resetTime / 1000).toString() : '',
            'Retry-After': '900' // 15 minutes
          }
        });
      }
      
      // Origin validation for POST/PUT/DELETE requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const allowedOrigins = [
          'https://cutgluebuild.com',
          'https://www.cutgluebuild.com',
          ...(env.ENVIRONMENT === 'development' ? ['http://localhost:4321'] : [])
        ];
        
        if (!IPSecurity.validateOrigin(request, allowedOrigins)) {
          return new Response(JSON.stringify({ error: 'Invalid origin' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Content-Length validation
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: 'Request too large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Content-Type validation for POST requests
      if (request.method === 'POST') {
        const contentType = request.headers.get('content-type');
        if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
          return new Response(JSON.stringify({ error: 'Invalid content type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      return null; // No security issues, continue processing
      
    } catch (error) {
      console.error('Security middleware error:', error);
      return new Response(JSON.stringify({ error: 'Security validation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

// Environment security validation
export function validateEnvironmentSecurity(env: Env): void {
  const issues: string[] = [];
  
  // Check JWT secret strength
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < SECURITY_CONFIG.JWT_MIN_SECRET_LENGTH) {
    issues.push('JWT_SECRET is too weak or missing');
  }
  
  if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    issues.push('JWT_SECRET is using default value');
  }
  
  // Check refresh token secret
  const refreshSecret = env.JWT_REFRESH_SECRET;
  if (!refreshSecret || refreshSecret.length < SECURITY_CONFIG.JWT_MIN_SECRET_LENGTH) {
    issues.push('JWT_REFRESH_SECRET is too weak or missing');
  }
  
  // Check Stripe webhook secret
  if (!env.STRIPE_WEBHOOK_SECRET) {
    issues.push('STRIPE_WEBHOOK_SECRET is missing');
  }
  
  // Production-specific checks
  if (env.ENVIRONMENT === 'production') {
    if (env.DOMAIN !== 'cutgluebuild.com') {
      issues.push('Production domain configuration may be incorrect');
    }
    
    if (!env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
      issues.push('Production should use live Stripe keys');
    }
  }
  
  if (issues.length > 0) {
    const errorMessage = 'Security configuration issues detected:\n' + issues.map(issue => `- ${issue}`).join('\n');
    console.error(errorMessage);
    
    if (env.ENVIRONMENT === 'production') {
      throw new SecurityError('Critical security configuration issues in production');
    }
  }
}

// Export all security utilities
export {
  SECURITY_CONFIG,
  InputValidator,
  RateLimiter,
  SQLSafeQuery,
  CSRFProtection,
  SecurityHeaders,
  IPSecurity
};