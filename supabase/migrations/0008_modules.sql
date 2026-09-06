-- EW Academy — módulos reales por curso y progreso del alumno (Fase 6)
-- Correr en el SQL Editor de Supabase, después de 0001-0007.

-- ── modules: alta/edición/borrado exclusivos del admin ─────────────────────
-- (el select público ya lo definió 0001_init.sql)

create policy "Un admin gestiona los módulos"
  on modules for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── module_progress: cada alumno gestiona su propio progreso ───────────────
-- Es autoreportado (el alumno marca "completado"), no un dato crítico de
-- seguridad como una matrícula o un pago — el peor caso es que alguien se
-- salte su propio ritmo, no que evada un pago.

create policy "Un alumno ve su propio progreso"
  on module_progress for select
  to authenticated
  using (
    exists (
      select 1 from enrollments
      where enrollments.id = module_progress.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );

create policy "Un alumno crea su propio progreso"
  on module_progress for insert
  to authenticated
  with check (
    exists (
      select 1 from enrollments
      where enrollments.id = module_progress.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );

create policy "Un alumno actualiza su propio progreso"
  on module_progress for update
  to authenticated
  using (
    exists (
      select 1 from enrollments
      where enrollments.id = module_progress.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from enrollments
      where enrollments.id = module_progress.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );

create policy "Un admin gestiona todo el progreso"
  on module_progress for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── payments: RLS habilitada desde 0001_init.sql pero sin ninguna policy —
-- nadie (ni el propio alumno) podía leer su historial de pagos hasta ahora.

create policy "Un alumno ve sus propios pagos"
  on payments for select
  to authenticated
  using (
    exists (
      select 1 from enrollments
      where enrollments.id = payments.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );

create policy "Un admin gestiona todos los pagos"
  on payments for all
  to authenticated
  using (is_admin())
  with check (is_admin());
