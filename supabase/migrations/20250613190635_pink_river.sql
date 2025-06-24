
-- ENUMS
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');
CREATE TYPE topup_type AS ENUM ('20_credits', '50_credits', '100_credits');

-- TABLE: billing_plans
CREATE TABLE IF NOT EXISTS billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier subscription_tier NOT NULL,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  monthly_credits integer NOT NULL,
  perks jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- TABLE: user_credits
CREATE TABLE IF NOT EXISTS user_credits (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_credits integer DEFAULT 0,
  rollover_credits integer DEFAULT 0,
  used_credits integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- TABLE: credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL, -- 'monthly_reset', 'topup', 'admin', etc.
  description text,
  created_at timestamptz DEFAULT now()
);

-- FUNCTION: update timestamp
CREATE OR REPLACE FUNCTION update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_credits_timestamp
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_user_credits_timestamp();

-- Credit consumption logic (sample placeholder for function)
-- You would implement logic in your backend to:
-- 1. Check if user has monthly credits > used
-- 2. If not, fallback to rollover_credits
-- 3. Update used_credits or decrement rollover_credits
