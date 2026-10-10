-- Q13: certificado de finalización con QR verificable. Se genera al vuelo
-- (no hay cron/jobs en este proyecto), pero el código de verificación se
-- guarda la primera vez que se pide, para que la URL del QR sea estable.
create table certificados (
  id bigint generated always as identity primary key,
  enrollment_id bigint not null unique references enrollments (id) on delete cascade,
  codigo text not null unique,
  emitido_at timestamptz not null default now()
);

alter table certificados enable row level security;

create policy "El alumno ve sus propios certificados"
  on certificados for select
  to authenticated
  using (
    exists (
      select 1 from enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  );

create policy "Admin y docente ven certificados"
  on certificados for select
  to authenticated
  using (is_admin() or is_docente());

create policy "Se crea un certificado al pedirlo por primera vez"
  on certificados for insert
  to authenticated
  with check (
    exists (
      select 1 from enrollments e
      where e.id = enrollment_id and (e.user_id = auth.uid() or is_admin() or is_docente())
    )
  );

-- La página pública /certificado/[codigo] no puede leer `enrollments`/`users`
-- directo (sus policies son solo para `authenticated`, y no queremos abrirlas
-- a `anon`) — esta función expone únicamente los datos ya pensados para
-- mostrarse en el aval, nada más de esas tablas.
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
