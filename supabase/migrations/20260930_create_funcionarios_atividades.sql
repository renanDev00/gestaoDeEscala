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
    'CREATE TABLE IF NOT EXISTS public.funcionarios_atividades (
      funcionario_id %s NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
      atividade_id %s NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (funcionario_id, atividade_id)
    )',
    funcionario_id_type,
    atividade_id_type
  );
END $$;

INSERT INTO public.funcionarios_atividades (funcionario_id, atividade_id)
SELECT id, atividade_id
FROM public.funcionarios
WHERE atividade_id IS NOT NULL
ON CONFLICT (funcionario_id, atividade_id) DO NOTHING;

ALTER TABLE public.funcionarios_atividades ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.funcionarios_atividades TO authenticated;

DROP POLICY IF EXISTS funcionarios_atividades_select
  ON public.funcionarios_atividades;
CREATE POLICY funcionarios_atividades_select
  ON public.funcionarios_atividades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios AS funcionario
      WHERE funcionario.id = funcionario_id
    )
    AND EXISTS (
      SELECT 1 FROM public.atividades AS atividade
      WHERE atividade.id = atividade_id
    )
  );

DROP POLICY IF EXISTS funcionarios_atividades_insert
  ON public.funcionarios_atividades;
CREATE POLICY funcionarios_atividades_insert
  ON public.funcionarios_atividades
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funcionarios AS funcionario
      WHERE funcionario.id = funcionario_id
    )
    AND EXISTS (
      SELECT 1 FROM public.atividades AS atividade
      WHERE atividade.id = atividade_id
    )
  );

DROP POLICY IF EXISTS funcionarios_atividades_delete
  ON public.funcionarios_atividades;
CREATE POLICY funcionarios_atividades_delete
  ON public.funcionarios_atividades
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.funcionarios AS funcionario
      WHERE funcionario.id = funcionario_id
    )
  );

CREATE INDEX IF NOT EXISTS funcionarios_atividades_atividade_id_idx
  ON public.funcionarios_atividades (atividade_id);

NOTIFY pgrst, 'reload schema';