-- Fix de paso, encontrado por el linter de seguridad de Supabase después de
-- correr 0038: `fin_efectivo_cohorte()` y `courses_check_schedule_conflict()`
-- quedaron sin `search_path` fijo (mismo warning que ya tenían, sin resolver,
-- `set_updated_at()`/`enforce_estado_transition()` — no se tocan esas, fuera
-- de alcance de este cambio, pero las funciones nuevas sí lo corrigen).

alter function fin_efectivo_cohorte(date, date, integer, smallint[]) set search_path = public, pg_temp;
alter function courses_check_schedule_conflict() set search_path = public, pg_temp;
