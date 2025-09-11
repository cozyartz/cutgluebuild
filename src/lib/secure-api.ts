// Secure API wrapper with comprehensive security measures
// Wraps all API endpoints with security middleware

import type { APIRoute, APIContext } from 'astro';
import type { Env } from './database';
import { createSecurityMiddleware, SecurityHeaders, InputValidator, SecurityError, validateEnvironmentSecurity } from './security';
import { createSecureDatabaseService } from './secure-database';
import { getAuthService, getSessionFromRequest } from './auth';

// Enhanced API context with security features
export interface SecureAPIContext extends APIContext {
  secureDb: ReturnType<typeof createSecureDatabaseService>;
  currentUser?: {
    id: string;
    email: string;
    profile?: any;
  };
  clientIP: string;
}

// Security middleware options
export interface SecurityOptions {
  requireAuth?: boolean;
  requireSubscription?: ('free' | 'starter' | 'maker' | 'pro')[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  strictEndpoint?: boolean;
  csrfProtection?: boolean;
  allowedMethods?: string[];
  allowedContentTypes?: string[];
}

// Default security options
const DEFAULT_SECURITY_OPTIONS: SecurityOptions = {
  requireAuth: false,
  strictEndpoint: false,
  csrfProtection: false,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedContentTypes: ['application/json', 'multipart/form-data']
};

// Secure API wrapper function
export function createSecureAPI(
  handler: (context: SecureAPIContext) => Promise<Response>,
  options: SecurityOptions = {}
): APIRoute {
  const securityOptions = { ...DEFAULT_SECURITY_OPTIONS, ...options };
  
  return async (context: APIContext): Promise<Response> => {
    const { request, locals } = context;
    const env = (locals as any)?.runtime?.env as Env;
    
    try {
      // Validate environment security in production
      if (env?.ENVIRONMENT === 'production') {
        validateEnvironmentSecurity(env);
      }
      
      if (!env) {
        console.error('Environment not available in API context');
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Apply security middleware
      const securityMiddleware = createSecurityMiddleware(env);
      const endpointName = context.request.url.split('/').pop() || 'unknown';
      const securityCheck = await securityMiddleware(
        request, 
        endpointName, 
        securityOptions.strictEndpoint
      );
      
      if (securityCheck) {
        return securityCheck; // Security check failed
      }

      // Method validation
      if (securityOptions.allowedMethods && !securityOptions.allowedMethods.includes(request.method)) {
        return createSecureErrorResponse('Method not allowed', 405, request);
      }

      // Content type validation for non-GET requests
      if (request.method !== 'GET' && request.method !== 'DELETE') {
        const contentType = request.headers.get('content-type') || '';
        const isValidContentType = securityOptions.allowedContentTypes?.some(type => 
          contentType.includes(type)
        );
        
        if (!isValidContentType) {
          return createSecureErrorResponse('Invalid content type', 400, request);
        }
      }

      // Authentication check
      let currentUser = undefined;
      if (securityOptions.requireAuth) {
        const sessionId = getSessionFromRequest(request);
        if (!sessionId) {
          return createSecureErrorResponse('Authentication required', 401, request);
        }

        const authService = getAuthService(env);
        currentUser = await authService.getCurrentUser(sessionId);
        if (!currentUser) {
          return createSecureErrorResponse('Invalid session', 401, request);
        }

        // Subscription tier check
        if (securityOptions.requireSubscription && currentUser.profile) {
          const userTier = currentUser.profile.subscription_tier || 'free';
          if (!securityOptions.requireSubscription.includes(userTier)) {
            return createSecureErrorResponse('Insufficient subscription tier', 403, request);
          }
        }
      }

      // Create secure database service
      const secureDb = createSecureDatabaseService(env);

      // Get client IP for logging
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 
                      '0.0.0.0';

      // Create enhanced context
      const secureContext: SecureAPIContext = {
        ...context,
        secureDb,
        currentUser,
        clientIP
      };

      // Execute the actual handler
      const response = await handler(secureContext);

      // Add security headers to response
      const securityHeaders = SecurityHeaders.getSecurityHeaders(request);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      console.error('Secure API error:', error);
      
      // Log security events
      if (error instanceof SecurityError) {
        console.warn('Security violation detected:', {
          error: error.message,
          url: request.url,
          method: request.method,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('CF-Connecting-IP') || 'unknown'
        });
      }

      return createSecureErrorResponse(
        error instanceof SecurityError ? error.message : 'Internal server error',
        error instanceof SecurityError ? 400 : 500,
        request
      );
    }
  };
}

// Create secure error response with proper headers
function createSecureErrorResponse(message: string, status: number, request: Request): Response {
  const securityHeaders = SecurityHeaders.getSecurityHeaders(request);
  
  return new Response(JSON.stringify({ 
    error: message,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders
    }
  });
}

// Secure request body parser with validation
export async function parseSecureRequestBody(request: Request, maxSize: number = 10000): Promise<any> {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const text = await request.text();
      
      if (text.length > maxSize) {
        throw new SecurityError('Request body too large');
      }
      
      // Parse JSON and validate
      const data = JSON.parse(text);
      
      // Basic JSON structure validation
      if (data && typeof data === 'object') {
        return sanitizeObject(data);
      }
      
      return data;
    }
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const data: Record<string, any> = {};
      
      for (const [key, value] of formData.entries()) {
        const sanitizedKey = InputValidator.sanitizeString(key, 100);
        
        if (value instanceof File) {
          // File validation will be handled separately
          data[sanitizedKey] = value;
        } else {
          data[sanitizedKey] = InputValidator.sanitizeString(value.toString(), 10000);
        }
      }
      
      return data;
    }
    
    throw new SecurityError('Unsupported content type');
    
  } catch (error) {
    if (error instanceof SecurityError) {
      throw error;
    }
    throw new SecurityError('Invalid request body');
  }
}

// Recursively sanitize object properties
function sanitizeObject(obj: any, depth: number = 0): any {
  if (depth > 10) { // Prevent deep object attacks
    throw new SecurityError('Object nesting too deep');
  }
  
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > 1000) { // Prevent large array attacks
      throw new SecurityError('Array too large');
    }
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  const sanitized: Record<string, any> = {};
  let propertyCount = 0;
  
  for (const [key, value] of Object.entries(obj)) {
    if (propertyCount >= 100) { // Prevent object property spam
      throw new SecurityError('Too many object properties');
    }
    
    const sanitizedKey = InputValidator.sanitizeString(key, 100);
    sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
    propertyCount++;
  }
  
  return sanitized;
}

// File upload security validator
export function validateFileUpload(file: File, allowedTypes?: string[], maxSize?: number): void {
  const allowedMimeTypes = allowedTypes || [
    'image/svg+xml',
    'image/png', 
    'image/jpeg',
    'image/webp',
    'application/pdf'
  ];
  
  const maxFileSize = maxSize || 10 * 1024 * 1024; // 10MB default
  
  // Validate file type
  if (!allowedMimeTypes.includes(file.type)) {
    throw new SecurityError(`File type ${file.type} not allowed`);
  }
  
  // Validate file size
  if (file.size > maxFileSize) {
    throw new SecurityError(`File size ${file.size} exceeds limit of ${maxFileSize} bytes`);
  }
  
  // Validate file name
  const fileName = InputValidator.validateFileName(file.name);
  
  // Additional file content validation could be added here
  // For example, checking file headers to ensure they match the MIME type
}

// Secure response helper with automatic sanitization
export function createSecureResponse(
  data: any, 
  status: number = 200, 
  request: Request,
  additionalHeaders: Record<string, string> = {}
): Response {
  const securityHeaders = SecurityHeaders.getSecurityHeaders(request);
  
  // Sanitize response data to prevent XSS
  const sanitizedData = sanitizeResponseData(data);
  
  return new Response(JSON.stringify(sanitizedData), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders,
      ...additionalHeaders
    }
  });
}

// Sanitize response data to prevent XSS and data leaks
function sanitizeResponseData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    // Remove potentially dangerous content
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/vbscript:/gi, '')
               .replace(/data:text\/html/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive fields from responses
      const sensitiveFields = ['password', 'password_hash', 'refresh_token', 'secret', 'private_key'];
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        continue; // Skip sensitive fields
      }
      
      sanitized[key] = sanitizeResponseData(value);
    }
    
    return sanitized;
  }
  
  return data;
}

// Export security utilities for use in handlers
export { SecurityError, InputValidator };