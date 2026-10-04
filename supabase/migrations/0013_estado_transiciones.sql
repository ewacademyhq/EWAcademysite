-- EW Academy — reglas de transición para enrollments.estado (Fase 1 QA, hallazgo Q2)
-- Correr en el SQL Editor de Supabase, después de 0001-0012.
--
-- Hoy el admin puede cambiar el estado de una matrícula a cualquier otro
-- valor sin restricción (incluso revertir una "finalizada"/"con deuda", que
-- debería ser terminal). El cron check_mora_y_finalizacion()
-- (0007_mora_automation_fix.sql) sigue funcionando igual: sus transiciones
-- (activa→mora, activa→finalizada, mora→deuda) están en la lista blanca de
-- abajo, así que el trigger nunca lo bloquea.

alter table audit_log add column nota text;

create function enforce_estado_transition()
returns trigger
language plpgsql
as $$
begin
  if new.estado = old.estado then
    return new;
  end if;

  -- Escape hatch para correcciones legítimas de un error de carga: lo activa
  -- force_estado_change() (abajo), nunca se setea desde el cliente directo.
  if current_setting('app.override_estado', true) = 'true' then
    return new;
  end if;

  if (old.estado = 'pendiente' and new.estado = 'activa')
    or (old.estado = 'activa' and new.estado = 'mora')
    or (old.estado = 'mora' and new.estado = 'activa')
    or (old.estado = 'activa' and new.estado = 'finalizada')
    or (old.estado = 'mora' and new.estado = 'deuda')
  then
    return new;
  end if;

  raise exception
    'Transición de estado no permitida: % -> % (usá "Forzar corrección" si es un error de carga)',
    old.estado, new.estado;
end;
$$;

create trigger enrollments_enforce_estado_transition
  before update on enrollments
  for each row
  when (old.estado is distinct from new.estado)
  execute function enforce_estado_transition();

-- ── Corrección forzada ──────────────────────────────────────────────────────
-- Único camino para una transición fuera de la lista blanca (ej. sacar una
-- matrícula de "finalizada" porque se cargó mal una fecha). Security definer
-- para poder setear app.override_estado y que el trigger la deje pasar;
-- valida is_admin() a mano porque bypassea RLS igual que cualquier función
-- security definer de este archivo de migraciones.

create function force_estado_change(
  p_enrollment_id bigint,
  p_nuevo_estado estado_matricula,
  p_nota text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior estado_matricula;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_nota is null or btrim(p_nota) = '' then
    raise exception 'La corrección forzada necesita un motivo';
  end if;

  select estado into v_anterior from enrollments where id = p_enrollment_id;
  if v_anterior is null then
    raise exception 'Matrícula % no existe', p_enrollment_id;
  end if;

  perform set_config('app.override_estado', 'true', true);

  update enrollments set estado = p_nuevo_estado where id = p_enrollment_id;

  insert into audit_log (entity, entity_id, de, a, usuario_id, nota)
  values ('enrollment', p_enrollment_id::text, v_anterior::text, p_nuevo_estado::text, auth.uid(), p_nota);
end;
$$;
