-- La academia es solo para mayores de 18 — se pide fecha de nacimiento en el
-- checkout y se valida la edad ahí (CheckoutClient.tsx), no solo una
-- declaración de palabra. Columna nullable para no romper las cuentas que ya
-- existen; el check es la defensa de fondo del lado de la base.
alter table users add column fecha_nacimiento date;

alter table users add constraint users_fecha_nacimiento_mayor_edad
  check (fecha_nacimiento is null or fecha_nacimiento <= current_date - interval '18 years');

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nombre, email, rol, fecha_nacimiento)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    'alumno',
    (new.raw_user_meta_data ->> 'fecha_nacimiento')::date
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
