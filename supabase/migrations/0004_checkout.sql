-- EW Academy — matriculación real desde el checkout (Fase 4)
-- Correr en el SQL Editor de Supabase, después de 0001, 0002 y 0003.

-- ── Un alumno puede crear su propia matrícula ──────────────────────────────
-- (0002 ya le permite verla; faltaba el insert, que hasta ahora solo podía
-- hacer un admin vía la policy "for all" de enrollments).

create policy "Un alumno crea su propia matrícula"
  on enrollments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ── Un alumno sube y ve sus propios comprobantes ───────────────────────────

create policy "Un alumno sube su propio comprobante"
  on receipts for insert
  to authenticated
  with check (
    exists (
      select 1 from enrollments
      where enrollments.id = receipts.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );

create policy "Un alumno ve sus propios comprobantes"
  on receipts for select
  to authenticated
  using (
    exists (
      select 1 from enrollments
      where enrollments.id = receipts.enrollment_id
        and enrollments.user_id = auth.uid()
    )
  );

-- ── Bucket de Storage para comprobantes de transferencia ───────────────────
-- Privado: se accede siempre por URL firmada, nunca público.

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Convención de ruta: comprobantes/<user_id>/<archivo>. La primera carpeta
-- del path tiene que ser el uid de quien sube, así la policy lo valida solo.

create policy "Un alumno sube su comprobante a su propia carpeta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Un alumno lee sus propios comprobantes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Un admin lee todos los comprobantes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'comprobantes' and is_admin());
