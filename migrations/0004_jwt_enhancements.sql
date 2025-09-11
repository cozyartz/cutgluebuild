-- Add JWT and authentication enhancements
-- Migration: 0004_jwt_enhancements.sql

-- Add password_hash column to profiles table
ALTER TABLE profiles ADD COLUMN password_hash TEXT;

-- Add refresh_token column to user_sessions table  
ALTER TABLE user_sessions ADD COLUMN refresh_token TEXT;

-- Add JWT secret configuration to environment variables (handled in wrangler.toml)
-- JWT_SECRET and JWT_REFRESH_SECRET will be set in environment

-- Create index on refresh_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);

-- Create index on password_hash for security (not recommended for lookups, but for constraints)
-- Note: Password hashes should never be indexed for security reasons, removing this
-- CREATE INDEX IF NOT EXISTS idx_profiles_password_hash ON profiles(password_hash);

-- Update existing sessions to have proper expiration (30 days from now)
UPDATE user_sessions 
SET expires_at = strftime('%s', 'now', '+30 days') 
WHERE expires_at < strftime('%s', 'now');
