-- La tabla payments tiene RLS habilitada desde 0001_init.sql pero nunca tuvo
-- políticas reales aplicadas en la base (0008_modules.sql las define, pero
-- quedaron sin correr) — el alumno nunca podía leer su propio historial de
-- pagos. Confirmado en vivo: un pago real por Mercado Pago se insertaba bien
-- en la tabla, pero /panel mostraba "Todavía no hay pagos registrados" para
-- cualquier alumno, siempre.

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
