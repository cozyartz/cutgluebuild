-- Billing and Subscription Management Tables
-- Migration: 0003_billing_tables.sql

-- Billing customers table (links users to Stripe customers)
CREATE TABLE IF NOT EXISTS billing_customers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Billing subscriptions table
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')) NOT NULL,
  tier TEXT CHECK (tier IN ('free', 'maker', 'pro')) NOT NULL DEFAULT 'free',
  current_period_start INTEGER NOT NULL,
  current_period_end INTEGER NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT 0,
  trial_end INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  FOREIGN KEY (stripe_customer_id) REFERENCES billing_customers (stripe_customer_id) ON DELETE CASCADE
);

-- Billing invoices table
CREATE TABLE IF NOT EXISTS billing_invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  amount_due INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')) NOT NULL,
  invoice_url TEXT,
  invoice_pdf TEXT,
  period_start INTEGER,
  period_end INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  FOREIGN KEY (stripe_customer_id) REFERENCES billing_customers (stripe_customer_id) ON DELETE CASCADE
);

-- Usage records table for tracking feature usage
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  feature TEXT CHECK (feature IN ('ai_generation', 'ai_analysis', 'template_download', 'export_operation', 'project_creation')) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  timestamp INTEGER NOT NULL,
  metadata TEXT, -- JSON data for additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Payment methods table (for display purposes)
CREATE TABLE IF NOT EXISTS billing_payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'card',
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  FOREIGN KEY (stripe_customer_id) REFERENCES billing_customers (stripe_customer_id) ON DELETE CASCADE
);

-- Subscription items table (for metered billing)
CREATE TABLE IF NOT EXISTS billing_subscription_items (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  stripe_subscription_item_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES billing_subscriptions (stripe_subscription_id) ON DELETE CASCADE
);

-- Webhook events table (for idempotency and debugging)
CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id TEXT PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

-- Usage quotas table (for tracking limits per tier)
CREATE TABLE IF NOT EXISTS usage_quotas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('free', 'maker', 'pro')) NOT NULL,
  feature TEXT NOT NULL,
  used_today INTEGER DEFAULT 0,
  used_this_month INTEGER DEFAULT 0,
  reset_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  UNIQUE(user_id, feature, reset_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_customers_user_id ON billing_customers (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_id ON billing_customers (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_id ON billing_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_id ON billing_subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON billing_invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices (status);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_feature ON usage_records (user_id, feature);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records (timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_feature ON usage_quotas (user_id, feature);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_reset_date ON usage_quotas (reset_date);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON billing_webhook_events (processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON billing_webhook_events (stripe_event_id);

-- Triggers to update updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_billing_customers_updated_at 
  AFTER UPDATE ON billing_customers
BEGIN
  UPDATE billing_customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_billing_subscriptions_updated_at 
  AFTER UPDATE ON billing_subscriptions
BEGIN
  UPDATE billing_subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_billing_payment_methods_updated_at 
  AFTER UPDATE ON billing_payment_methods
BEGIN
  UPDATE billing_payment_methods SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_usage_quotas_updated_at 
  AFTER UPDATE ON usage_quotas
BEGIN
  UPDATE usage_quotas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;