-- Migration: Update pricing tiers to new model
-- From: free/starter/maker/pro  
-- To: trial/starter/professional

-- Update profiles table - add trial tracking fields
ALTER TABLE profiles ADD COLUMN trial_ends_at TEXT;
ALTER TABLE profiles ADD COLUMN trial_designs_used INTEGER DEFAULT 0;

-- Update existing subscription tiers
UPDATE profiles SET subscription_tier = CASE 
  WHEN subscription_tier = 'free' THEN 'trial'
  WHEN subscription_tier = 'maker' THEN 'starter'
  WHEN subscription_tier = 'pro' THEN 'professional'
  ELSE subscription_tier
END;

-- Update billing_subscriptions table
UPDATE billing_subscriptions SET tier = CASE 
  WHEN tier = 'free' THEN 'trial'
  WHEN tier = 'maker' THEN 'starter'
  WHEN tier = 'pro' THEN 'professional'
  ELSE tier
END;

-- Update usage_quotas table
UPDATE usage_quotas SET tier = CASE 
  WHEN tier = 'free' THEN 'trial'
  WHEN tier = 'maker' THEN 'starter' 
  WHEN tier = 'pro' THEN 'professional'
  ELSE tier
END;

-- Set trial end dates for existing trial users (7 days from now)
UPDATE profiles 
SET trial_ends_at = datetime('now', '+7 days'),
    trial_designs_used = 0
WHERE subscription_tier = 'trial';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_tier_feature ON usage_quotas(tier, feature);
