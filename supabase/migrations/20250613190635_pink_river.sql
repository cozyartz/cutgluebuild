/*
  # Design Revision History System

  1. New Tables
    - `project_revisions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references user_projects)
      - `revision_number` (integer)
      - `svg_data` (text)
      - `changes_description` (text)
      - `metadata` (jsonb) - stores editor settings, canvas size, etc.
      - `created_at` (timestamp)

  2. Schema Changes
    - Add `current_revision_id` to `user_projects` table
    - Add `canvas_settings` to `user_projects` for editor state

  3. Security
    - Enable RLS on `project_revisions` table
    - Add policies for users to manage their own project revisions
*/

-- Create project revisions table
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

-- Add new columns to user_projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_projects' AND column_name = 'current_revision_id'
  ) THEN
    ALTER TABLE user_projects ADD COLUMN current_revision_id uuid REFERENCES project_revisions(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_projects' AND column_name = 'canvas_settings'
  ) THEN
    ALTER TABLE user_projects ADD COLUMN canvas_settings jsonb DEFAULT '{"width": 800, "height": 600, "backgroundColor": "#ffffff"}';
  END IF;
END $$;

-- Enable RLS on project_revisions
ALTER TABLE project_revisions ENABLE ROW LEVEL SECURITY;

-- Project revisions policies
CREATE POLICY "Users can read own project revisions"
  ON project_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects 
      WHERE user_projects.id = project_revisions.project_id 
      AND user_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create revisions for own projects"
  ON project_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects 
      WHERE user_projects.id = project_revisions.project_id 
      AND user_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project revisions"
  ON project_revisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects 
      WHERE user_projects.id = project_revisions.project_id 
      AND user_projects.user_id = auth.uid()
    )
  );

-- Function to create initial revision when project is created
CREATE OR REPLACE FUNCTION create_initial_revision()
RETURNS TRIGGER AS $$
DECLARE
  revision_id uuid;
BEGIN
  -- Only create revision if svg_data exists
  IF NEW.svg_data IS NOT NULL AND NEW.svg_data != '' THEN
    INSERT INTO project_revisions (project_id, revision_number, svg_data, changes_description)
    VALUES (NEW.id, 1, NEW.svg_data, 'Initial version')
    RETURNING id INTO revision_id;
    
    -- Update the project to reference this revision
    UPDATE user_projects 
    SET current_revision_id = revision_id 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create initial revision
CREATE TRIGGER create_initial_project_revision
  AFTER INSERT ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_revision();

-- Function to get next revision number
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_revisions_project_id ON project_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_revisions_created_at ON project_revisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_current_revision ON user_projects(current_revision_id);