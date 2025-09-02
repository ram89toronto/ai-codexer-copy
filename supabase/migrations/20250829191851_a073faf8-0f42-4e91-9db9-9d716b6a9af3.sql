-- Extend messages table for code generation support
ALTER TABLE messages 
ADD COLUMN message_type text DEFAULT 'chat',
ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

-- Create projects table for code project management
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
CREATE POLICY "Users can create their own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- Create code_sessions table for tracking advanced coding sessions
CREATE TABLE code_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on code_sessions table
ALTER TABLE code_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for code_sessions table
CREATE POLICY "Users can create code sessions for their projects" 
ON code_sessions FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = code_sessions.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can view code sessions for their projects" 
ON code_sessions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = code_sessions.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update code sessions for their projects" 
ON code_sessions FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = code_sessions.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete code sessions for their projects" 
ON code_sessions FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = code_sessions.project_id 
  AND projects.user_id = auth.uid()
));

-- Create trigger to update updated_at timestamp for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at timestamp for code_sessions
CREATE TRIGGER update_code_sessions_updated_at
  BEFORE UPDATE ON code_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();