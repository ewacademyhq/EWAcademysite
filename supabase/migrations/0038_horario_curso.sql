-- EW Academy — horario semanal de un curso (cohorte) + choque bloqueante
-- Correr en el SQL Editor de Supabase, después de 0001-0037.
--
-- Hasta ahora `fecha_inicio` era solo una fecha, sin hora, y no existía
-- ningún concepto de "qué días de la semana" se dicta un curso. El docente
-- tampoco podía cargar nada de esto al proponer — lo fijaba el admin recién
-- al aprobar la estructura. Ver docs/SPEC.md EWA-067/068/069 e
-- IMPLEMENTATION_PLAN.md Fase 19.
--
-- Nuevo: `dias_semana` (días ISO 1=lunes..7=domingo) + `hora_inicio` (una
-- sola hora para todos esos días) por curso de cohorte. De ahí se deriva
-- el patrón semanal completo de clases, que se chequea contra el de
-- cualquier otro curso vivo (propuesta/aprobada/publicado) — hay una sola
-- cuenta de Zoom para toda la academia, dos clases en simultáneo la
-- desconectan. Clase real: 120 minutos + 20 de margen = 140 minutos de
-- diferencia mínima entre dos horarios (ver src/lib/schedule.ts, misma
-- constante replicada acá porque el trigger corre en la base).

alter table courses add column dias_semana smallint[];
alter table courses add column hora_inicio time;

alter table courses add constraint courses_dias_semana_valido
  check (
    dias_semana is null
    or (array_length(dias_semana, 1) between 1 and 7 and dias_semana <@ array[1,2,3,4,5,6,7]::smallint[])
  );

-- Última fecha (inclusive) en la que puede caer una clase del patrón
-- semanal: `fecha_fin` si se cargó, o si no, `fecha_inicio` + la cantidad de
-- semanas que hacen falta para dar `clases_totales` clases a razón de
-- `array_length(dias_semana,1)` por semana.
create or replace function fin_efectivo_cohorte(
  p_fecha_inicio date,
  p_fecha_fin date,
  p_clases_totales integer,
  p_dias_semana smallint[]
) returns date
language sql
immutable
as $$
  select case
    when p_fecha_fin is not null then p_fecha_fin
    when p_fecha_inicio is null or p_clases_totales is null or p_clases_totales <= 0
      or p_dias_semana is null or coalesce(array_length(p_dias_semana, 1), 0) = 0
      then null
    else p_fecha_inicio + (ceil(p_clases_totales::numeric / array_length(p_dias_semana, 1)) * 7)::integer
  end;
$$;

create or replace function courses_check_schedule_conflict()
returns trigger
language plpgsql
as $$
declare
  v_fin_nuevo date;
  v_conflicto record;
begin
  -- Solo aplica a cohortes con horario semanal cargado y todavía "vivos" —
  -- una propuesta rechazada no reserva nada, y un autogestionado no tiene
  -- clases en vivo recurrentes.
  if new.modalidad is distinct from 'cohorte'
     or new.dias_semana is null
     or new.hora_inicio is null
     or new.fecha_inicio is null
     or new.estado not in ('propuesta', 'aprobada', 'publicado') then
    return new;
  end if;

  v_fin_nuevo := fin_efectivo_cohorte(new.fecha_inicio, new.fecha_fin, new.clases_totales, new.dias_semana);

  select c.code, c.titulo
  into v_conflicto
  from courses c
  where c.code <> new.code
    and c.modalidad = 'cohorte'
    and c.estado in ('propuesta', 'aprobada', 'publicado')
    and c.dias_semana is not null
    and c.hora_inicio is not null
    and c.fecha_inicio is not null
    and c.dias_semana && new.dias_semana
    and abs(extract(epoch from (c.hora_inicio - new.hora_inicio)) / 60) < 140
    and c.fecha_inicio <= coalesce(v_fin_nuevo, 'infinity'::date)
    and coalesce(fin_efectivo_cohorte(c.fecha_inicio, c.fecha_fin, c.clases_totales, c.dias_semana), 'infinity'::date) >= new.fecha_inicio
  limit 1;

  if v_conflicto.code is not null then
    raise exception 'Choca con el horario de "%" (%) — una sola cuenta de Zoom no puede dar dos clases en simultáneo (hacen falta al menos 140 minutos de diferencia).', v_conflicto.titulo, v_conflicto.code;
  end if;

  return new;
end;
$$;

create trigger courses_schedule_conflict_check
  before insert or update on courses
  for each row
  execute function courses_check_schedule_conflict();
