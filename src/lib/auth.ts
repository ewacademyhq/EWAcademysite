import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/role-home";

export interface CurrentUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

/** Usuario autenticado + su perfil de `public.users`, o `null` si no hay sesión. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("nombre, email, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: user.id,
    nombre: profile.nombre,
    email: profile.email,
    rol: profile.rol as Rol,
  };
}
