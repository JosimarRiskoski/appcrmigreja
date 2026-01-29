-- Remover estágios obsoletos dos visitantes
-- Mapeamentos:
--   segunda_visita   -> feito_contato
--   frequentando     -> pronto_integrar

UPDATE public.visitors
SET status = 'feito_contato'
WHERE status = 'segunda_visita';

UPDATE public.visitors
SET status = 'pronto_integrar'
WHERE status = 'frequentando';

-- Observação: histórico (campo JSON) não é alterado.