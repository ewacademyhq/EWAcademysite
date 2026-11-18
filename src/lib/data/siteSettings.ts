import { createClient } from "@/lib/supabase/server";

/**
 * Flag de modo pre-lanzamiento (EWA-061). Si falla la lectura, asumimos
 * `true` (inscripciones habilitadas) — un error de red no debe terminar
 * bloqueando la venta sola.
 */
export async function getEnrollmentEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("enrollment_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("No se pudo leer site_settings:", error.message);
    return true;
  }
  return data?.enrollment_enabled ?? true;
}
