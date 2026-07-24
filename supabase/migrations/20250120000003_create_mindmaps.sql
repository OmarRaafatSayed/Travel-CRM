-- Create mindmaps table
CREATE TABLE mindmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  shared_with_team BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mindmaps_org_user ON mindmaps(organization_id, user_id);
CREATE INDEX idx_mindmaps_published ON mindmaps(is_published);

-- Enable RLS
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their organization's mindmaps" ON mindmaps
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'approved'
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can create mindmaps" ON mindmaps
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own mindmaps" ON mindmaps
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own mindmaps" ON mindmaps
  FOR DELETE USING (user_id = auth.uid());