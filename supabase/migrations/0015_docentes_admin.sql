-- EW Academy — panel de administración de docentes (Fase 1 QA, hallazgo Q17-19)
-- Correr en el SQL Editor de Supabase, después de 0001-0014.
--
-- No existía ninguna UI para dar de alta/baja o listar docentes — la única
-- vía era el script scripts/set-role.ts. Tampoco había columna para marcar
-- un usuario como inactivo, ni policies de insert/update sobre `users` para
-- el admin (solo había policies de select).

alter table users add column activo boolean not null default true;

create policy "Un admin crea usuarios de staff"
  on users for insert
  to authenticated
  with check (is_admin());

create policy "Un admin actualiza usuarios"
  on users for update
  to authenticated
  using (is_admin())
  with check (is_admin());
