-- EW Academy — automatización de mora y finalización de cohortes (Fase 5)
-- Correr en el SQL Editor de Supabase, después de 0001-0005.
--
-- Regla de negocio (docs/SPEC.md §4): la cuota vence el día 10 de cada mes;
-- pasados `gracia_dias` (por curso, default 5) sin pago del período vigente,
-- la matrícula pasa a mora y su cuota deja de estar congelada — la próxima
-- toma el precio de lista vigente. Al llegar `courses.fecha_fin` (cohortes),
-- la matrícula se cierra sola: 'finalizada' si estaba al día, 'deuda' si
-- estaba en mora.
--
-- Nota de huso horario: usa `current_date` de Postgres (UTC en Supabase),
-- no la hora de Argentina — puede haber unas horas de diferencia justo
-- alrededor de la medianoche. Aceptable para una revisión diaria; si hace
-- falta más precisión, ajustar con `timezone('America/Argentina/Buenos_Aires', now())`.

create or replace function check_mora_y_finalizacion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vencimiento date := (date_trunc('month', current_date) + interval '9 days')::date; -- día 10 de este mes
begin
  -- 1) Activa -> Mora: pasó el vencimiento + los días de gracia del curso,
  --    y no hay un pago registrado dentro de este período. La cuota pasa a
  --    valer el precio de lista vigente (regla del handoff).
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

  -- 2) Fin de cohorte: activa -> finalizada, mora -> finalizada con deuda.
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
    set estado = case when candidatas.estado_previo = 'mora' then 'deuda' else 'finalizada' end
    from candidatas
    where e.id = candidatas.id
    returning e.id, candidatas.estado_previo, e.estado as estado_nuevo
  )
  insert into audit_log (entity, entity_id, de, a, usuario_id)
  select 'enrollment', id::text, estado_previo, estado_nuevo, null from actualizadas;
end;
$$;

-- pg_cron: si el "create extension" falla por permisos, activarlo desde
-- Database → Extensions → pg_cron en el dashboard y correr de nuevo solo
-- el "select cron.schedule(...)" de más abajo.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'ew-academy-mora-diaria',
  '0 9 * * *', -- todos los días a las 09:00 UTC (06:00 ART)
  $$select check_mora_y_finalizacion();$$
);
