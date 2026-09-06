-- EW Academy — autenticación y RLS por rol (Fase 2)
-- Correr en el SQL Editor de Supabase, después de 0001_init.sql.

-- ── Alta automática en public.users cuando se crea un auth.users ───────────
-- Todo usuario nuevo entra como 'alumno' por default. Promoverlo a 'docente'
-- o 'admin' se hace con scripts/set-role.ts (o a mano en la tabla) — todavía
-- no hay UI de invitación de staff (queda para cuando el admin gestione
-- usuarios, cuando se necesite).

create function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    'alumno'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ── Helper: ¿el usuario autenticado es admin? ───────────────────────────────
-- security definer para poder leer public.users desde dentro de una policy
-- sin entrar en recursión con la propia RLS de esa tabla.

create function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and rol = 'admin'
  );
$$ language sql security definer set search_path = public stable;

create function is_docente()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and rol = 'docente'
  );
$$ language sql security definer set search_path = public stable;

-- ── users ────────────────────────────────────────────────────────────────

create policy "Un usuario ve su propia fila"
  on users for select
  to authenticated
  using (auth.uid() = id);

create policy "Un admin ve todos los usuarios"
  on users for select
  to authenticated
  using (is_admin());

-- ── courses: altas/ediciones/bajas solo para admin ─────────────────────────
-- (el select público ya lo definió 0001_init.sql)

create policy "Un admin puede crear cursos"
  on courses for insert
  to authenticated
  with check (is_admin());

create policy "Un admin puede editar cursos"
  on courses for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Un admin puede eliminar cursos"
  on courses for delete
  to authenticated
  using (is_admin());

-- ── enrollments: cada uno ve lo suyo; docente ve las de sus cursos; admin ve todo ──

create policy "Un alumno ve sus propias matrículas"
  on enrollments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Un docente ve las matrículas de sus cursos"
  on enrollments for select
  to authenticated
  using (
    exists (
      select 1 from courses
      where courses.code = enrollments.course_code
        and courses.docente_id = auth.uid()
    )
  );

create policy "Un admin ve y gestiona todas las matrículas"
  on enrollments for all
  to authenticated
  using (is_admin())
  with check (is_admin());
