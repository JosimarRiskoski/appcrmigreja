-- Create visitors table for Kanban funnel
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  first_visit_date DATE NOT NULL,
  notes TEXT,
  tag TEXT,
  status TEXT NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX visitors_church_id_idx ON visitors(church_id);
CREATE INDEX visitors_status_idx ON visitors(status);
CREATE INDEX visitors_first_visit_date_idx ON visitors(first_visit_date);

-- Update updated_at on changes
CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON visitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Policies: allow users of same church to view and manage visitors
CREATE POLICY "Users can view visitors of their church"
  ON visitors FOR SELECT
  USING (church_id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert visitors of their church"
  ON visitors FOR INSERT
  WITH CHECK (church_id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update visitors of their church"
  ON visitors FOR UPDATE
  USING (church_id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (church_id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete visitors of their church"
  ON visitors FOR DELETE
  USING (church_id IN (
    SELECT church_id FROM profiles WHERE id = auth.uid()
  ));