-- EW Academy — schema inicial (Fase 1)
-- Correr esto entero en el SQL Editor de Supabase (o vía `supabase db push` si más
-- adelante se instala la CLI). Ver docs/SPEC.md §6 para el modelo de datos de referencia
-- y docs/IMPLEMENTATION_PLAN.md Fase 1 para el contexto.

-- ── Enums ──────────────────────────────────────────────────────────────────

create type rol_usuario as enum ('alumno', 'docente', 'admin');
create type vertical_curso as enum ('Ciberseguridad', 'QA', 'IA', 'Videojuegos');
create type modalidad_curso as enum ('cohorte', 'continuo');
create type pago_tipo as enum ('pct', 'fijo');
create type mora_tipo as enum ('ninguno', 'pct', 'fijo');
create type estado_matricula as enum ('activa', 'mora', 'pendiente', 'finalizada', 'deuda');
create type medio_pago as enum ('Mercado Pago', 'Transferencia');
create type estado_receipt as enum ('pendiente', 'aprobado', 'rechazado');

-- ── Usuarios ───────────────────────────────────────────────────────────────
-- Espejo de auth.users con el rol de la app. Se completa en la Fase 2 (auth),
-- pero la tabla existe desde ya porque courses.docente_id y otras FKs la referencian.

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol rol_usuario not null default 'alumno',
  created_at timestamptz not null default now()
);

-- ── Cursos ─────────────────────────────────────────────────────────────────

create table courses (
  code text primary key check (code ~ '^[A-Z]+-[0-9]{3}$'),
  vertical vertical_curso not null,
  modalidad modalidad_curso not null,
  titulo text not null check (char_length(titulo) >= 5),
  descripcion text not null default '',
  precio numeric(12, 2) not null check (precio >= 40000),
  fecha_inicio date,
  fecha_fin date,
  duracion text not null default '',
  docente_id uuid references users (id) on delete set null,
  pago_tipo pago_tipo not null default 'pct',
  pago_valor numeric(12, 2) not null default 35,
  comision numeric(5, 2) not null default 6.2 check (comision between 0 and 15),
  mora_tipo mora_tipo not null default 'pct',
  mora_valor numeric(12, 2) not null default 5,
  gracia_dias integer not null default 5 check (gracia_dias between 0 and 30),
  vendidos integer not null default 0,
  vistas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Módulos de un curso ────────────────────────────────────────────────────

create table modules (
  id bigint generated always as identity primary key,
  course_code text not null references courses (code) on delete cascade,
  numero integer not null,
  titulo text not null,
  orden integer not null default 0,
  unique (course_code, numero)
);

-- ── Matrículas ─────────────────────────────────────────────────────────────

create table enrollments (
  id bigint generated always as identity primary key,
  user_id uuid not null references users (id) on delete cascade,
  course_code text not null references courses (code) on delete restrict,
  cuota_congelada numeric(12, 2) not null,
  congelada_desde date not null default current_date,
  estado estado_matricula not null default 'pendiente',
  ultimo_pago_at date,
  medio medio_pago,
  progreso integer not null default 0 check (progreso between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, course_code)
);

create table module_progress (
  id bigint generated always as identity primary key,
  enrollment_id bigint not null references enrollments (id) on delete cascade,
  module_id bigint not null references modules (id) on delete cascade,
  estado text not null default 'bloqueado',
  unique (enrollment_id, module_id)
);

-- ── Pagos y comprobantes ───────────────────────────────────────────────────

create table payments (
  id bigint generated always as identity primary key,
  enrollment_id bigint not null references enrollments (id) on delete cascade,
  periodo date not null,
  monto numeric(12, 2) not null,
  medio medio_pago not null,
  estado text not null default 'pendiente',
  acreditado_at timestamptz,
  created_at timestamptz not null default now()
);

create table receipts (
  id bigint generated always as identity primary key,
  enrollment_id bigint not null references enrollments (id) on delete cascade,
  archivo_url text not null,
  monto numeric(12, 2) not null,
  subido_at timestamptz not null default now(),
  estado estado_receipt not null default 'pendiente',
  revisado_por uuid references users (id) on delete set null,
  revisado_at timestamptz
);

-- ── Auditoría ──────────────────────────────────────────────────────────────

create table audit_log (
  id bigint generated always as identity primary key,
  entity text not null,
  entity_id text not null,
  de text,
  a text,
  usuario_id uuid references users (id) on delete set null,
  at timestamptz not null default now()
);

-- ── Índices ────────────────────────────────────────────────────────────────

create index enrollments_user_id_idx on enrollments (user_id);
create index enrollments_course_code_idx on enrollments (course_code);
create index receipts_estado_idx on receipts (estado);
create index audit_log_entity_idx on audit_log (entity, entity_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Fase 1: solo se define lectura pública del catálogo (para landing y checkout).
-- Las políticas de escritura (admin crea/edita cursos, alumno ve su propia
-- matrícula, docente ve sus alumnos, etc.) se agregan en la Fase 2 una vez que
-- exista autenticación real — hasta entonces, todo lo que no sea el SELECT de
-- abajo requiere la service_role key (usada solo desde el server, nunca del browser).

alter table users enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table enrollments enable row level security;
alter table module_progress enable row level security;
alter table payments enable row level security;
alter table receipts enable row level security;
alter table audit_log enable row level security;

create policy "El catálogo de cursos es público"
  on courses for select
  to anon, authenticated
  using (true);

create policy "Los módulos de un curso son públicos"
  on modules for select
  to anon, authenticated
  using (true);

-- ── updated_at automático en courses ───────────────────────────────────────

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger courses_set_updated_at
  before update on courses
  for each row
  execute function set_updated_at();
