-- Create spaces table
CREATE TABLE spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#3b82f6',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create space_members table for user assignments
CREATE TABLE space_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(space_id, user_id)
);

-- Create space_files table for file attachments
CREATE TABLE space_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create space_entities table to link CRM entities to spaces
CREATE TABLE space_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('leads', 'deals', 'projects', 'accounts', 'invoices', 'team')),
  entity_id UUID NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spaces
CREATE POLICY "Users can view spaces they are members of or organization admin" ON spaces
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization admins can create spaces" ON spaces
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid() 
      AND organization_id = spaces.organization_id 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

CREATE POLICY "Organization admins can update spaces" ON spaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE user_id = auth.uid() 
      AND organization_id = spaces.organization_id 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- RLS Policies for space_members
CREATE POLICY "Users can view space members if they are members" ON space_members
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM spaces s
      JOIN organization_members om ON s.organization_id = om.organization_id
      WHERE s.id = space_members.space_id 
      AND om.user_id = auth.uid() 
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can manage space members" ON space_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM spaces s
      JOIN organization_members om ON s.organization_id = om.organization_id
      WHERE s.id = space_members.space_id 
      AND om.user_id = auth.uid() 
      AND om.role = 'admin'
    )
  );

-- RLS Policies for space_files
CREATE POLICY "Space members can view files" ON space_files
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Space members can upload files" ON space_files
  FOR INSERT WITH CHECK (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for space_entities
CREATE POLICY "Space members can view entities" ON space_entities
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Space admins can manage entities" ON space_entities
  FOR ALL USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND role IN ('admin') AND is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_spaces_organization_id ON spaces(organization_id);
CREATE INDEX idx_space_members_space_id ON space_members(space_id);
CREATE INDEX idx_space_members_user_id ON space_members(user_id);
CREATE INDEX idx_space_files_space_id ON space_files(space_id);
CREATE INDEX idx_space_entities_space_id ON space_entities(space_id);
CREATE INDEX idx_space_entities_entity ON space_entities(entity_type, entity_id);

-- Create functions for space management
CREATE OR REPLACE FUNCTION get_user_spaces(user_uuid UUID)
RETURNS TABLE (
  space_id UUID,
  space_name TEXT,
  space_description TEXT,
  space_icon TEXT,
  space_color TEXT,
  user_role TEXT,
  member_count BIGINT,
  file_count BIGINT,
  entity_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.icon,
    s.color,
    sm.role,
    (SELECT COUNT(*) FROM space_members sm2 WHERE sm2.space_id = s.id AND sm2.is_active = true),
    (SELECT COUNT(*) FROM space_files sf WHERE sf.space_id = s.id AND sf.is_active = true),
    (SELECT COUNT(*) FROM space_entities se WHERE se.space_id = s.id)
  FROM spaces s
  JOIN space_members sm ON s.id = sm.space_id
  WHERE sm.user_id = user_uuid 
  AND sm.is_active = true 
  AND s.is_active = true
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;