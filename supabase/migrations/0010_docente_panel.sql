-- EW Academy — wiring de /docente a datos reales (Fase 6b)
-- Correr en el SQL Editor de Supabase, después de 0001-0009.
--
-- El docente ya podía leer sus propias matrículas (0002_auth.sql), pero le
-- faltaban dos policies de lectura para armar el panel con datos reales:
-- el nombre de sus alumnos (tabla `users`, sin policy para terceros salvo
-- admin) y los comprobantes pendientes de sus cursos (tabla `receipts`,
-- solo tenía policies para el propio alumno y para el admin).

create policy "Un docente ve a los alumnos de sus cursos"
  on users for select
  to authenticated
  using (
    exists (
      select 1
      from enrollments
      join courses on courses.code = enrollments.course_code
      where enrollments.user_id = users.id
        and courses.docente_id = auth.uid()
    )
  );

create policy "Un docente ve los comprobantes de sus cursos"
  on receipts for select
  to authenticated
  using (
    exists (
      select 1
      from enrollments
      join courses on courses.code = enrollments.course_code
      where enrollments.id = receipts.enrollment_id
        and courses.docente_id = auth.uid()
    )
  );
