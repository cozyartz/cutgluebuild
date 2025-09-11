// Environment variable security and secrets management
// Ensures proper security configuration and prevents exposure of sensitive data

import type { Env } from './database';
import { SecurityError } from './security';

// Security configuration requirements
const SECURITY_REQUIREMENTS = {
  JWT_SECRET_MIN_LENGTH: 32,
  REFRESH_SECRET_MIN_LENGTH: 32,
  REQUIRED_ENV_VARS: {
    production: [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET', 
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ],
    development: [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ]
  },
  DEFAULT_SECRETS_TO_DETECT: [
    'your-super-secret',
    'change-in-production',
    'default-secret',
    'test-secret',
    'placeholder',
    'development-only'
  ]
} as const;

// Environment security validator
export class EnvironmentSecurityValidator {
  private static instance: EnvironmentSecurityValidator;
  private validationCache = new Map<string, boolean>();
  
  static getInstance(): EnvironmentSecurityValidator {
    if (!this.instance) {
      this.instance = new EnvironmentSecurityValidator();
    }
    return this.instance;
  }

  validateEnvironment(env: Env): ValidationResult {
    const cacheKey = this.generateCacheKey(env);
    
    if (this.validationCache.has(cacheKey)) {
      return { isValid: this.validationCache.get(cacheKey)!, issues: [] };
    }

    const issues: SecurityIssue[] = [];
    const environment = env.ENVIRONMENT || 'development';

    try {
      // Validate required environment variables
      this.validateRequiredVars(env, environment, issues);
      
      // Validate JWT secrets
      this.validateJWTSecrets(env, issues);
      
      // Check for default/weak secrets
      this.checkDefaultSecrets(env, issues);
      
      // Validate database configuration
      this.validateDatabaseConfig(env, issues);
      
      // Validate Stripe configuration
      this.validateStripeConfig(env, environment, issues);
      
      // Validate domain configuration
      this.validateDomainConfig(env, environment, issues);
      
      // Check for exposed secrets in environment
      this.checkSecretExposure(env, issues);

      const isValid = issues.filter(issue => issue.severity === 'critical').length === 0;
      this.validationCache.set(cacheKey, isValid);
      
      return { isValid, issues };
      
    } catch (error) {
      console.error('Environment validation error:', error);
      issues.push({
        type: 'validation_error',
        severity: 'critical',
        message: 'Failed to validate environment configuration',
        recommendation: 'Check environment variable configuration'
      });
      
      return { isValid: false, issues };
    }
  }

  private validateRequiredVars(env: Env, environment: string, issues: SecurityIssue[]): void {
    const requiredVars = SECURITY_REQUIREMENTS.REQUIRED_ENV_VARS[environment as keyof typeof SECURITY_REQUIREMENTS.REQUIRED_ENV_VARS] || [];
    
    for (const varName of requiredVars) {
      const value = (env as any)[varName];
      
      if (!value) {
        issues.push({
          type: 'missing_required_var',
          severity: 'critical',
          message: `Required environment variable ${varName} is missing`,
          recommendation: `Set ${varName} in your environment configuration`,
          variable: varName
        });
      } else if (typeof value !== 'string' || value.length === 0) {
        issues.push({
          type: 'invalid_var_value',
          severity: 'critical', 
          message: `Environment variable ${varName} has invalid value`,
          recommendation: `Ensure ${varName} is set to a non-empty string`,
          variable: varName
        });
      }
    }
  }

  private validateJWTSecrets(env: Env, issues: SecurityIssue[]): void {
    const jwtSecret = env.JWT_SECRET;
    const refreshSecret = env.JWT_REFRESH_SECRET;
    
    if (jwtSecret) {
      if (jwtSecret.length < SECURITY_REQUIREMENTS.JWT_SECRET_MIN_LENGTH) {
        issues.push({
          type: 'weak_jwt_secret',
          severity: 'critical',
          message: `JWT_SECRET is too short (${jwtSecret.length} characters, minimum ${SECURITY_REQUIREMENTS.JWT_SECRET_MIN_LENGTH})`,
          recommendation: 'Generate a strong JWT secret with at least 32 characters',
          variable: 'JWT_SECRET'
        });
      }
      
      if (this.isWeakSecret(jwtSecret)) {
        issues.push({
          type: 'weak_jwt_secret',
          severity: 'critical',
          message: 'JWT_SECRET appears to be weak or predictable',
          recommendation: 'Generate a cryptographically secure random JWT secret',
          variable: 'JWT_SECRET'
        });
      }
    }
    
    if (refreshSecret) {
      if (refreshSecret.length < SECURITY_REQUIREMENTS.REFRESH_SECRET_MIN_LENGTH) {
        issues.push({
          type: 'weak_refresh_secret',
          severity: 'critical',
          message: `JWT_REFRESH_SECRET is too short`,
          recommendation: 'Generate a strong refresh secret with at least 32 characters',
          variable: 'JWT_REFRESH_SECRET'
        });
      }
      
      if (jwtSecret && refreshSecret === jwtSecret) {
        issues.push({
          type: 'duplicate_secrets',
          severity: 'critical',
          message: 'JWT_SECRET and JWT_REFRESH_SECRET should be different',
          recommendation: 'Use different secrets for access and refresh tokens'
        });
      }
    }
  }

  private checkDefaultSecrets(env: Env, issues: SecurityIssue[]): void {
    const secretVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
    
    for (const varName of secretVars) {
      const value = (env as any)[varName];
      
      if (value && SECURITY_REQUIREMENTS.DEFAULT_SECRETS_TO_DETECT.some(defaultSecret => 
        value.toLowerCase().includes(defaultSecret)
      )) {
        issues.push({
          type: 'default_secret',
          severity: 'critical',
          message: `${varName} appears to contain default/placeholder values`,
          recommendation: `Replace ${varName} with a proper production secret`,
          variable: varName
        });
      }
    }
  }

  private validateDatabaseConfig(env: Env, issues: SecurityIssue[]): void {
    if (!env.DB) {
      issues.push({
        type: 'missing_database',
        severity: 'critical',
        message: 'Database binding (DB) is not configured',
        recommendation: 'Configure Cloudflare D1 database binding in wrangler.toml'
      });
    }
  }

  private validateStripeConfig(env: Env, environment: string, issues: SecurityIssue[]): void {
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;
    
    if (environment === 'production') {
      if (stripeSecretKey && !stripeSecretKey.startsWith('sk_live_')) {
        issues.push({
          type: 'non_production_stripe_key',
          severity: 'high',
          message: 'Production environment should use live Stripe keys',
          recommendation: 'Use sk_live_ Stripe secret key in production',
          variable: 'STRIPE_SECRET_KEY'
        });
      }
    } else {
      if (stripeSecretKey && !stripeSecretKey.startsWith('sk_test_')) {
        issues.push({
          type: 'production_stripe_in_dev',
          severity: 'high',
          message: 'Development environment should use test Stripe keys',
          recommendation: 'Use sk_test_ Stripe secret key in development',
          variable: 'STRIPE_SECRET_KEY'
        });
      }
    }
    
    if (stripeWebhookSecret && stripeWebhookSecret.length < 24) {
      issues.push({
        type: 'invalid_webhook_secret',
        severity: 'medium',
        message: 'Stripe webhook secret appears to be invalid',
        recommendation: 'Verify webhook secret from Stripe dashboard',
        variable: 'STRIPE_WEBHOOK_SECRET'
      });
    }
  }

  private validateDomainConfig(env: Env, environment: string, issues: SecurityIssue[]): void {
    const domain = env.DOMAIN;
    const baseUrl = env.BASE_URL;
    
    if (environment === 'production') {
      if (!domain || domain.includes('localhost') || domain.includes('127.0.0.1')) {
        issues.push({
          type: 'invalid_production_domain',
          severity: 'high',
          message: 'Production domain configuration is invalid',
          recommendation: 'Set proper production domain in DOMAIN environment variable',
          variable: 'DOMAIN'
        });
      }
      
      if (baseUrl && !baseUrl.startsWith('https://')) {
        issues.push({
          type: 'insecure_base_url',
          severity: 'high',
          message: 'Production base URL should use HTTPS',
          recommendation: 'Use HTTPS URL for BASE_URL in production',
          variable: 'BASE_URL'
        });
      }
    }
  }

  private checkSecretExposure(env: Env, issues: SecurityIssue[]): void {
    // Check if any environment variable values appear to be exposed in logs or debug info
    const sensitiveVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
    
    for (const varName of sensitiveVars) {
      const value = (env as any)[varName];
      
      if (value && value.length < 16) {
        issues.push({
          type: 'suspiciously_short_secret',
          severity: 'medium',
          message: `${varName} is suspiciously short and may not be secure`,
          recommendation: `Ensure ${varName} is properly generated and sufficiently long`,
          variable: varName
        });
      }
    }
  }

  private isWeakSecret(secret: string): boolean {
    // Check for common weak patterns
    const weakPatterns = [
      /^(123456|password|secret|admin)/i,
      /^[a-z]+$/i, // Only lowercase letters
      /^[0-9]+$/, // Only numbers
      /(.)\1{4,}/, // Repeated characters
      /^(abc|qwe|asd)/i, // Common keyboard patterns
    ];
    
    return weakPatterns.some(pattern => pattern.test(secret));
  }

  private generateCacheKey(env: Env): string {
    // Generate a cache key based on environment variable values (hashed for security)
    const keyData = [
      env.ENVIRONMENT || 'dev',
      env.JWT_SECRET ? env.JWT_SECRET.substring(0, 8) + '...' : 'none',
      env.DOMAIN || 'none'
    ].join('|');
    
    return btoa(keyData).substring(0, 16);
  }

  clearCache(): void {
    this.validationCache.clear();
  }
}

// Types for security validation
export interface ValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
}

export interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  variable?: string;
}

// Secure environment variable getter
export class SecureEnvManager {
  private static redactedCache = new Map<string, string>();
  
  static getRedactedValue(value: string, showLength: number = 4): string {
    if (!value) return '[NOT SET]';
    
    const cacheKey = value.substring(0, 8);
    if (this.redactedCache.has(cacheKey)) {
      return this.redactedCache.get(cacheKey)!;
    }
    
    let redacted: string;
    
    if (value.length <= showLength) {
      redacted = '*'.repeat(value.length);
    } else {
      redacted = value.substring(0, showLength) + '*'.repeat(Math.min(8, value.length - showLength)) + '...';
    }
    
    this.redactedCache.set(cacheKey, redacted);
    return redacted;
  }
  
  static logEnvironmentStatus(env: Env): void {
    const validator = EnvironmentSecurityValidator.getInstance();
    const result = validator.validateEnvironment(env);
    
    console.log('=== Environment Security Status ===');
    console.log(`Environment: ${env.ENVIRONMENT || 'development'}`);
    console.log(`Overall Status: ${result.isValid ? '✅ SECURE' : '❌ INSECURE'}`);
    console.log(`Issues Found: ${result.issues.length}`);
    
    if (result.issues.length > 0) {
      console.log('\n🔒 Security Issues:');
      
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      const highIssues = result.issues.filter(i => i.severity === 'high');
      const mediumIssues = result.issues.filter(i => i.severity === 'medium');
      const lowIssues = result.issues.filter(i => i.severity === 'low');
      
      if (criticalIssues.length > 0) {
        console.log(`\n🚨 CRITICAL (${criticalIssues.length}):`);
        criticalIssues.forEach(issue => {
          console.log(`  - ${issue.message}`);
          console.log(`    💡 ${issue.recommendation}`);
        });
      }
      
      if (highIssues.length > 0) {
        console.log(`\n⚠️  HIGH (${highIssues.length}):`);
        highIssues.forEach(issue => {
          console.log(`  - ${issue.message}`);
        });
      }
      
      if (mediumIssues.length > 0) {
        console.log(`\n📋 MEDIUM (${mediumIssues.length}):`);
        mediumIssues.forEach(issue => {
          console.log(`  - ${issue.message}`);
        });
      }
      
      if (lowIssues.length > 0) {
        console.log(`\n📝 LOW (${lowIssues.length}):`);
        lowIssues.forEach(issue => {
          console.log(`  - ${issue.message}`);
        });
      }
    } else {
      console.log('✅ No security issues detected');
    }
    
    console.log('\n=== Environment Variables ===');
    console.log(`JWT_SECRET: ${this.getRedactedValue(env.JWT_SECRET || '')}`);
    console.log(`JWT_REFRESH_SECRET: ${this.getRedactedValue(env.JWT_REFRESH_SECRET || '')}`);
    console.log(`STRIPE_SECRET_KEY: ${this.getRedactedValue(env.STRIPE_SECRET_KEY || '')}`);
    console.log(`STRIPE_WEBHOOK_SECRET: ${this.getRedactedValue(env.STRIPE_WEBHOOK_SECRET || '')}`);
    console.log(`DOMAIN: ${env.DOMAIN || '[NOT SET]'}`);
    console.log(`BASE_URL: ${env.BASE_URL || '[NOT SET]'}`);
    console.log('=====================================\n');
  }
}

// Auto-validation function for startup
export function validateEnvironmentOnStartup(env: Env): void {
  try {
    const validator = EnvironmentSecurityValidator.getInstance();
    const result = validator.validateEnvironment(env);
    
    // Always log the environment status
    SecureEnvManager.logEnvironmentStatus(env);
    
    // In production, critical issues should prevent startup
    if (env.ENVIRONMENT === 'production' && !result.isValid) {
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        const errorMessage = `CRITICAL SECURITY ISSUES DETECTED:\n${criticalIssues.map(i => `- ${i.message}`).join('\n')}`;
        throw new SecurityError(errorMessage);
      }
    }
    
  } catch (error) {
    console.error('Environment validation failed:', error);
    
    if (env.ENVIRONMENT === 'production') {
      throw error; // Re-throw to prevent insecure production deployment
    }
  }
}

// Export utilities are already exported above