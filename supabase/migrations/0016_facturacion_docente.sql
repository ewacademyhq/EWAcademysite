-- EW Academy — facturación y liquidación para docentes (Fase 2, pedido O2)
-- Correr en el SQL Editor de Supabase, después de 0001-0015.
--
-- No existía ningún lugar donde un docente pudiera ver cuánto le corresponde
-- cobrar ni subir su factura del mes. Sigue el mismo patrón que `receipts` +
-- el bucket `comprobantes` (0004_checkout.sql), pero para docentes.

create table facturas (
  id bigint generated always as identity primary key,
  docente_id uuid not null references users (id) on delete cascade,
  periodo date not null,
  monto numeric(12, 2) not null,
  archivo_url text not null,
  estado text not null default 'pendiente',
  subido_at timestamptz not null default now(),
  unique (docente_id, periodo)
);

alter table facturas enable row level security;

create policy "Un docente ve y sube sus propias facturas"
  on facturas for all
  to authenticated
  using (docente_id = auth.uid())
  with check (docente_id = auth.uid());

create policy "Un admin lee todas las facturas"
  on facturas for select
  to authenticated
  using (is_admin());

-- ── Bucket de Storage para los archivos de factura ─────────────────────────
-- Privado, misma convención de ruta que `comprobantes`: facturas/<docente_id>/<archivo>.

insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', false)
on conflict (id) do nothing;

create policy "Un docente sube su factura a su propia carpeta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'facturas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Un docente lee sus propias facturas"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'facturas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Un admin lee todas las facturas subidas"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'facturas' and is_admin());
