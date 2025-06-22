-- ENUM Types
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'maker', 'pro');
CREATE TYPE project_type AS ENUM ('svg_generated', 'upload_vectorized', 'project_idea');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- TABLE: profiles
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
  updated_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false
);

-- TABLE: templates
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

-- TABLE: user_projects (initially without FK to project_revisions)
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  svg_data text,
  project_type project_type NOT NULL,
  metadata jsonb DEFAULT '{}',
  canvas_settings jsonb DEFAULT '{"width": 800, "height": 600, "backgroundColor": "#ffffff"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE: project_revisions
CREATE TABLE IF NOT EXISTS project_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES user_projects(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  svg_data text NOT NULL,
  changes_description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, revision_number)
);

-- TABLE: blog_posts
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

-- TABLE: template_downloads
CREATE TABLE IF NOT EXISTS template_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  downloaded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- RLS Enablement
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- templates
CREATE POLICY "Anyone can read published templates"
  ON templates FOR SELECT USING (true);

-- user_projects
CREATE POLICY "Users can manage own projects"
  ON user_projects FOR ALL TO authenticated USING (auth.uid() = user_id);

-- blog_posts
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT USING (published = true);

-- template_downloads
CREATE POLICY "Users can manage own downloads"
  ON template_downloads FOR ALL TO authenticated USING (auth.uid() = user_id);

-- project_revisions
CREATE POLICY "Users can read own project revisions"
  ON project_revisions FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_projects 
      WHERE user_projects.id = project_revisions.project_id 
      AND user_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create revisions for own projects"
  ON project_revisions FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects 
      WHERE user_projects.id = project_revisions.project_id 
      AND user_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project revisions"
  ON project_revisions FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_projects 
      WHERE user_projects.id = project_revisions.project_id 
      AND user_projects.user_id = auth.uid()
    )
  );

-- Functions

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

-- Trigger to create initial revision
CREATE OR REPLACE FUNCTION create_initial_revision()
RETURNS TRIGGER AS $$
DECLARE
  revision_id uuid;
BEGIN
  IF NEW.svg_data IS NOT NULL AND NEW.svg_data != '' THEN
    INSERT INTO project_revisions (project_id, revision_number, svg_data, changes_description)
    VALUES (NEW.id, 1, NEW.svg_data, 'Initial version')
    RETURNING id INTO revision_id;

    UPDATE user_projects 
    SET current_revision_id = revision_id 
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER create_initial_project_revision
  AFTER INSERT ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_revision();

-- get_next_revision_number
CREATE OR REPLACE FUNCTION get_next_revision_number(project_uuid uuid)
RETURNS integer AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO next_num
  FROM project_revisions
  WHERE project_id = project_uuid;

  RETURN next_num;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Sync profile on auth
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_revisions_project_id ON project_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_revisions_created_at ON project_revisions(created_at DESC);

-- Add circular FK after both tables exist
ALTER TABLE user_projects
ADD COLUMN current_revision_id uuid REFERENCES project_revisions(id);
