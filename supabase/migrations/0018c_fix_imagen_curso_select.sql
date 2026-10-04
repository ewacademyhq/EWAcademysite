-- EW Academy — falta la policy de select para el bucket "cursos" (fix de 0018)
-- La subida usa upload(..., { upsert: true }), y Postgres necesita permiso de
-- SELECT para chequear si el archivo ya existe antes de insertarlo/reemplazarlo
-- (el "bucket público" solo evita la RLS en el endpoint /object/public/, no acá).
-- Por eso fallaba con "row-level security policy" aunque insert/update/delete
-- ya estaban bien.

create policy "Un admin lee imágenes de curso"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'cursos' and is_admin());
