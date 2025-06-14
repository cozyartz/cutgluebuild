/*
  # Initial Database Schema for CutGlueBuild.com

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text)
      - `subscription_tier` (enum: free, starter, maker, pro)
      - `stripe_customer_id` (text)
      - `ai_tool_uses_today` (integer, default 0)
      - `last_tool_use_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `templates`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `tags` (text array)
      - `materials` (text array)
      - `difficulty` (enum)
      - `svg_data` (text)
      - `preview_url` (text)
      - `is_premium` (boolean)
      - `download_count` (integer)
      - `created_at` (timestamp)

    - `user_projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `svg_data` (text)
      - `project_type` (enum)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `excerpt` (text)
      - `content` (text)
      - `author` (text)
      - `tags` (text array)
      - `published` (boolean)
      - `featured_image` (text)
      - `reading_time` (integer)
      - `published_at` (timestamp)
      - `created_at` (timestamp)

    - `template_downloads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `template_id` (uuid, references templates)
      - `downloaded_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for public access to published content
*/

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'maker', 'pro');
CREATE TYPE project_type AS ENUM ('svg_generated', 'upload_vectorized', 'project_idea');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  subscription_tier subscription_tier DEFAULT 'free',
  stripe_customer_id text,
  ai_tool_uses_today integer DEFAULT 0,
  last_tool_use_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  materials text[] DEFAULT '{}',
  difficulty difficulty_level DEFAULT 'beginner',
  svg_data text NOT NULL,
  preview_url text,
  is_premium boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User projects table
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  svg_data text,
  project_type project_type NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  author text NOT NULL,
  tags text[] DEFAULT '{}',
  published boolean DEFAULT false,
  featured_image text,
  reading_time integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Template downloads tracking
CREATE TABLE IF NOT EXISTS template_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  downloaded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Templates policies
CREATE POLICY "Anyone can read published templates"
  ON templates FOR SELECT
  USING (true);

-- User projects policies
CREATE POLICY "Users can manage own projects"
  ON user_projects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Blog posts policies
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Template downloads policies
CREATE POLICY "Users can manage own downloads"
  ON template_downloads FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();