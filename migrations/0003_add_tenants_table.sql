-- Add tenants table for multi-tenant subdomain management
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

-- Add tenant_id to user_projects for data isolation
ALTER TABLE user_projects ADD COLUMN tenant_id TEXT;
CREATE INDEX IF NOT EXISTS idx_user_projects_tenant ON user_projects(tenant_id);

-- Add tenant_id to profiles for user-tenant relationships
ALTER TABLE profiles ADD COLUMN tenant_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);

-- Create a demo tenant for testing
INSERT INTO tenants (id, subdomain, name, plan, settings, created_at) VALUES (
  'hsdfyw8ry9',
  'hsdfyw8ry9.cutgluebuild.com',
  'Demo Workshop',
  'pro',
  '{"theme":"default","features":["basic_templates","svg_generation","premium_templates","gcode_generation","quality_analysis","workshop_assistant","api_access"]}',
  datetime('now')
);

-- Create another demo tenant
INSERT INTO tenants (id, subdomain, name, plan, settings, created_at) VALUES (
  'abc123xyz789',
  'abc123xyz789.cutgluebuild.com',
  'Maker Space Co',
  'maker',
  '{"theme":"default","features":["basic_templates","svg_generation","premium_templates","gcode_generation","quality_analysis"]}',
  datetime('now')
);