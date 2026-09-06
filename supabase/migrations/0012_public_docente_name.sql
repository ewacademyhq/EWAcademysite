-- EW Academy — nombre del docente visible públicamente (encontrado en Fase 7)
-- Correr en el SQL Editor de Supabase, después de 0001-0011.
--
-- Bug real, arrastrado desde la Fase 2: `getCourses()`/`getCourseByCode()`
-- (landing, checkout, `/curso/[code]`) devolvían siempre `docente: "Sin
-- asignar"` a mano, aunque `courses.docente_id` ya se puede asignar desde
-- la Fase 3. Al conectar el join real (`docente:users!docente_id(nombre)`)
-- para esta fase, se encontró que igual venía vacío para un visitante
-- anónimo o un alumno: `users` no tenía ninguna policy que dejara ver el
-- nombre de un docente a nadie fuera de él mismo, del propio alumno
-- matriculado (ni eso) o del admin. El nombre del docente de un curso
-- publicado es información pública de marketing (ya se muestra en el
-- handoff/landing), así que se agrega una policy de solo lectura acotada
-- a "es docente de algún curso".

create policy "El nombre de un docente que dicta un curso es público"
  on users for select
  to anon, authenticated
  using (
    exists (
      select 1 from courses where courses.docente_id = users.id
    )
  );
