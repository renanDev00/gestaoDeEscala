DO $$
DECLARE
  activity_id_type text;
BEGIN
  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO activity_id_type
  FROM pg_attribute AS attribute
  WHERE attribute.attrelid = 'public.atividades'::regclass
    AND attribute.attname = 'id'
    AND NOT attribute.attisdropped;

  IF activity_id_type IS NULL THEN
    RAISE EXCEPTION 'Não foi possível encontrar public.atividades.id';
  END IF;

  EXECUTE format(
    'ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS atividade_id %s REFERENCES public.atividades(id) ON DELETE SET NULL',
    activity_id_type
  );
END $$;

ALTER TABLE public.atividades
  ADD COLUMN IF NOT EXISTS todos_setores boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS funcionarios_atividade_id_idx
  ON public.funcionarios (atividade_id);

NOTIFY pgrst, 'reload schema';