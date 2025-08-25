// Cloudflare D1 database client
// Replaces the previous Supabase integration

export interface Env {
  DB: D1Database;
  AI: any; // Cloudflare AI binding
  ENVIRONMENT?: string;
}

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: 'free' | 'starter' | 'maker' | 'pro';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string; // JSON string
  materials: string; // JSON string
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  svg_data: string;
  preview_url?: string;
  is_premium: boolean;
  download_count: number;
  created_at: string;
}

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  svg_data?: string;
  project_type: 'svg_generated' | 'upload_vectorized' | 'project_idea';
  metadata?: string; // JSON string
  current_revision_id?: string;
  canvas_settings?: string; // JSON string
  created_at: string;
}

export interface ProjectRevision {
  id: string;
  project_id: string;
  revision_number: number;
  svg_data: string;
  changes_description?: string;
  metadata?: string; // JSON string
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string; // JSON string
  published: boolean;
  featured_image?: string;
  reading_time: number;
  published_at?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: string;
}

// Database service class
export class DatabaseService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Profile operations
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          INSERT INTO profiles (id, email, full_name, avatar_url, subscription_tier, stripe_customer_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(profile.id, profile.email, profile.full_name, profile.avatar_url, profile.subscription_tier || 'free', profile.stripe_customer_id, now, now)
        .first<Profile>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  async getProfile(id: string): Promise<Profile | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM profiles WHERE id = ?')
        .bind(id)
        .first<Profile>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          UPDATE profiles 
          SET full_name = COALESCE(?, full_name),
              avatar_url = COALESCE(?, avatar_url),
              subscription_tier = COALESCE(?, subscription_tier),
              stripe_customer_id = COALESCE(?, stripe_customer_id),
              updated_at = ?
          WHERE id = ?
          RETURNING *
        `)
        .bind(updates.full_name, updates.avatar_url, updates.subscription_tier, updates.stripe_customer_id, now, id)
        .first<Profile>();
      
      return result || null;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  // Template operations
  async getTemplates(category?: string, isPremium?: boolean): Promise<Template[]> {
    try {
      let query = 'SELECT * FROM templates WHERE 1=1';
      const params: any[] = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (isPremium !== undefined) {
        query += ' AND is_premium = ?';
        params.push(isPremium ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all<Template>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async getTemplate(id: string): Promise<Template | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM templates WHERE id = ?')
        .bind(id)
        .first<Template>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  async incrementTemplateDownloads(id: string): Promise<boolean> {
    try {
      await this.db
        .prepare('UPDATE templates SET download_count = download_count + 1 WHERE id = ?')
        .bind(id)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error incrementing template downloads:', error);
      return false;
    }
  }

  // User project operations
  async createUserProject(project: Omit<UserProject, 'created_at'>): Promise<UserProject | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          INSERT INTO user_projects (id, user_id, title, description, svg_data, project_type, metadata, current_revision_id, canvas_settings, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(project.id, project.user_id, project.title, project.description, project.svg_data, project.project_type, project.metadata, project.current_revision_id, project.canvas_settings, now)
        .first<UserProject>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating user project:', error);
      return null;
    }
  }

  async getUserProjects(userId: string): Promise<UserProject[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM user_projects WHERE user_id = ? ORDER BY created_at DESC')
        .bind(userId)
        .all<UserProject>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  async getUserProject(id: string, userId: string): Promise<UserProject | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM user_projects WHERE id = ? AND user_id = ?')
        .bind(id, userId)
        .first<UserProject>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting user project:', error);
      return null;
    }
  }

  async updateUserProject(id: string, userId: string, updates: Partial<UserProject>): Promise<UserProject | null> {
    try {
      const result = await this.db
        .prepare(`
          UPDATE user_projects 
          SET title = COALESCE(?, title),
              description = COALESCE(?, description),
              svg_data = COALESCE(?, svg_data),
              metadata = COALESCE(?, metadata),
              current_revision_id = COALESCE(?, current_revision_id),
              canvas_settings = COALESCE(?, canvas_settings)
          WHERE id = ? AND user_id = ?
          RETURNING *
        `)
        .bind(updates.title, updates.description, updates.svg_data, updates.metadata, updates.current_revision_id, updates.canvas_settings, id, userId)
        .first<UserProject>();
      
      return result || null;
    } catch (error) {
      console.error('Error updating user project:', error);
      return null;
    }
  }

  async deleteUserProject(id: string, userId: string): Promise<boolean> {
    try {
      await this.db
        .prepare('DELETE FROM user_projects WHERE id = ? AND user_id = ?')
        .bind(id, userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting user project:', error);
      return false;
    }
  }

  // Project revision operations
  async createProjectRevision(revision: Omit<ProjectRevision, 'created_at'>): Promise<ProjectRevision | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          INSERT INTO project_revisions (id, project_id, revision_number, svg_data, changes_description, metadata, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(revision.id, revision.project_id, revision.revision_number, revision.svg_data, revision.changes_description, revision.metadata, now)
        .first<ProjectRevision>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating project revision:', error);
      return null;
    }
  }

  async getProjectRevisions(projectId: string): Promise<ProjectRevision[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM project_revisions WHERE project_id = ? ORDER BY revision_number DESC')
        .bind(projectId)
        .all<ProjectRevision>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting project revisions:', error);
      return [];
    }
  }

  async getProjectRevision(revisionId: string): Promise<ProjectRevision | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM project_revisions WHERE id = ?')
        .bind(revisionId)
        .first<ProjectRevision>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting project revision:', error);
      return null;
    }
  }

  async getNextRevisionNumber(projectId: string): Promise<number> {
    try {
      const result = await this.db
        .prepare('SELECT MAX(revision_number) as max_revision FROM project_revisions WHERE project_id = ?')
        .bind(projectId)
        .first<{ max_revision: number | null }>();
      
      return (result?.max_revision || 0) + 1;
    } catch (error) {
      console.error('Error getting next revision number:', error);
      return 1;
    }
  }

  // Blog post operations
  async getBlogPosts(published: boolean = true): Promise<BlogPost[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM blog_posts WHERE published = ? ORDER BY published_at DESC, created_at DESC')
        .bind(published ? 1 : 0)
        .all<BlogPost>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting blog posts:', error);
      return [];
    }
  }

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1')
        .bind(slug)
        .first<BlogPost>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting blog post:', error);
      return null;
    }
  }

  // Session operations
  async createSession(session: Omit<UserSession, 'created_at'>): Promise<UserSession | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare('INSERT INTO user_sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?) RETURNING *')
        .bind(session.id, session.user_id, session.expires_at, now)
        .first<UserSession>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  async getSession(id: string): Promise<UserSession | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM user_sessions WHERE id = ?')
        .bind(id)
        .first<UserSession>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      await this.db
        .prepare('DELETE FROM user_sessions WHERE id = ?')
        .bind(id)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async deleteExpiredSessions(): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000);
      await this.db
        .prepare('DELETE FROM user_sessions WHERE expires_at < ?')
        .bind(now)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      return false;
    }
  }
}

// Create a mock database service for build time
export const createMockDatabase = (): DatabaseService => {
  const mockDb = {
    prepare: () => ({
      bind: () => ({
        first: () => Promise.resolve(null),
        all: () => Promise.resolve({ results: [] }),
        run: () => Promise.resolve({ success: true })
      }),
      first: () => Promise.resolve(null),
      all: () => Promise.resolve({ results: [] }),
      run: () => Promise.resolve({ success: true })
    })
  } as any;

  return new DatabaseService(mockDb);
};

// Export database instance (will be properly initialized in Cloudflare Workers context)
export let database: DatabaseService;

// Initialize database service
export function initializeDatabase(env: Env): void {
  database = new DatabaseService(env.DB);
}

// Utility function to get database service
export function getDatabase(env?: Env): DatabaseService {
  if (env) {
    return new DatabaseService(env.DB);
  }
  
  // Return mock database for build time
  return createMockDatabase();
}