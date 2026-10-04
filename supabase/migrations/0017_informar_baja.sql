-- EW Academy — informar baja de un curso, con 30 días de aviso (Fase 3, pedido O4)
-- Correr en el SQL Editor de Supabase, después de 0001-0016.
--
-- El alumno puede avisar que se da de baja, pero la matrícula no se cierra
-- al toque — queda un margen de 30 días para que la academia resuelva la
-- situación del docente (reemplazo, etc.). Reusa el mismo mecanismo que ya
-- cierra una cohorte por fecha de fin (check_mora_y_finalizacion(), Fase 5):
-- no hace falta un estado nuevo, alcanza con guardar cuándo se pidió la baja.

alter table enrollments add column baja_solicitada_at timestamptz;

-- ── Alta/baja de la solicitud, desde la sesión del propio alumno ───────────
-- No hay policy de update para el alumno en enrollments (solo select/insert),
-- así que esto va por una función security definer que valida el dueño a
-- mano, igual que force_estado_change() en 0013_estado_transiciones.sql.

create function request_baja(p_enrollment_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update enrollments
  set baja_solicitada_at = now()
  where id = p_enrollment_id
    and user_id = auth.uid()
    and estado in ('activa', 'mora')
    and baja_solicitada_at is null;

  if not found then
    raise exception 'No se pudo registrar la baja (la matrícula no es tuya, no está activa, o ya tiene una baja pedida).';
  end if;
end;
$$;

create function cancel_baja(p_enrollment_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update enrollments
  set baja_solicitada_at = null
  where id = p_enrollment_id
    and user_id = auth.uid()
    and baja_solicitada_at is not null;

  if not found then
    raise exception 'No se pudo cancelar la baja.';
  end if;
end;
$$;

-- ── Cierre automático a los 30 días ─────────────────────────────────────────
-- Mismo cron diario (0006_mora_automation.sql), se le agrega un tercer bloque
-- simétrico al de fin de cohorte: activa -> finalizada, mora -> deuda.

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

  with candidatas as (
    select e.id, e.estado as estado_previo
    from enrollments e
    where e.baja_solicitada_at is not null
      and e.baja_solicitada_at + interval '30 days' <= now()
      and e.estado in ('activa', 'mora')
  ),
  actualizadas as (
    update enrollments e
    set estado = (case when candidatas.estado_previo = 'mora' then 'deuda' else 'finalizada' end)::estado_matricula
    from candidatas
    where e.id = candidatas.id
    returning e.id, candidatas.estado_previo, e.estado as estado_nuevo
  )
  insert into audit_log (entity, entity_id, de, a, usuario_id, nota)
  select 'enrollment', id::text, estado_previo, estado_nuevo, null, 'Baja solicitada por el alumno, efectiva a los 30 días' from actualizadas;
end;
$$;
