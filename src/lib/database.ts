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
  password_hash?: string;
  tenant_id?: string;
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
  refresh_token?: string;
  created_at: string;
}

// Billing interfaces
export interface BillingCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  tier: 'free' | 'maker' | 'pro';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  invoice_url?: string;
  invoice_pdf?: string;
  period_start?: number;
  period_end?: number;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  feature: 'ai_generation' | 'ai_analysis' | 'template_download' | 'export_operation' | 'project_creation';
  quantity: number;
  timestamp: number;
  metadata?: string; // JSON
  created_at: string;
}

export interface UsageQuota {
  id: string;
  user_id: string;
  tier: 'free' | 'maker' | 'pro';
  feature: string;
  used_today: number;
  used_this_month: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
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
          INSERT INTO profiles (id, email, full_name, avatar_url, subscription_tier, stripe_customer_id, password_hash, tenant_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(profile.id, profile.email, profile.full_name, profile.avatar_url, profile.subscription_tier || 'free', profile.stripe_customer_id, profile.password_hash, profile.tenant_id, now, now)
        .first<Profile>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  async getProfile(identifier: string): Promise<Profile | null> {
    try {
      // Try by ID first, then by email
      let result = await this.db
        .prepare('SELECT * FROM profiles WHERE id = ?')
        .bind(identifier)
        .first<Profile>();
      
      if (!result) {
        result = await this.db
          .prepare('SELECT * FROM profiles WHERE email = ?')
          .bind(identifier)
          .first<Profile>();
      }
      
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
        .prepare('INSERT INTO user_sessions (id, user_id, expires_at, refresh_token, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *')
        .bind(session.id, session.user_id, session.expires_at, session.refresh_token, now)
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

  // Billing Customer operations
  async createBillingCustomer(customer: Omit<BillingCustomer, 'created_at' | 'updated_at'>): Promise<BillingCustomer | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          INSERT INTO billing_customers (id, user_id, stripe_customer_id, email, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(customer.id, customer.user_id, customer.stripe_customer_id, customer.email, customer.name, now, now)
        .first<BillingCustomer>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating billing customer:', error);
      return null;
    }
  }

  async getBillingCustomer(userId: string): Promise<BillingCustomer | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_customers WHERE user_id = ?')
        .bind(userId)
        .first<BillingCustomer>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting billing customer:', error);
      return null;
    }
  }

  async getBillingCustomerByStripeId(stripeCustomerId: string): Promise<BillingCustomer | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_customers WHERE stripe_customer_id = ?')
        .bind(stripeCustomerId)
        .first<BillingCustomer>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting billing customer by stripe ID:', error);
      return null;
    }
  }

  // Billing Subscription operations
  async createBillingSubscription(subscription: Omit<BillingSubscription, 'created_at' | 'updated_at'>): Promise<BillingSubscription | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          INSERT INTO billing_subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, status, tier, current_period_start, current_period_end, cancel_at_period_end, trial_end, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(subscription.id, subscription.user_id, subscription.stripe_subscription_id, subscription.stripe_customer_id, subscription.status, subscription.tier, subscription.current_period_start, subscription.current_period_end, subscription.cancel_at_period_end, subscription.trial_end, now, now)
        .first<BillingSubscription>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating billing subscription:', error);
      return null;
    }
  }

  async getBillingSubscription(userId: string): Promise<BillingSubscription | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
        .bind(userId)
        .first<BillingSubscription>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting billing subscription:', error);
      return null;
    }
  }

  async getBillingSubscriptionByStripeId(stripeSubscriptionId: string): Promise<BillingSubscription | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_subscriptions WHERE stripe_subscription_id = ?')
        .bind(stripeSubscriptionId)
        .first<BillingSubscription>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting billing subscription by stripe ID:', error);
      return null;
    }
  }

  async updateBillingSubscription(stripeSubscriptionId: string, updates: Partial<BillingSubscription>): Promise<BillingSubscription | null> {
    try {
      const result = await this.db
        .prepare(`
          UPDATE billing_subscriptions 
          SET status = COALESCE(?, status),
              tier = COALESCE(?, tier),
              current_period_start = COALESCE(?, current_period_start),
              current_period_end = COALESCE(?, current_period_end),
              cancel_at_period_end = COALESCE(?, cancel_at_period_end),
              trial_end = COALESCE(?, trial_end),
              updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription_id = ?
          RETURNING *
        `)
        .bind(updates.status, updates.tier, updates.current_period_start, updates.current_period_end, updates.cancel_at_period_end, updates.trial_end, stripeSubscriptionId)
        .first<BillingSubscription>();
      
      return result || null;
    } catch (error) {
      console.error('Error updating billing subscription:', error);
      return null;
    }
  }

  // Usage tracking operations
  async recordUsage(record: Omit<UsageRecord, 'id' | 'created_at'>): Promise<UsageRecord | null> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const result = await this.db
        .prepare(`
          INSERT INTO usage_records (id, user_id, feature, quantity, timestamp, metadata, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(id, record.user_id, record.feature, record.quantity, record.timestamp, record.metadata, now)
        .first<UsageRecord>();
      
      return result || null;
    } catch (error) {
      console.error('Error recording usage:', error);
      return null;
    }
  }

  async getUsageRecords(userId: string, feature?: string, startDate?: number, endDate?: number): Promise<UsageRecord[]> {
    try {
      let query = 'SELECT * FROM usage_records WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (feature) {
        query += ' AND feature = ?';
        params.push(feature);
      }
      
      if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
      }
      
      query += ' ORDER BY timestamp DESC';
      
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all<UsageRecord>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting usage records:', error);
      return [];
    }
  }

  async getUsageQuota(userId: string, feature: string): Promise<UsageQuota | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await this.db
        .prepare('SELECT * FROM usage_quotas WHERE user_id = ? AND feature = ? AND reset_date = ?')
        .bind(userId, feature, today)
        .first<UsageQuota>();
      
      return result || null;
    } catch (error) {
      console.error('Error getting usage quota:', error);
      return null;
    }
  }

  async updateUsageQuota(userId: string, feature: string, tier: string, increment = 1): Promise<UsageQuota | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const id = crypto.randomUUID();
      
      // Upsert usage quota
      const result = await this.db
        .prepare(`
          INSERT INTO usage_quotas (id, user_id, tier, feature, used_today, used_this_month, reset_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, feature, reset_date) 
          DO UPDATE SET 
            used_today = used_today + ?,
            used_this_month = used_this_month + ?,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `)
        .bind(id, userId, tier, feature, increment, increment, today, increment, increment)
        .first<UsageQuota>();
      
      return result || null;
    } catch (error) {
      console.error('Error updating usage quota:', error);
      return null;
    }
  }

  // Billing Invoice operations
  async createBillingInvoice(invoice: Omit<BillingInvoice, 'created_at'>): Promise<BillingInvoice | null> {
    try {
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(`
          INSERT INTO billing_invoices (id, user_id, stripe_invoice_id, stripe_customer_id, amount_paid, amount_due, currency, status, invoice_url, invoice_pdf, period_start, period_end, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(invoice.id, invoice.user_id, invoice.stripe_invoice_id, invoice.stripe_customer_id, invoice.amount_paid, invoice.amount_due, invoice.currency, invoice.status, invoice.invoice_url, invoice.invoice_pdf, invoice.period_start, invoice.period_end, now)
        .first<BillingInvoice>();
      
      return result || null;
    } catch (error) {
      console.error('Error creating billing invoice:', error);
      return null;
    }
  }

  async getBillingInvoices(userId: string): Promise<BillingInvoice[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_invoices WHERE user_id = ? ORDER BY created_at DESC')
        .bind(userId)
        .all<BillingInvoice>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting billing invoices:', error);
      return [];
    }
  }

  // GDPR Compliance Methods

  async getUserSubscriptions(userId: string): Promise<BillingSubscription[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_subscriptions WHERE user_id = ? ORDER BY created_at DESC')
        .bind(userId)
        .all<BillingSubscription>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }

  async getUserInvoices(userId: string): Promise<BillingInvoice[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM billing_invoices WHERE user_id = ? ORDER BY created_at DESC')
        .bind(userId)
        .all<BillingInvoice>();
      
      return result.results || [];
    } catch (error) {
      console.error('Error getting user invoices:', error);
      return [];
    }
  }

  async deleteUserSessions(userId: string): Promise<boolean> {
    try {
      await this.db
        .prepare('DELETE FROM user_sessions WHERE user_id = ?')
        .bind(userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting user sessions:', error);
      return false;
    }
  }

  async deleteUserProjects(userId: string): Promise<boolean> {
    try {
      // Delete project revisions first (cascading should handle this, but being explicit)
      await this.db
        .prepare(`
          DELETE FROM project_revisions 
          WHERE project_id IN (SELECT id FROM user_projects WHERE user_id = ?)
        `)
        .bind(userId)
        .run();

      // Then delete the projects
      await this.db
        .prepare('DELETE FROM user_projects WHERE user_id = ?')
        .bind(userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting user projects:', error);
      return false;
    }
  }

  async deleteUsageRecords(userId: string): Promise<boolean> {
    try {
      await this.db
        .prepare('DELETE FROM usage_records WHERE user_id = ?')
        .bind(userId)
        .run();

      await this.db
        .prepare('DELETE FROM usage_quotas WHERE user_id = ?')
        .bind(userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting usage records:', error);
      return false;
    }
  }

  async cancelUserSubscriptions(userId: string): Promise<boolean> {
    try {
      await this.db
        .prepare(`
          UPDATE billing_subscriptions 
          SET status = 'canceled', 
              cancel_at_period_end = 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `)
        .bind(userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error canceling user subscriptions:', error);
      return false;
    }
  }

  async anonymizeBillingRecords(userId: string): Promise<boolean> {
    try {
      // Anonymize billing customer data but keep for legal compliance
      await this.db
        .prepare(`
          UPDATE billing_customers 
          SET email = 'deleted-user@cutgluebuild.com',
              name = 'Deleted User',
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `)
        .bind(userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error anonymizing billing records:', error);
      return false;
    }
  }

  async deleteUserProfile(userId: string): Promise<boolean> {
    try {
      await this.db
        .prepare('DELETE FROM profiles WHERE id = ?')
        .bind(userId)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
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

// Alias for backward compatibility
export function createDatabaseService(env: Env): DatabaseService {
  return new DatabaseService(env.DB);
}

// Temporary auth service for backward compatibility
export function getAuthService() {
  return {
    getCurrentUser: () => Promise.resolve(null)
  };
}

// Temporary session function for backward compatibility
export function getSessionFromRequest() {
  return Promise.resolve(null);
}