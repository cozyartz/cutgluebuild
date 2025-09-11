// Secure database wrapper with SQL injection prevention
// Extends the existing database service with comprehensive security measures

import { getDatabase, type Env, type Profile, type UserProject, type Template } from './database';
import { SQLSafeQuery, InputValidator, SecurityError } from './security';

export class SecureDatabaseService {
  private db: ReturnType<typeof getDatabase>;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = getDatabase(env);
  }

  // Secure profile operations
  async createProfile(profileData: Partial<Profile>): Promise<Profile | null> {
    try {
      // Validate and sanitize input
      if (!profileData.email) {
        throw new SecurityError('Email is required');
      }

      const sanitizedData = {
        id: profileData.id || crypto.randomUUID(),
        email: InputValidator.validateEmail(profileData.email),
        full_name: profileData.full_name ? InputValidator.sanitizeString(profileData.full_name, 100) : undefined,
        avatar_url: profileData.avatar_url ? InputValidator.sanitizeString(profileData.avatar_url, 500) : undefined,
        subscription_tier: this.validateSubscriptionTier(profileData.subscription_tier),
        stripe_customer_id: profileData.stripe_customer_id ? InputValidator.sanitizeString(profileData.stripe_customer_id, 100) : undefined,
        password_hash: profileData.password_hash,
        tenant_id: profileData.tenant_id ? InputValidator.sanitizeString(profileData.tenant_id, 100) : undefined
      };

      return await this.db.createProfile(sanitizedData);
    } catch (error) {
      console.error('Secure profile creation error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Profile creation failed');
    }
  }

  async getProfileById(userId: string): Promise<Profile | null> {
    try {
      const sanitizedUserId = InputValidator.sanitizeString(userId, 50);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedUserId)) {
        throw new SecurityError('Invalid user ID format');
      }

      return await this.db.getProfile(sanitizedUserId);
    } catch (error) {
      console.error('Secure profile retrieval error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return null;
    }
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    try {
      const sanitizedEmail = InputValidator.validateEmail(email);
      return await this.db.getProfile(sanitizedEmail);
    } catch (error) {
      console.error('Secure profile retrieval by email error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const sanitizedUserId = InputValidator.sanitizeString(userId, 50);
      
      // Validate user ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedUserId)) {
        throw new SecurityError('Invalid user ID format');
      }

      // Sanitize and validate updates
      const sanitizedUpdates: Partial<Profile> = {};
      
      if (updates.email !== undefined) {
        sanitizedUpdates.email = InputValidator.validateEmail(updates.email);
      }
      
      if (updates.full_name !== undefined) {
        sanitizedUpdates.full_name = updates.full_name ? InputValidator.sanitizeString(updates.full_name, 100) : null;
      }
      
      if (updates.avatar_url !== undefined) {
        sanitizedUpdates.avatar_url = updates.avatar_url ? InputValidator.sanitizeString(updates.avatar_url, 500) : null;
      }
      
      if (updates.subscription_tier !== undefined) {
        sanitizedUpdates.subscription_tier = this.validateSubscriptionTier(updates.subscription_tier);
      }

      return await this.db.updateProfile(sanitizedUserId, sanitizedUpdates);
    } catch (error) {
      console.error('Secure profile update error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Profile update failed');
    }
  }

  // Secure project operations
  async createProject(projectData: Partial<UserProject>): Promise<UserProject | null> {
    try {
      if (!projectData.user_id || !projectData.title) {
        throw new SecurityError('User ID and title are required');
      }

      const sanitizedData = {
        id: projectData.id || crypto.randomUUID(),
        user_id: InputValidator.sanitizeString(projectData.user_id, 50),
        title: InputValidator.sanitizeString(projectData.title, 200),
        description: projectData.description ? InputValidator.validateProjectDescription(projectData.description) : undefined,
        svg_data: projectData.svg_data ? InputValidator.validateSVGContent(projectData.svg_data) : undefined,
        project_type: this.validateProjectType(projectData.project_type),
        metadata: projectData.metadata ? this.sanitizeJSON(projectData.metadata) : undefined,
        current_revision_id: projectData.current_revision_id ? InputValidator.sanitizeString(projectData.current_revision_id, 50) : undefined,
        canvas_settings: projectData.canvas_settings ? this.sanitizeJSON(projectData.canvas_settings) : undefined
      };

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedData.user_id)) {
        throw new SecurityError('Invalid user ID format');
      }

      return await this.db.createProject(sanitizedData);
    } catch (error) {
      console.error('Secure project creation error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Project creation failed');
    }
  }

  async getUserProjects(userId: string, limit: number = 50, offset: number = 0): Promise<UserProject[]> {
    try {
      const sanitizedUserId = InputValidator.sanitizeString(userId, 50);
      const validatedLimit = InputValidator.validateNumeric(limit, 1, 100);
      const validatedOffset = InputValidator.validateNumeric(offset, 0, 10000);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedUserId)) {
        throw new SecurityError('Invalid user ID format');
      }

      return await this.db.getUserProjects(sanitizedUserId, validatedLimit, validatedOffset);
    } catch (error) {
      console.error('Secure project retrieval error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return [];
    }
  }

  async getProjectById(projectId: string, userId?: string): Promise<UserProject | null> {
    try {
      const sanitizedProjectId = InputValidator.sanitizeString(projectId, 50);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedProjectId)) {
        throw new SecurityError('Invalid project ID format');
      }

      const project = await this.db.getProject(sanitizedProjectId);
      
      // If userId is provided, ensure the project belongs to the user
      if (userId && project && project.user_id !== userId) {
        throw new SecurityError('Access denied: Project does not belong to user');
      }

      return project;
    } catch (error) {
      console.error('Secure project retrieval error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return null;
    }
  }

  async updateProject(projectId: string, userId: string, updates: Partial<UserProject>): Promise<UserProject | null> {
    try {
      const sanitizedProjectId = InputValidator.sanitizeString(projectId, 50);
      const sanitizedUserId = InputValidator.sanitizeString(userId, 50);

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedProjectId) || !uuidRegex.test(sanitizedUserId)) {
        throw new SecurityError('Invalid ID format');
      }

      // First verify the project belongs to the user
      const existingProject = await this.db.getProject(sanitizedProjectId);
      if (!existingProject || existingProject.user_id !== sanitizedUserId) {
        throw new SecurityError('Access denied: Project does not belong to user');
      }

      // Sanitize updates
      const sanitizedUpdates: Partial<UserProject> = {};
      
      if (updates.title !== undefined) {
        sanitizedUpdates.title = InputValidator.sanitizeString(updates.title, 200);
      }
      
      if (updates.description !== undefined) {
        sanitizedUpdates.description = updates.description ? InputValidator.validateProjectDescription(updates.description) : null;
      }
      
      if (updates.svg_data !== undefined) {
        sanitizedUpdates.svg_data = updates.svg_data ? InputValidator.validateSVGContent(updates.svg_data) : null;
      }
      
      if (updates.project_type !== undefined) {
        sanitizedUpdates.project_type = this.validateProjectType(updates.project_type);
      }
      
      if (updates.metadata !== undefined) {
        sanitizedUpdates.metadata = updates.metadata ? this.sanitizeJSON(updates.metadata) : null;
      }
      
      if (updates.canvas_settings !== undefined) {
        sanitizedUpdates.canvas_settings = updates.canvas_settings ? this.sanitizeJSON(updates.canvas_settings) : null;
      }

      return await this.db.updateProject(sanitizedProjectId, sanitizedUpdates);
    } catch (error) {
      console.error('Secure project update error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Project update failed');
    }
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    try {
      const sanitizedProjectId = InputValidator.sanitizeString(projectId, 50);
      const sanitizedUserId = InputValidator.sanitizeString(userId, 50);

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedProjectId) || !uuidRegex.test(sanitizedUserId)) {
        throw new SecurityError('Invalid ID format');
      }

      // First verify the project belongs to the user
      const existingProject = await this.db.getProject(sanitizedProjectId);
      if (!existingProject || existingProject.user_id !== sanitizedUserId) {
        throw new SecurityError('Access denied: Project does not belong to user');
      }

      return await this.db.deleteProject(sanitizedProjectId);
    } catch (error) {
      console.error('Secure project deletion error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return false;
    }
  }

  // Secure template operations
  async getTemplates(category?: string, limit: number = 50, offset: number = 0): Promise<Template[]> {
    try {
      const validatedLimit = InputValidator.validateNumeric(limit, 1, 100);
      const validatedOffset = InputValidator.validateNumeric(offset, 0, 10000);
      const sanitizedCategory = category ? InputValidator.sanitizeString(category, 50) : undefined;

      return await this.db.getTemplates(sanitizedCategory, validatedLimit, validatedOffset);
    } catch (error) {
      console.error('Secure template retrieval error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return [];
    }
  }

  async getTemplateById(templateId: string): Promise<Template | null> {
    try {
      const sanitizedTemplateId = InputValidator.sanitizeString(templateId, 50);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedTemplateId)) {
        throw new SecurityError('Invalid template ID format');
      }

      return await this.db.getTemplate(sanitizedTemplateId);
    } catch (error) {
      console.error('Secure template retrieval error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return null;
    }
  }

  // Secure session operations
  async createSession(sessionData: any): Promise<any> {
    try {
      if (!sessionData.user_id || !sessionData.id) {
        throw new SecurityError('User ID and session ID are required');
      }

      const sanitizedData = {
        id: InputValidator.sanitizeString(sessionData.id, 50),
        user_id: InputValidator.sanitizeString(sessionData.user_id, 50),
        expires_at: InputValidator.validateNumeric(sessionData.expires_at),
        refresh_token: sessionData.refresh_token ? InputValidator.sanitizeString(sessionData.refresh_token, 1000) : undefined
      };

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedData.id) || !uuidRegex.test(sanitizedData.user_id)) {
        throw new SecurityError('Invalid ID format');
      }

      return await this.db.createSession(sanitizedData);
    } catch (error) {
      console.error('Secure session creation error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Session creation failed');
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const sanitizedSessionId = InputValidator.sanitizeString(sessionId, 50);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedSessionId)) {
        throw new SecurityError('Invalid session ID format');
      }

      return await this.db.getSession(sanitizedSessionId);
    } catch (error) {
      console.error('Secure session retrieval error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sanitizedSessionId = InputValidator.sanitizeString(sessionId, 50);
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedSessionId)) {
        throw new SecurityError('Invalid session ID format');
      }

      return await this.db.deleteSession(sanitizedSessionId);
    } catch (error) {
      console.error('Secure session deletion error:', error);
      if (error instanceof SecurityError) {
        throw error;
      }
      return false;
    }
  }

  // Private helper methods
  private validateSubscriptionTier(tier: any): 'free' | 'starter' | 'maker' | 'pro' {
    const validTiers = ['free', 'starter', 'maker', 'pro'];
    if (!tier || !validTiers.includes(tier)) {
      return 'free';
    }
    return tier as 'free' | 'starter' | 'maker' | 'pro';
  }

  private validateProjectType(type: any): 'svg_generated' | 'upload_vectorized' | 'project_idea' {
    const validTypes = ['svg_generated', 'upload_vectorized', 'project_idea'];
    if (!type || !validTypes.includes(type)) {
      throw new SecurityError('Invalid project type');
    }
    return type as 'svg_generated' | 'upload_vectorized' | 'project_idea';
  }

  private sanitizeJSON(jsonString: string): string {
    try {
      const sanitized = InputValidator.sanitizeString(jsonString, 10000);
      
      // Validate JSON syntax
      const parsed = JSON.parse(sanitized);
      
      // Re-serialize to ensure clean JSON
      return JSON.stringify(parsed);
    } catch (error) {
      throw new SecurityError('Invalid JSON data');
    }
  }

  // Advanced security operations
  async logSecurityEvent(event: {
    type: string;
    userId?: string;
    ip: string;
    userAgent?: string;
    details?: string;
  }): Promise<void> {
    try {
      const sanitizedEvent = {
        type: InputValidator.sanitizeString(event.type, 50),
        userId: event.userId ? InputValidator.sanitizeString(event.userId, 50) : null,
        ip: InputValidator.sanitizeString(event.ip, 45), // IPv6 max length
        userAgent: event.userAgent ? InputValidator.sanitizeString(event.userAgent, 500) : null,
        details: event.details ? InputValidator.sanitizeString(event.details, 1000) : null,
        timestamp: new Date().toISOString()
      };

      // Log to database security events table (if implemented)
      console.warn('Security Event:', sanitizedEvent);
      
      // In production, you might want to send this to a security monitoring service
      // await this.db.logSecurityEvent(sanitizedEvent);
    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }

  async checkUserAccess(userId: string, resourceId: string, resourceType: string): Promise<boolean> {
    try {
      const sanitizedUserId = InputValidator.sanitizeString(userId, 50);
      const sanitizedResourceId = InputValidator.sanitizeString(resourceId, 50);
      const sanitizedResourceType = InputValidator.sanitizeString(resourceType, 50);

      // Validate UUID formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sanitizedUserId) || !uuidRegex.test(sanitizedResourceId)) {
        return false;
      }

      switch (sanitizedResourceType) {
        case 'project':
          const project = await this.db.getProject(sanitizedResourceId);
          return project?.user_id === sanitizedUserId;
        
        case 'profile':
          return sanitizedResourceId === sanitizedUserId;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Access check error:', error);
      return false;
    }
  }
}

// Factory function for secure database service
export function createSecureDatabaseService(env: Env): SecureDatabaseService {
  return new SecureDatabaseService(env);
}