DO $$
DECLARE
  funcionario_id_type text;
  atividade_id_type text;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO funcionario_id_type
  FROM pg_attribute AS attribute
  WHERE attribute.attrelid = 'public.funcionarios'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO atividade_id_type
  FROM pg_attribute AS attribute
  WHERE attribute.attrelid = 'public.atividades'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF funcionario_id_type IS NULL OR atividade_id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível encontrar as colunas id de funcionarios ou atividades';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.atividade_fixa_ranking (
      atividade_id %s NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
      funcionario_id %s NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
      posicao integer NOT NULL CHECK (posicao > 0),
      desconsiderado boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (atividade_id, funcionario_id)
    )',
    atividade_id_type,
    funcionario_id_type
  );
END $$;

ALTER TABLE public.atividade_fixa_ranking ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.atividade_fixa_ranking TO authenticated;

DROP POLICY IF EXISTS atividade_fixa_ranking_select
  ON public.atividade_fixa_ranking;
CREATE POLICY atividade_fixa_ranking_select
  ON public.atividade_fixa_ranking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.atividades AS atividade
      WHERE atividade.id = atividade_id
    )
  );

DROP POLICY IF EXISTS atividade_fixa_ranking_insert
  ON public.atividade_fixa_ranking;
CREATE POLICY atividade_fixa_ranking_insert
  ON public.atividade_fixa_ranking
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.atividades AS atividade
      WHERE atividade.id = atividade_id AND atividade.tipo = 'fixa'
    )
    AND EXISTS (
      SELECT 1 FROM public.funcionarios AS funcionario
      WHERE funcionario.id = funcionario_id
    )
  );

DROP POLICY IF EXISTS atividade_fixa_ranking_delete
  ON public.atividade_fixa_ranking;
CREATE POLICY atividade_fixa_ranking_delete
  ON public.atividade_fixa_ranking
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.atividades AS atividade
      WHERE atividade.id = atividade_id AND atividade.tipo = 'fixa'
    )
  );

CREATE INDEX IF NOT EXISTS atividade_fixa_ranking_funcionario_idx
  ON public.atividade_fixa_ranking (funcionario_id);

NOTIFY pgrst, 'reload schema';