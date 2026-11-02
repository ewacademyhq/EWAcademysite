-- EW Academy — flujo de propuestas de curso del docente
-- Correr en el SQL Editor de Supabase, después de 0001-0032.
--
-- Hasta ahora solo el admin podía crear cursos y cargar módulos. Nuevo
-- flujo de 2 pasos: el docente propone la estructura (título, descripción,
-- vertical, modalidad, duración, módulos) -> el admin aprueba y completa los
-- términos comerciales (precio, comisión, pago, cupo, fechas) -> el docente
-- carga el contenido de los módulos -> el admin aprueba la publicación.
-- Un curso creado directo por el admin se salta todo esto (estado 'publicado'
-- desde el vamos, es el default).

alter table courses add column estado text not null default 'publicado'
  check (estado in ('propuesta', 'rechazada', 'aprobada', 'publicado'));

alter table courses add column motivo_rechazo text;

-- El docente puede gestionar los módulos de sus propios cursos (antes era
-- exclusivo del admin, ver 0008_modules.sql) — necesario para que pueda
-- cargar el contenido una vez aprobada la estructura. Mismo patrón de
-- ownership que ya usa "Un docente gestiona las sesiones de sus cursos"
-- (0011_fase7.sql).
create policy "Un docente gestiona los módulos de sus cursos"
  on modules for all
  to authenticated
  using (
    exists (
      select 1 from courses
      where courses.code = modules.course_code
        and courses.docente_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from courses
      where courses.code = modules.course_code
        and courses.docente_id = auth.uid()
    )
  );
