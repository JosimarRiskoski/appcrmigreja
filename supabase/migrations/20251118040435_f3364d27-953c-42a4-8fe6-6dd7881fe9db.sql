-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for plan types
CREATE TYPE plan_type AS ENUM ('trial', 'essencial', 'avancado', 'premium');

-- Create enum for member status
CREATE TYPE member_status AS ENUM ('ativo', 'inativo', 'visitante');

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'lider', 'membro');

-- Create churches table
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  app_code TEXT UNIQUE, -- Código único para app mobile
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#f59e0b',
  trial_end_date TIMESTAMPTZ,
  current_plan plan_type DEFAULT 'trial',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'membro',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  status member_status DEFAULT 'ativo',
  photo_url TEXT,
  baptized BOOLEAN DEFAULT false,
  member_since DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ministries table
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ministry_members junction table
CREATE TABLE ministry_members (
  ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (ministry_id, member_id)
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_attendance table (check-in)
CREATE TABLE event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  visitor_name TEXT, -- For visitors not in members table
  CONSTRAINT check_member_or_visitor CHECK (
    (member_id IS NOT NULL AND visitor_name IS NULL) OR
    (member_id IS NULL AND visitor_name IS NOT NULL)
  )
);

-- Create prayer_requests table
CREATE TABLE prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'aberto', -- aberto, em_andamento, atendido
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for churches
CREATE POLICY "Users can view their own church"
  ON churches FOR SELECT
  USING (id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own church"
  ON churches FOR UPDATE
  USING (id IN (SELECT church_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their church"
  ON profiles FOR SELECT
  USING (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies for members
CREATE POLICY "Users can view members of their church"
  ON members FOR SELECT
  USING (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and leaders can insert members"
  ON members FOR INSERT
  WITH CHECK (church_id IN (
    SELECT church_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lider')
  ));

CREATE POLICY "Admins and leaders can update members"
  ON members FOR UPDATE
  USING (church_id IN (
    SELECT church_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lider')
  ));

CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  USING (church_id IN (
    SELECT church_id FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for ministries
CREATE POLICY "Users can view ministries of their church"
  ON ministries FOR SELECT
  USING (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and leaders can manage ministries"
  ON ministries FOR ALL
  USING (church_id IN (
    SELECT church_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lider')
  ));

-- RLS Policies for events
CREATE POLICY "Users can view events of their church"
  ON events FOR SELECT
  USING (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and leaders can manage events"
  ON events FOR ALL
  USING (church_id IN (
    SELECT church_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lider')
  ));

-- RLS Policies for prayer_requests
CREATE POLICY "Users can view prayer requests of their church"
  ON prayer_requests FOR SELECT
  USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND (is_public = true OR member_id IN (SELECT id FROM members WHERE church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())))
  );

CREATE POLICY "Users can create prayer requests"
  ON prayer_requests FOR INSERT
  WITH CHECK (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and leaders can manage prayer requests"
  ON prayer_requests FOR ALL
  USING (church_id IN (
    SELECT church_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lider')
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to generate unique app code
CREATE OR REPLACE FUNCTION generate_app_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM churches WHERE app_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to set trial period when church is created
CREATE OR REPLACE FUNCTION set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date := NOW() + INTERVAL '7 days';
  END IF;
  IF NEW.app_code IS NULL THEN
    NEW.app_code := generate_app_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trial period
CREATE TRIGGER set_church_trial BEFORE INSERT ON churches
  FOR EACH ROW EXECUTE FUNCTION set_trial_period();