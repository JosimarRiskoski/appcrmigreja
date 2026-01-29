-- Fix security issues from linter

-- Add RLS policies for ministry_members
CREATE POLICY "Users can view ministry members of their church"
  ON ministry_members FOR SELECT
  USING (ministry_id IN (
    SELECT id FROM ministries WHERE church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admins and leaders can manage ministry members"
  ON ministry_members FOR ALL
  USING (ministry_id IN (
    SELECT id FROM ministries WHERE church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lider')
    )
  ));

-- Add RLS policies for event_attendance
CREATE POLICY "Users can view attendance of their church events"
  ON event_attendance FOR SELECT
  USING (event_id IN (
    SELECT id FROM events WHERE church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can check themselves in"
  ON event_attendance FOR INSERT
  WITH CHECK (event_id IN (
    SELECT id FROM events WHERE church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admins and leaders can manage attendance"
  ON event_attendance FOR ALL
  USING (event_id IN (
    SELECT id FROM events WHERE church_id IN (
      SELECT church_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lider')
    )
  ));

-- Fix functions with search_path issues (use CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_app_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.churches WHERE app_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION set_trial_period()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date := NOW() + INTERVAL '7 days';
  END IF;
  IF NEW.app_code IS NULL THEN
    NEW.app_code := generate_app_code();
  END IF;
  RETURN NEW;
END;
$$;