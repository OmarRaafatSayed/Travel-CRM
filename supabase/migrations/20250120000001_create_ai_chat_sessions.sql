-- Create AI chat sessions table
CREATE TABLE ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI chat messages table
CREATE TABLE ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  message_type TEXT CHECK (message_type IN ('report', 'analysis', 'recommendation', 'widget', 'crud', 'component', 'chart')),
  crud_result JSONB,
  chart_data JSONB,
  component_mention TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_chat_sessions_org_user ON ai_chat_sessions(organization_id, user_id);
CREATE INDEX idx_ai_chat_sessions_created_at ON ai_chat_sessions(created_at);
CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- Enable RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_chat_sessions
CREATE POLICY "Users can view their organization's chat sessions" ON ai_chat_sessions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Users can create chat sessions in their organization" ON ai_chat_sessions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'approved'
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own chat sessions" ON ai_chat_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat sessions" ON ai_chat_sessions
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for ai_chat_messages
CREATE POLICY "Users can view messages from their organization's sessions" ON ai_chat_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM ai_chat_sessions 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can create messages in their organization's sessions" ON ai_chat_messages
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM ai_chat_sessions 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can update messages in their sessions" ON ai_chat_messages
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM ai_chat_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their sessions" ON ai_chat_messages
  FOR DELETE USING (
    session_id IN (
      SELECT id FROM ai_chat_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_session_updated_at();