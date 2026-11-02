-- EW Academy — arregla courses.vendidos (nunca se incrementaba, dato muerto
-- desde la Fase 1) y borra las columnas de mora que quedaron sin usar desde
-- que se sacó el sistema de mensualidad (0026_pago_unico_y_estados_simples.sql).
-- Correr en el SQL Editor de Supabase, después de 0001-0033.

-- Mismo patrón que increment_course_view (0011_fase7.sql): una función
-- acotada en vez de abrir UPDATE general sobre courses para quien activa
-- matrículas desde el cliente (admin, vía RLS normal).
create or replace function increment_course_vendidos(p_code text, p_cantidad integer default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update courses set vendidos = vendidos + p_cantidad where code = p_code;
end;
$$;

grant execute on function increment_course_vendidos(text, integer) to authenticated;

alter table courses drop column mora_tipo;
alter table courses drop column mora_valor;
alter table courses drop column gracia_dias;
drop type mora_tipo;
