-- EWA-040: verificación de email propia, no bloqueante (no se toca el
-- "Confirm email" nativo de Supabase para no romper el checkout, que
-- necesita sesión inmediata después de signUp()).

alter table users
  add column email_verificado boolean not null default false,
  add column email_verificacion_token text,
  add column email_verificacion_enviado_at timestamptz;

-- Marca como verificado al propio usuario autenticado (lo usa
-- /activar-cuenta: llegar ahí ya prueba que el email es real, sin
-- necesidad de un token aparte).
create or replace function public.mark_my_email_verificado()
returns void
language sql
security definer
set search_path = public
as $$
  update users
  set email_verificado = true, email_verificacion_token = null
  where id = auth.uid();
$$;

grant execute on function public.mark_my_email_verificado() to authenticated;

-- Verifica por token, sin requerir sesión: el link de verificación llega
-- por mail y puede abrirse en otro dispositivo/navegador donde el alumno
-- no tiene sesión iniciada.
create or replace function public.verificar_email_por_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update users
  set email_verificado = true, email_verificacion_token = null
  where email_verificacion_token = p_token
    and email_verificado = false;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.verificar_email_por_token(text) to anon, authenticated;
