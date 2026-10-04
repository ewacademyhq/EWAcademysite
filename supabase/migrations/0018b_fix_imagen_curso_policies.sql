-- EW Academy — re-crea las policies de storage para el bucket "cursos" (fix de 0018)
-- La subida de imagen falló con "new row violates row-level security policy":
-- el bucket "cursos" se creó bien, pero las 3 policies de insert/update/delete
-- no quedaron activas (probablemente la corrida de 0018 se cortó ahí). Esto
-- es seguro de re-correr: borra la policy si ya existe y la vuelve a crear.

drop policy if exists "Un admin sube imágenes de curso" on storage.objects;
create policy "Un admin sube imágenes de curso"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cursos' and is_admin());

drop policy if exists "Un admin reemplaza imágenes de curso" on storage.objects;
create policy "Un admin reemplaza imágenes de curso"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cursos' and is_admin())
  with check (bucket_id = 'cursos' and is_admin());

drop policy if exists "Un admin borra imágenes de curso" on storage.objects;
create policy "Un admin borra imágenes de curso"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cursos' and is_admin());
