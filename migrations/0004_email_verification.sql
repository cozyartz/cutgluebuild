-- Add email verification system
-- This migration adds email verification functionality

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Add email_verified column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN email_verified INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Clean up expired verification tokens (optional maintenance)
-- This can be run periodically to clean up old tokens
-- DELETE FROM email_verifications WHERE expires_at < strftime('%s', 'now') AND used_at IS NULL;