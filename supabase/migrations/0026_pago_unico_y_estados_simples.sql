-- Pago único por curso en vez de cuota mensual recurrente: ya no hay mora
-- ni período de gracia, "estado_matricula" se achica a pendiente/activa/
-- finalizada. Se agrega a courses lo que hace falta para el pago a
-- docentes prorrateado (clases_totales) y para deprecar autogestionados
-- sin actualizar (contenido_actualizado_at).
--
-- Nota: el SQL Editor de Supabase corre todo el script pegado como una
-- sola transacción — si una sola línea falla, se revierte el script
-- entero (confirmado en vivo: dos intentos anteriores de este archivo
-- fallaron a mitad de camino por objetos dependientes de la columna
-- "estado" — primero una policy, después un trigger — y ninguno de los
-- dos dejó rastro, todo volvió exactamente al estado anterior). Por eso
-- el archivo final saca los dos objetos dependientes ANTES del alter.

-- ── 1. Backfill, mientras la columna todavía es el enum viejo ──────────────
update enrollments set estado = 'activa' where estado = 'mora';
update enrollments set estado = 'finalizada' where estado = 'deuda';

-- ── 2. Sacar los objetos que dependen de la columna "estado" ───────────────
drop policy "Un alumno crea su propia matrícula pendiente" on enrollments;
drop trigger enrollments_enforce_estado_transition on enrollments;

-- ── 3. enrollments.estado: enum -> text + check (mismo patrón que se usó
-- para "vertical_curso" en 0019_verticales_dinamicas.sql) ──────────────────
alter table enrollments alter column estado drop default;
alter table enrollments alter column estado type text using estado::text;
alter table enrollments alter column estado set default 'pendiente';
alter table enrollments add constraint enrollments_estado_check
  check (estado in ('pendiente', 'activa', 'finalizada'));

-- ── 4. Recrear la policy, ahora contra la columna "text" ────────────────────
create policy "Un alumno crea su propia matrícula pendiente"
  on enrollments for insert
  to authenticated
  with check (auth.uid() = user_id and estado = 'pendiente');

-- ── 5. Trigger de transiciones: solo pendiente->activa y activa->finalizada ─
create or replace function enforce_estado_transition()
returns trigger
language plpgsql
as $$
begin
  if new.estado = old.estado then
    return new;
  end if;

  if current_setting('app.override_estado', true) = 'true' then
    return new;
  end if;

  if (old.estado = 'pendiente' and new.estado = 'activa')
    or (old.estado = 'activa' and new.estado = 'finalizada')
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

-- ── 6. force_estado_change() con "text" en vez del enum ────────────────────
drop function force_estado_change(bigint, estado_matricula, text);
create function force_estado_change(
  p_enrollment_id bigint,
  p_nuevo_estado text,
  p_nota text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior text;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_nota is null or btrim(p_nota) = '' then
    raise exception 'La corrección forzada necesita un motivo';
  end if;

  if p_nuevo_estado not in ('pendiente', 'activa', 'finalizada') then
    raise exception 'Estado inválido: %', p_nuevo_estado;
  end if;

  select estado into v_anterior from enrollments where id = p_enrollment_id;
  if v_anterior is null then
    raise exception 'Matrícula % no existe', p_enrollment_id;
  end if;

  perform set_config('app.override_estado', 'true', true);

  update enrollments set estado = p_nuevo_estado where id = p_enrollment_id;

  insert into audit_log (entity, entity_id, de, a, usuario_id, nota)
  values ('enrollment', p_enrollment_id::text, v_anterior, p_nuevo_estado, auth.uid(), p_nota);
end;
$$;

-- ── 7. Cron diario: se saca el bloque de mora, los otros dos (fin de
-- cohorte, baja a los 30 días) quedan en activa->finalizada simple, sin la
-- rama ->deuda. Mismo nombre de función, mismo cron ya agendado ───────────
create or replace function check_mora_y_finalizacion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Fin de cohorte.
  with candidatas as (
    select e.id
    from enrollments e
    join courses c on c.code = e.course_code
    where c.modalidad = 'cohorte'
      and c.fecha_fin is not null
      and c.fecha_fin < current_date
      and e.estado = 'activa'
  ),
  actualizadas as (
    update enrollments e
    set estado = 'finalizada'
    from candidatas
    where e.id = candidatas.id
    returning e.id
  )
  insert into audit_log (entity, entity_id, de, a, usuario_id)
  select 'enrollment', id::text, 'activa', 'finalizada', null from actualizadas;

  -- Baja solicitada, efectiva a los 30 días.
  with candidatas as (
    select e.id
    from enrollments e
    where e.baja_solicitada_at is not null
      and e.baja_solicitada_at + interval '30 days' <= now()
      and e.estado = 'activa'
  ),
  actualizadas as (
    update enrollments e
    set estado = 'finalizada'
    from candidatas
    where e.id = candidatas.id
    returning e.id
  )
  insert into audit_log (entity, entity_id, de, a, usuario_id, nota)
  select 'enrollment', id::text, 'activa', 'finalizada', null,
    'Baja solicitada por el alumno, efectiva a los 30 días' from actualizadas;
end;
$$;

-- ── 8. request_baja(): solo se puede pedir desde "activa" ──────────────────
create or replace function request_baja(p_enrollment_id bigint)
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
    and estado = 'activa'
    and baja_solicitada_at is null;

  if not found then
    raise exception 'No se pudo registrar la baja (la matrícula no es tuya, no está activa, o ya tiene una baja pedida).';
  end if;
end;
$$;

-- ── 9. El enum ya no lo referencia nada ─────────────────────────────────────
drop type estado_matricula;

-- ── 10. Nuevas columnas en courses. clases_totales obligatorio para
-- cohorte, pero como "not valid" para no romper con los cursos cohorte que
-- ya existen sin este dato (QA-140, IA-320, DATA-101, GAME-140, CIBER-101
-- al momento de esta migración) — el formulario del admin ya lo exige como
-- campo requerido la próxima vez que se edite cada uno ─────────────────────
alter table courses
  add column clases_totales integer,
  add column contenido_actualizado_at timestamptz not null default now();

alter table courses add constraint courses_clases_totales_check
  check (modalidad <> 'cohorte' or clases_totales is not null) not valid;
alter table courses add constraint courses_clases_totales_positive
  check (clases_totales is null or clases_totales > 0);

-- mora_tipo/mora_valor/gracia_dias de courses quedan sin usar por ahora (no
-- se dropean acá) — dropear columnas es irreversible; se sacan en una
-- migración aparte una vez que esto esté corriendo tranquilo unos días.
