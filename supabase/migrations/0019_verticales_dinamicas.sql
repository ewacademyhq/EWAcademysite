-- EW Academy — verticales dinámicas (Fase 3, hallazgo QA Q8)
-- Correr en el SQL Editor de Supabase, después de 0001-0018.
--
-- "Vertical" era una lista fija de 4 valores (enum vertical_curso). Para que
-- el admin pueda sumar una vertical nueva desde la UI sin tocar código, se
-- reemplaza por una tabla editable.

create table verticales (
  nombre text primary key,
  prefijo text not null unique check (prefijo = upper(prefijo))
);

insert into verticales (nombre, prefijo) values
  ('Ciberseguridad', 'CIBER'),
  ('QA', 'QA'),
  ('IA', 'IA'),
  ('Videojuegos', 'GAME');

alter table verticales enable row level security;

create policy "Las verticales son de lectura pública"
  on verticales for select
  to anon, authenticated
  using (true);

create policy "Un admin crea verticales"
  on verticales for insert
  to authenticated
  with check (is_admin());

-- ── courses.vertical pasa de enum a referencia a la tabla nueva ────────────

alter table courses alter column vertical type text using vertical::text;
alter table courses add constraint courses_vertical_fkey
  foreign key (vertical) references verticales (nombre);

drop type vertical_curso;
