import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_DURATION_MIN } from "@/lib/zoom";

interface OverlapRow {
  id: number;
  titulo: string;
  course_code: string;
  fecha: string;
}

/**
 * Hay una sola cuenta de Zoom para toda la academia (ver memoria del
 * proyecto) — no se puede dar dos clases en vivo a la vez aunque sean de
 * cursos distintos. Esto solo avisa (no bloquea): busca otra sesión, de
 * cualquier curso, cuyo horario se pise con la nueva (mismo bloque fijo de
 * DEFAULT_DURATION_MIN en ambas puntas). `excludeId` se usa al reprogramar
 * para no chocar contra la sesión que se está editando.
 */
export async function findOverlappingSession(
  supabase: SupabaseClient,
  fechaIso: string,
  excludeId?: number
): Promise<OverlapRow | null> {
  const fecha = new Date(fechaIso);
  const desde = new Date(fecha.getTime() - DEFAULT_DURATION_MIN * 60_000).toISOString();
  const hasta = new Date(fecha.getTime() + DEFAULT_DURATION_MIN * 60_000).toISOString();

  let query = supabase
    .from("course_sessions")
    .select("id, titulo, course_code, fecha")
    .gt("fecha", desde)
    .lt("fecha", hasta);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query.limit(1).maybeSingle();
  return (data as OverlapRow | null) ?? null;
}

export function overlapWarning(row: OverlapRow): string {
  const hora = new Date(row.fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Ojo: se superpone con "${row.titulo}" (${row.course_code}) el ${hora}. Con una sola cuenta de Zoom no se pueden dar las dos en simultáneo.`;
}
