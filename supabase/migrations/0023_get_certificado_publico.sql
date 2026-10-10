-- 0021 se cortó antes de llegar a esta función (por eso la policy de insert
-- tampoco se había creado, arreglado en 0022) — la página pública de
-- verificación del certificado la necesita para leer datos de `enrollments`/
-- `users` sin abrirles RLS a `anon` directamente.
create function get_certificado_publico(p_codigo text)
returns table (
  alumno_nombre text,
  curso_titulo text,
  duracion text,
  vertical text,
  emitido_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select u.nombre, c.titulo, c.duracion, c.vertical, cert.emitido_at
  from certificados cert
  join enrollments e on e.id = cert.enrollment_id
  join users u on u.id = e.user_id
  join courses c on c.code = e.course_code
  where cert.codigo = p_codigo;
$$;

grant execute on function get_certificado_publico(text) to anon, authenticated;
