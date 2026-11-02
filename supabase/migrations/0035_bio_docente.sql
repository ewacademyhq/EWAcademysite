-- EW Academy — bio real del docente, visible en la ficha del curso
-- Correr en el SQL Editor de Supabase, después de 0001-0034.

alter table users add column bio text;

-- Mismo patrón que set_my_course_drive_folder (0011_fase7.sql): función
-- acotada para que cualquier usuario autenticado pueda editar SU PROPIA
-- bio, sin abrir un UPDATE general sobre `users` (que tiene rol, email,
-- activo — columnas que siguen siendo exclusivas del admin).
create or replace function set_my_bio(p_bio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update users
  set bio = nullif(trim(p_bio), '')
  where id = auth.uid();
end;
$$;

grant execute on function set_my_bio(text) to authenticated;
