-- Las policies de 0021 referenciaban `enrollment_id` sin calificar dentro de
-- la subconsulta — a diferencia de cómo se escribe en el resto del proyecto
-- (ver 0008_modules.sql, 0004_checkout.sql: siempre `<tabla>.<columna>`). La
-- de select se creó igual, pero la de insert ni llegó a crearse (por eso el
-- "new row violates row-level security policy" — no había ninguna policy de
-- insert en absoluto).
drop policy "El alumno ve sus propios certificados" on certificados;

create policy "El alumno ve sus propios certificados"
  on certificados for select
  to authenticated
  using (
    exists (
      select 1 from enrollments e
      where e.id = certificados.enrollment_id and e.user_id = auth.uid()
    )
  );

create policy "Se crea un certificado al pedirlo por primera vez"
  on certificados for insert
  to authenticated
  with check (
    exists (
      select 1 from enrollments e
      where e.id = certificados.enrollment_id
        and (e.user_id = auth.uid() or is_admin() or is_docente())
    )
  );
