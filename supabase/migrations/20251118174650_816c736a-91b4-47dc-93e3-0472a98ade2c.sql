-- Criar tabela de células
CREATE TABLE public.cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  meeting_day text,
  meeting_time time,
  meeting_location text,
  status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'em_formacao', 'inativa')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

-- Policy para visualização
CREATE POLICY "Users can view cells of their church"
  ON public.cells FOR SELECT
  USING (church_id IN (
    SELECT church_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Policy para gerenciamento
CREATE POLICY "Admins and leaders can manage cells"
  ON public.cells FOR ALL
  USING (church_id IN (
    SELECT church_id FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'lider')
  ));

-- Adicionar coluna cell_id na tabela members
ALTER TABLE public.members 
ADD COLUMN cell_id uuid REFERENCES public.cells(id) ON DELETE SET NULL;

-- Criar trigger para updated_at em cells
CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON public.cells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();