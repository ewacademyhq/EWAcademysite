-- EW Academy — gestión de verticales desde el admin
-- Correr en el SQL Editor de Supabase, después de 0001-0031.
--
-- Hasta ahora `verticales` solo tenía política de lectura pública y de
-- insert para admin — nadie podía editar ni borrar una vertical, ni desde
-- el admin ni con una query directa vía RLS.

create policy "Un admin edita verticales"
  on verticales for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Un admin borra verticales"
  on verticales for delete
  to authenticated
  using (is_admin());

-- `courses.vertical` referencia `verticales.nombre` (la primary key). Sin
-- `on update cascade`, renombrar una vertical rompería el FK en cuanto
-- algún curso la usara. Con cascade, renombrar actualiza sola la columna
-- `vertical` de esos cursos.
alter table courses drop constraint courses_vertical_fkey;
alter table courses add constraint courses_vertical_fkey
  foreign key (vertical) references verticales (nombre) on update cascade;
