-- EW Academy — endurecimiento de RLS encontrado probando la Fase 4
-- Correr en el SQL Editor de Supabase, después de 0001-0004.
--
-- Problema: las policies de insert de 0004_checkout.sql dejaban que un
-- alumno autenticado insertara su propia fila de `enrollments` o `receipts`
-- con CUALQUIER estado (incluido 'activa'/'aprobado'), porque el WITH CHECK
-- solo validaba el dueño (auth.uid() = user_id), no el valor de `estado`.
-- Activar una matrícula tiene que ser un privilegio del sistema de pagos
-- (service_role, como ya hace el webhook y la ruta de checkout), nunca algo
-- que la propia sesión del alumno pueda hacer llamando a la API directo.

drop policy "Un alumno crea su propia matrícula" on enrollments;

create policy "Un alumno crea su propia matrícula pendiente"
  on enrollments for insert
  to authenticated
  with check (auth.uid() = user_id and estado = 'pendiente');

drop policy "Un alumno sube su propio comprobante" on receipts;

create policy "Un alumno sube su propio comprobante pendiente"
  on receipts for insert
  to authenticated
  with check (
    estado = 'pendiente'
    and exists (
      select 1 from enrollments
      where enrollments.id = receipts.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );
