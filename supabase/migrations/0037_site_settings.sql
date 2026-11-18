-- EW Academy — modo pre-lanzamiento (EWA-061)
-- Correr en el SQL Editor de Supabase, después de 0001-0036.
--
-- Mientras se termina de cargar contenido real y arranca el marketing, el
-- admin necesita poder cortar la venta sin redeploy (landing + checkout
-- muestran un aviso y el botón de pago queda deshabilitado). Tabla singleton
-- (una sola fila, `id` fijo) en vez de una fila por "configuración" porque
-- hoy solo hay un flag — se puede ampliar con más columnas si hace falta
-- otra más adelante, sin tocar la forma de leerla/escribirla.

create table site_settings (
  id smallint primary key default 1 check (id = 1),
  enrollment_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into site_settings (id, enrollment_enabled) values (1, true);

alter table site_settings enable row level security;

-- Lectura pública: la landing y el checkout la consultan sin sesión.
create policy "Cualquiera lee site_settings"
  on site_settings for select
  to anon, authenticated
  using (true);

-- Escritura solo admin (misma función helper que ya usan verticales/cursos).
create policy "Un admin edita site_settings"
  on site_settings for update
  to authenticated
  using (is_admin())
  with check (is_admin());
