-- EW Academy — soporte para CRUD real del admin (Fase 3)
-- Correr en el SQL Editor de Supabase, después de 0001_init.sql y 0002_auth.sql.

-- ── Borrar un curso borra sus matrículas ────────────────────────────────────
-- El diálogo de confirmación del admin dice explícitamente "se elimina...
-- el vínculo con N matrículas" — el modelo original tenía "on delete restrict",
-- que en los hechos bloquearía el borrado de cualquier curso con alumnos.

alter table enrollments drop constraint enrollments_course_code_fkey;
alter table enrollments
  add constraint enrollments_course_code_fkey
  foreign key (course_code) references courses (code) on delete cascade;

-- ── audit_log: el admin puede leer y escribir auditoría ────────────────────

create policy "Un admin lee la auditoría"
  on audit_log for select
  to authenticated
  using (is_admin());

create policy "Un admin escribe en la auditoría"
  on audit_log for insert
  to authenticated
  with check (is_admin());

-- ── receipts: el admin gestiona la cola de comprobantes ────────────────────

create policy "Un admin gestiona los comprobantes"
  on receipts for all
  to authenticated
  using (is_admin())
  with check (is_admin());
