-- Admin System Migration
-- Add admin roles, permissions, and GitHub OAuth support

-- Add admin fields to profiles table (without UNIQUE constraint initially)
ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('user', 'admin', 'superadmin')) DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN github_id TEXT;
ALTER TABLE profiles ADD COLUMN github_username TEXT;
ALTER TABLE profiles ADD COLUMN password_hash TEXT; -- Keep existing auth working
ALTER TABLE profiles ADD COLUMN last_login DATETIME;
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Admin permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES profiles (id),
  UNIQUE(user_id, permission)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- System settings table (admin configurable)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES profiles (id)
);

-- User analytics for admin dashboard
CREATE TABLE IF NOT EXISTS user_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Template analytics
CREATE TABLE IF NOT EXISTS template_analytics (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL, -- 'view', 'download', 'favorite'
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE SET NULL
);

-- AI usage tracking for admin oversight
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  model_used TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- 'svg_generation', 'validation', 'fixing'
  tokens_used INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE SET NULL
);

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_user_id ON ai_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_created_at ON ai_usage_stats(created_at);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
('site_name', 'CutGlueBuild', 'Site display name'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('max_free_ai_generations', '5', 'Maximum AI generations for free users per day'),
('max_starter_ai_generations', '50', 'Maximum AI generations for starter users per day'),
('max_maker_ai_generations', '200', 'Maximum AI generations for maker users per day'),
('feature_flags', '{"new_materials": true, "beta_features": false}', 'Feature flag configuration'),
('welcome_message', 'Welcome to CutGlueBuild - AI-Powered Laser Cutting Platform', 'Homepage welcome message');

-- Seed superadmin user (will be updated with your GitHub info)
INSERT OR IGNORE INTO profiles (
  id,
  email,
  full_name,
  role,
  subscription_tier,
  created_at
) VALUES (
  'admin-seed-user-id',
  'admin@cutgluebuild.com',
  'CutGlueBuild Admin',
  'superadmin',
  'pro',
  CURRENT_TIMESTAMP
);

-- Grant all permissions to superadmin
INSERT OR IGNORE INTO admin_permissions (id, user_id, permission, granted_by) VALUES
('perm-1', 'admin-seed-user-id', 'user_management', 'admin-seed-user-id'),
('perm-2', 'admin-seed-user-id', 'template_management', 'admin-seed-user-id'),
('perm-3', 'admin-seed-user-id', 'system_settings', 'admin-seed-user-id'),
('perm-4', 'admin-seed-user-id', 'analytics_view', 'admin-seed-user-id'),
('perm-5', 'admin-seed-user-id', 'ai_usage_monitoring', 'admin-seed-user-id'),
('perm-6', 'admin-seed-user-id', 'billing_management', 'admin-seed-user-id'),
('perm-7', 'admin-seed-user-id', 'content_management', 'admin-seed-user-id'),
('perm-8', 'admin-seed-user-id', 'super_admin', 'admin-seed-user-id');