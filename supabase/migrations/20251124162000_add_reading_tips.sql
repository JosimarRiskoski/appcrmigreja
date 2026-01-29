-- Create reading_tips table
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.reading_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  category text NOT NULL,
  description text,
  cover_url text,
  buy_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF to_regclass('public.churches') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'reading_tips_church_fk'
    ) THEN
      ALTER TABLE public.reading_tips
        ADD CONSTRAINT reading_tips_church_fk
        FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reading_tips_category_check'
  ) THEN
    ALTER TABLE public.reading_tips
      ADD CONSTRAINT reading_tips_category_check
      CHECK (category IN ('livro','devocional','estudo','biblia'));
  END IF;
END $$;

ALTER TABLE public.reading_tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view reading tips of their church" ON public.reading_tips;
CREATE POLICY "Users can view reading tips of their church"
  ON public.reading_tips FOR SELECT
  USING (church_id IN (SELECT church_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins and leaders can manage reading tips" ON public.reading_tips;
CREATE POLICY "Admins and leaders can manage reading tips"
  ON public.reading_tips FOR ALL
  USING (church_id IN (
    SELECT church_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lider')
  ))
  WITH CHECK (church_id IN (
    SELECT church_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lider')
  ));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reading_tips_updated_at ON public.reading_tips;
CREATE TRIGGER update_reading_tips_updated_at
  BEFORE UPDATE ON public.reading_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'reading_tips') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('reading_tips', 'reading_tips', true);
  END IF;
END $$;

DROP POLICY IF EXISTS "Public can view reading tips covers" ON storage.objects;
CREATE POLICY "Public can view reading tips covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reading_tips');

DROP POLICY IF EXISTS "Authenticated can upload reading tips covers" ON storage.objects;
CREATE POLICY "Authenticated can upload reading tips covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reading_tips');

DROP POLICY IF EXISTS "Authenticated can update reading tips covers" ON storage.objects;
CREATE POLICY "Authenticated can update reading tips covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reading_tips');

DROP POLICY IF EXISTS "Authenticated can delete reading tips covers" ON storage.objects;
CREATE POLICY "Authenticated can delete reading tips covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reading_tips');

COMMIT;
