CREATE TABLE IF NOT EXISTS liturgy_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liturgy_id UUID NOT NULL REFERENCES liturgies(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE liturgy_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view liturgy order items of their church"
  ON liturgy_order_items FOR SELECT
  USING (
    liturgy_id IN (
      SELECT id FROM liturgies WHERE church_id IN (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and leaders can manage liturgy order items"
  ON liturgy_order_items FOR ALL
  USING (
    liturgy_id IN (
      SELECT id FROM liturgies WHERE church_id IN (
        SELECT church_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','lider')
      )
    )
  );

CREATE TRIGGER update_liturgy_order_items_updated_at
BEFORE UPDATE ON liturgy_order_items
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();