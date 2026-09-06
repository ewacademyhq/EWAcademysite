-- EW Academy — integraciones restantes: Meet, Drive y tracking de vistas (Fase 7)
-- Correr en el SQL Editor de Supabase, después de 0001-0010.

-- ── Drive: un link real de carpeta por curso ────────────────────────────────
-- Reemplaza los strings de texto hardcodeados en DocenteClient/CursoClient.

alter table courses add column drive_folder_url text;

-- El docente dueño del curso puede fijar su propio link de Drive, sin abrir
-- un UPDATE general sobre `courses` (esa tabla tiene precio, comisión, etc.
-- que siguen siendo exclusivos del admin, ver 0002_auth.sql). Mismo patrón
-- que `complete_my_module()`: función acotada que verifica dueñez ella misma.

create or replace function set_my_course_drive_folder(p_code text, p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update courses
  set drive_folder_url = nullif(trim(p_url), '')
  where code = p_code and docente_id = auth.uid();

  if not found then
    raise exception 'No autorizado';
  end if;
end;
$$;

grant execute on function set_my_course_drive_folder(text, text) to authenticated;

-- ── Google Meet: sesiones en vivo reales por curso ──────────────────────────
-- Reemplaza el AGENDA hardcodeado de DocenteClient y el botón decorativo
-- "Entrar a la clase" de CursoClient.

create table course_sessions (
  id bigint generated always as identity primary key,
  course_code text not null references courses (code) on delete cascade,
  titulo text not null,
  fecha timestamptz not null,
  meet_url text not null default '',
  created_at timestamptz not null default now()
);

create index course_sessions_course_code_idx on course_sessions (course_code);

alter table course_sessions enable row level security;

-- Lectura pública, igual que `courses`/`modules` — la próxima clase en vivo
-- se puede mostrar en la ficha del curso antes de matricularse.
create policy "Las sesiones en vivo son de lectura pública"
  on course_sessions for select
  to anon, authenticated
  using (true);

create policy "Un docente gestiona las sesiones de sus cursos"
  on course_sessions for all
  to authenticated
  using (
    exists (
      select 1 from courses
      where courses.code = course_sessions.course_code
        and courses.docente_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from courses
      where courses.code = course_sessions.course_code
        and courses.docente_id = auth.uid()
    )
  );

create policy "Un admin gestiona todas las sesiones"
  on course_sessions for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ── Tracking de vistas de ficha de curso ────────────────────────────────────
-- `courses.vistas` existe desde la Fase 1 pero nada lo incrementaba nunca —
-- por eso "Cursos más consultados" y "Conversión visita → pago" en KPIs
-- eran datos de muestra. Incrementar `vistas` requiere `UPDATE` sobre
-- `courses`, que un visitante anónimo no tiene (y no debería tener en
-- general — ver policies de 0002_auth.sql); esta función hace exactamente
-- esa única cosa, sin abrir el resto de la tabla.

create or replace function increment_course_view(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update courses set vistas = vistas + 1 where code = p_code;
end;
$$;

grant execute on function increment_course_view(text) to anon, authenticated;
