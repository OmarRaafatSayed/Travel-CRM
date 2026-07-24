-- Create storage bucket for space files
INSERT INTO storage.buckets (id, name, public) VALUES ('space-files', 'space-files', false);

-- Create storage policies for space files
CREATE POLICY "Space members can view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'space-files' AND
    EXISTS (
      SELECT 1 FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = auth.uid() 
      AND sm.is_active = true
      AND (storage.foldername(name))[1] = s.id::text
    )
  );

CREATE POLICY "Space members can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'space-files' AND
    EXISTS (
      SELECT 1 FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = auth.uid() 
      AND sm.is_active = true
      AND (storage.foldername(name))[1] = s.id::text
    )
  );

CREATE POLICY "Space members can delete files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'space-files' AND
    EXISTS (
      SELECT 1 FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = auth.uid() 
      AND sm.role IN ('admin')
      AND sm.is_active = true
      AND (storage.foldername(name))[1] = s.id::text
    )
  );