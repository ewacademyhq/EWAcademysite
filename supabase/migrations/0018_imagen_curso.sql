-- EW Academy — imagen por curso (Fase 3, pedido O5)
-- Correr en el SQL Editor de Supabase, después de 0001-0017.
--
-- El catálogo público no mostraba ninguna imagen de curso. Bucket público
-- (los otros dos que existen, comprobantes y facturas, son privados) porque
-- esto se tiene que ver en la landing sin estar logueado.

alter table courses add column imagen_url text;

insert into storage.buckets (id, name, public)
values ('cursos', 'cursos', true)
on conflict (id) do nothing;

create policy "Un admin sube imágenes de curso"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cursos' and is_admin());

create policy "Un admin reemplaza imágenes de curso"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cursos' and is_admin())
  with check (bucket_id = 'cursos' and is_admin());

create policy "Un admin borra imágenes de curso"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cursos' and is_admin());
