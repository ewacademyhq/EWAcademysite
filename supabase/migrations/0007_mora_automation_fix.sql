-- EW Academy — corrige un error de tipos en check_mora_y_finalizacion() (Fase 5)
-- Correr en el SQL Editor de Supabase, después de 0006_mora_automation.sql.
--
-- Encontrado ejecutando la función a mano: el CASE que decide entre
-- 'deuda' y 'finalizada' se evalúa como `text`, pero `enrollments.estado`
-- es el enum `estado_matricula` — Postgres no lo castea solo dentro de un
-- CASE (sí lo hace con un literal suelto, por eso el primer UPDATE de la
-- función, el de mora, no tenía este problema).

create or replace function check_mora_y_finalizacion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vencimiento date := (date_trunc('month', current_date) + interval '9 days')::date; -- día 10 de este mes
begin
  with candidatas as (
    select e.id
    from enrollments e
    join courses c on c.code = e.course_code
    where e.estado = 'activa'
      and current_date > (vencimiento + c.gracia_dias)
      and (e.ultimo_pago_at is null or e.ultimo_pago_at < vencimiento)
  ),
  actualizadas as (
    update enrollments e
    set estado = 'mora',
        cuota_congelada = c.precio
    from candidatas, courses c
    where e.id = candidatas.id
      and c.code = e.course_code
    returning e.id
  )
  insert into audit_log (entity, entity_id, de, a, usuario_id)
  select 'enrollment', id::text, 'activa', 'mora', null from actualizadas;

  with candidatas as (
    select e.id, e.estado as estado_previo
    from enrollments e
    join courses c on c.code = e.course_code
    where c.modalidad = 'cohorte'
      and c.fecha_fin is not null
      and c.fecha_fin < current_date
      and e.estado in ('activa', 'mora')
  ),
  actualizadas as (
    update enrollments e
    set estado = (case when candidatas.estado_previo = 'mora' then 'deuda' else 'finalizada' end)::estado_matricula
    from candidatas
    where e.id = candidatas.id
    returning e.id, candidatas.estado_previo, e.estado as estado_nuevo
  )
  insert into audit_log (entity, entity_id, de, a, usuario_id)
  select 'enrollment', id::text, estado_previo, estado_nuevo, null from actualizadas;
end;
$$;
