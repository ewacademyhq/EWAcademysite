import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VENTANA_CHOQUE_MIN, fechaDentroDePatron, type PatronCurso } from "@/lib/schedule";

export interface ScheduleConflict {
  tipo: "sesion" | "patron";
  titulo: string;
  courseCode: string;
  fecha?: string;
}

/**
 * Hay una sola cuenta de Zoom para toda la academia — no se puede dar dos
 * clases en vivo a la vez aunque sean de cursos distintos. Busca un choque,
 * tanto contra otra clase suelta ya agendada (`course_sessions`, de
 * cualquier curso) como contra el patrón semanal de cualquier otro curso de
 * cohorte (`courses.dias_semana`/`hora_inicio`) — agendar una clase suelta
 * que cae en el horario recurrente de otro curso también choca. Bloquea
 * (no solo avisa): devuelve el primer choque encontrado, o `null` si no hay
 * ninguno. `excludeSessionId` se usa al reprogramar, para no chocar contra
 * la sesión que se está editando; `excludeCourseCode` es el curso de la
 * propia clase, para no chocar contra su propio patrón semanal (ahí es
 * donde se espera que caiga).
 */
export async function findScheduleConflict(
  supabase: SupabaseClient,
  fechaIso: string,
  excludeCourseCode: string,
  excludeSessionId?: number
): Promise<ScheduleConflict | null> {
  const fecha = new Date(fechaIso);
  const desde = new Date(fecha.getTime() - VENTANA_CHOQUE_MIN * 60_000).toISOString();
  const hasta = new Date(fecha.getTime() + VENTANA_CHOQUE_MIN * 60_000).toISOString();

  let sesionQuery = supabase
    .from("course_sessions")
    .select("id, titulo, course_code, fecha")
    .gt("fecha", desde)
    .lt("fecha", hasta);
  if (excludeSessionId) sesionQuery = sesionQuery.neq("id", excludeSessionId);

  const { data: sesion } = await sesionQuery.limit(1).maybeSingle();
  if (sesion) {
    return { tipo: "sesion", titulo: sesion.titulo, courseCode: sesion.course_code, fecha: sesion.fecha };
  }

  const { data: patrones } = await supabase
    .from("courses")
    .select("code, titulo, dias_semana, hora_inicio, fecha_inicio, fecha_fin, clases_totales")
    .eq("modalidad", "cohorte")
    .in("estado", ["propuesta", "aprobada", "publicado"])
    .not("dias_semana", "is", null)
    .not("hora_inicio", "is", null)
    .neq("code", excludeCourseCode);

  for (const row of (patrones as unknown as (PatronCurso & { code: string })[] | null) ?? []) {
    if (fechaDentroDePatron(fechaIso, row)) {
      return { tipo: "patron", titulo: row.titulo, courseCode: row.code };
    }
  }

  return null;
}

export function scheduleConflictMessage(conflict: ScheduleConflict): string {
  if (conflict.tipo === "sesion" && conflict.fecha) {
    const hora = new Date(conflict.fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Choca con "${conflict.titulo}" (${conflict.courseCode}) el ${hora} — una sola cuenta de Zoom no puede dar dos clases en simultáneo.`;
  }
  return `Choca con el horario semanal fijo de "${conflict.titulo}" (${conflict.courseCode}) — una sola cuenta de Zoom no puede dar dos clases en simultáneo.`;
}
