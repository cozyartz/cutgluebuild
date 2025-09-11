-- Migration: Remove trial tier and implement paid-only model
-- This migration removes trial functionality and sets up paid-only tiers

-- Remove trial-related columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_designs_used;

-- Update any remaining trial users to have no subscription
-- (They'll need to choose a paid plan to access features)
UPDATE profiles SET subscription_tier = NULL WHERE subscription_tier = 'trial';

-- Update billing tables to remove trial references
UPDATE billing_subscriptions SET tier = 'starter' WHERE tier = 'trial';
UPDATE usage_quotas SET tier = 'starter' WHERE tier = 'trial';

-- Clean up any orphaned data
DELETE FROM usage_quotas WHERE tier NOT IN ('starter', 'professional');

-- Add constraint to ensure only valid tiers
-- Note: This is for documentation purposes - SQLite doesn't enforce CHECK constraints by default
-- ALTER TABLE profiles ADD CONSTRAINT check_subscription_tier 
-- CHECK (subscription_tier IS NULL OR subscription_tier IN ('starter', 'professional'));

-- Update indexes for better performance
DROP INDEX IF EXISTS idx_profiles_trial_ends_at;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier) WHERE subscription_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_tier ON billing_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_tier_feature ON usage_quotas(tier, feature);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_feature ON usage_quotas(user_id, feature);

-- Add comments for clarity (SQLite supports comments in schema)
-- profiles.subscription_tier: NULL = no subscription, 'starter' = $49/month, 'professional' = $99/month
-- billing_subscriptions.tier: 'starter' or 'professional' only
-- All users must have active subscription to use AI features
