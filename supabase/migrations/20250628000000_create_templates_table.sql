-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  tags text[] DEFAULT '{}',
  materials text[] DEFAULT '{}',
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  svg_data text,
  preview_url text,
  is_premium boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template downloads tracking table
CREATE TABLE IF NOT EXISTS template_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  downloaded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Create subscription tier enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'maker', 'pro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table if it doesn't exist (for template downloads tracking)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  subscription_tier subscription_tier DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates (public read, admin write)
CREATE POLICY "Templates are publicly readable" ON templates FOR SELECT TO public USING (true);
CREATE POLICY "Only admins can modify templates" ON templates FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- RLS policies for template downloads (users can only see their own downloads)
CREATE POLICY "Users can view their own downloads" ON template_downloads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can track their own downloads" ON template_downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_difficulty ON templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_templates_is_premium ON templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_materials ON templates USING GIN(materials);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
CREATE INDEX IF NOT EXISTS idx_template_downloads_user_id ON template_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_template_downloads_template_id ON template_downloads(template_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_templates_updated_at
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE FUNCTION update_templates_timestamp();