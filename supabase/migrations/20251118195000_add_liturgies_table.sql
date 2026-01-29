-- Create liturgies table
CREATE TABLE IF NOT EXISTS liturgies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  minister TEXT NOT NULL,
  theme TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  type TEXT NOT NULL DEFAULT 'Culto',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE liturgies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view liturgies of their church"
  ON liturgies FOR SELECT
  USING (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and leaders can manage liturgies"
  ON liturgies FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','lider')
    )
  );

CREATE TRIGGER update_liturgies_updated_at
BEFORE UPDATE ON liturgies
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();