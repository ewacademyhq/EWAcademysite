-- Registro de aceptación de Términos y Condiciones + Política de Privacidad,
-- con fecha y hora — un solo checkbox en el checkout cubre los dos
-- documentos, que comparten la misma fecha de "última actualización".
create table aceptaciones_legales (
  id bigint generated always as identity primary key,
  user_id uuid not null references users (id) on delete cascade,
  version text not null,
  aceptado_at timestamptz not null default now()
);

alter table aceptaciones_legales enable row level security;

create policy "Un alumno registra su propia aceptación"
  on aceptaciones_legales for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Un alumno ve sus propias aceptaciones"
  on aceptaciones_legales for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Un admin ve todas las aceptaciones"
  on aceptaciones_legales for select
  to authenticated
  using (is_admin());
