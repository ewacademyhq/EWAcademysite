-- EW Academy — completar un módulo actualiza el progreso real (Fase 6)
-- Correr en el SQL Editor de Supabase, después de 0001-0008.
--
-- Encontrado probando: marcar un módulo como completo actualizaba
-- module_progress bien (el alumno tiene permiso de sobra ahí), pero
-- `enrollments.progreso` se quedaba en 0 — un alumno no tiene (ni debe
-- tener, mismo criterio que en 0005) permiso de UPDATE general sobre su
-- propia fila de enrollments, así que ese segundo update fallaba en
-- silencio. En vez de abrir un permiso amplio, esta función hace las dos
-- cosas en una transacción con `security definer`, verificando ella misma
-- que la matrícula sea del usuario autenticado.

create or replace function complete_my_module(p_enrollment_id bigint, p_module_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_code text;
  v_total integer;
  v_done integer;
  v_pct integer;
begin
  select course_code into v_course_code
  from enrollments
  where id = p_enrollment_id and user_id = auth.uid();

  if v_course_code is null then
    raise exception 'No autorizado';
  end if;

  insert into module_progress (enrollment_id, module_id, estado)
  values (p_enrollment_id, p_module_id, 'completo')
  on conflict (enrollment_id, module_id) do update set estado = 'completo';

  select count(*) into v_total from modules where course_code = v_course_code;
  select count(*) into v_done
  from module_progress mp
  join modules m on m.id = mp.module_id
  where mp.enrollment_id = p_enrollment_id
    and mp.estado = 'completo'
    and m.course_code = v_course_code;

  v_pct := case when v_total > 0 then round(v_done::numeric / v_total * 100) else 0 end;

  update enrollments set progreso = v_pct where id = p_enrollment_id;

  return v_pct;
end;
$$;
