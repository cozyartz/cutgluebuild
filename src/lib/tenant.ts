// Multi-tenant subdomain management for Cloudflare for SaaS
// Handles tenant isolation via subdomains like {tenant-id}.cutgluebuild.com

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  plan: 'free' | 'starter' | 'maker' | 'pro';
  custom_domain?: string;
  ssl_status?: 'pending' | 'active' | 'error';
  created_at: string;
  settings?: string; // JSON string of tenant-specific settings
}

export class TenantService {
  private env: any;
  
  constructor(env: any) {
    this.env = env;
  }

  /**
   * Extract tenant information from request hostname
   */
  getTenantFromHostname(hostname: string): { tenantId: string | null; isMainDomain: boolean } {
    const baseDomain = this.env.DOMAIN || 'cutgluebuild.com';
    
    // Main domain access
    if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
      return { tenantId: null, isMainDomain: true };
    }
    
    // Subdomain tenant access: {tenant-id}.cutgluebuild.com
    const subdomainMatch = hostname.match(`^([a-zA-Z0-9-]+)\\.${baseDomain.replace('.', '\\.')}$`);
    if (subdomainMatch) {
      return { tenantId: subdomainMatch[1], isMainDomain: false };
    }
    
    return { tenantId: null, isMainDomain: false };
  }

  /**
   * Generate a secure tenant ID
   */
  generateTenantId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new tenant with subdomain
   */
  async createTenant(name: string, plan: Tenant['plan'] = 'free'): Promise<Tenant | null> {
    try {
      const tenantId = this.generateTenantId();
      const subdomain = `${tenantId}.${this.env.DOMAIN}`;
      
      const tenant: Omit<Tenant, 'created_at'> = {
        id: tenantId,
        subdomain,
        name,
        plan,
        settings: JSON.stringify({
          theme: 'default',
          features: this.getFeaturesForPlan(plan)
        })
      };

      const db = this.env.DB;
      const now = new Date().toISOString();
      
      const result = await db
        .prepare(`
          INSERT INTO tenants (id, subdomain, name, plan, settings, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(tenant.id, tenant.subdomain, tenant.name, tenant.plan, tenant.settings, now)
        .first<Tenant>();
      
      return result;
    } catch (error) {
      console.error('Error creating tenant:', error);
      return null;
    }
  }

  /**
   * Get tenant by ID or subdomain
   */
  async getTenant(identifier: string): Promise<Tenant | null> {
    try {
      const db = this.env.DB;
      
      // Try by ID first, then by subdomain
      let result = await db
        .prepare('SELECT * FROM tenants WHERE id = ?')
        .bind(identifier)
        .first<Tenant>();
        
      if (!result) {
        result = await db
          .prepare('SELECT * FROM tenants WHERE subdomain = ?')
          .bind(`${identifier}.${this.env.DOMAIN}`)
          .first<Tenant>();
      }
      
      return result;
    } catch (error) {
      console.error('Error getting tenant:', error);
      return null;
    }
  }

  /**
   * Add custom hostname for tenant using Cloudflare for SaaS
   */
  async addCustomHostname(tenantId: string, hostname: string): Promise<boolean> {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) return false;

      // Use Cloudflare API to add custom hostname
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.env.ZONE_ID}/custom_hostnames`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname,
          ssl: {
            method: 'http',
            type: 'dv'
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to add custom hostname:', await response.text());
        return false;
      }

      const result = await response.json();
      
      // Update tenant with custom domain
      const db = this.env.DB;
      await db
        .prepare(`
          UPDATE tenants 
          SET custom_domain = ?, ssl_status = 'pending'
          WHERE id = ?
        `)
        .bind(hostname, tenantId)
        .run();

      return true;
    } catch (error) {
      console.error('Error adding custom hostname:', error);
      return false;
    }
  }

  /**
   * Get features available for each plan
   */
  private getFeaturesForPlan(plan: Tenant['plan']) {
    const features = {
      free: ['basic_templates', 'svg_generation'],
      starter: ['basic_templates', 'svg_generation', 'premium_templates'],
      maker: ['basic_templates', 'svg_generation', 'premium_templates', 'gcode_generation', 'quality_analysis'],
      pro: ['basic_templates', 'svg_generation', 'premium_templates', 'gcode_generation', 'quality_analysis', 'workshop_assistant', 'custom_domain', 'api_access']
    };
    
    return features[plan] || features.free;
  }

  /**
   * Validate tenant access to features
   */
  canAccessFeature(tenant: Tenant | null, feature: string): boolean {
    if (!tenant) return false;
    
    const settings = tenant.settings ? JSON.parse(tenant.settings) : { features: [] };
    return settings.features?.includes(feature) || false;
  }
}

// Add to database schema
export const TENANT_SCHEMA = `
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  custom_domain TEXT UNIQUE,
  ssl_status TEXT DEFAULT 'pending',
  settings TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
`;