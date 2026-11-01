import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cuenta matrículas "en curso" de un código (pendiente/activa/finalizada —
 * una pendiente ya representa un lugar tomado, está en medio del checkout).
 * Usa el cliente de service_role porque esto corre antes de que exista
 * cualquier sesión y necesita ver matrículas de todos los alumnos, no solo
 * las propias (RLS de `enrollments` las limita al dueño o al admin/docente).
 */
export async function cupoDisponible(
  courseCode: string,
  cupoMaximo: number | null | undefined
): Promise<{ lleno: boolean; inscriptos: number }> {
  if (!cupoMaximo) return { lleno: false, inscriptos: 0 };

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_code", courseCode)
    .in("estado", ["pendiente", "activa", "finalizada"]);

  if (error) throw error;
  return { lleno: (count ?? 0) >= cupoMaximo, inscriptos: count ?? 0 };
}
