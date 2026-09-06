import { createClient } from "@/lib/supabase/server";
import type { Course, CourseSession, MoraTipo, PagoTipo, Modalidad, Vertical } from "@/lib/types";

interface CourseRow {
  code: string;
  vertical: Vertical;
  modalidad: Modalidad;
  titulo: string;
  descripcion: string;
  precio: number;
  fecha_inicio: string | null;
  duracion: string;
  pago_tipo: PagoTipo;
  pago_valor: number;
  comision: number;
  mora_tipo: MoraTipo;
  mora_valor: number;
  vendidos: number;
  vistas: number;
  drive_folder_url: string | null;
  docente: { nombre: string } | { nombre: string }[] | null;
}

function formatFecha(iso: string | null): string {
  if (!iso) return "A definir";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function docenteNombre(row: CourseRow): string {
  const d = row.docente;
  if (!d) return "Sin asignar";
  return Array.isArray(d) ? d[0]?.nombre ?? "Sin asignar" : d.nombre;
}

function mapRow(row: CourseRow): Course {
  return {
    code: row.code,
    vertical: row.vertical,
    modalidad: row.modalidad,
    titulo: row.titulo,
    desc: row.descripcion,
    precio: Number(row.precio),
    fecha: row.modalidad === "continuo" ? "Inmediato" : formatFecha(row.fecha_inicio),
    duracion: row.duracion,
    docente: docenteNombre(row),
    pagoTipo: row.pago_tipo,
    pagoValor: Number(row.pago_valor),
    comision: Number(row.comision),
    vendidos: row.vendidos,
    vistas: row.vistas,
    moraTipo: row.mora_tipo,
    moraValor: Number(row.mora_valor),
    driveFolderUrl: row.drive_folder_url,
  };
}

const COURSE_COLUMNS =
  "code, vertical, modalidad, titulo, descripcion, precio, fecha_inicio, duracion, pago_tipo, pago_valor, comision, mora_tipo, mora_valor, vendidos, vistas, drive_folder_url, docente:users!docente_id(nombre)";

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .order("code");

  if (error) throw error;
  return (data as CourseRow[]).map(mapRow);
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as CourseRow) : null;
}

/**
 * Registra una vista de la ficha del curso (Fase 7) — llamar solo desde la
 * página pública de checkout, que es la "ficha de curso" real, no desde
 * `/curso/[code]` (un alumno ya matriculado entrando a su propio curso no es
 * una vista de venta) ni desde la ruta de la API de Mercado Pago. Usa una
 * función `security definer` (`increment_course_view`, `0011_fase7.sql`)
 * porque un visitante anónimo no tiene, ni debería tener, permiso de
 * `UPDATE` general sobre `courses`.
 */
export async function registerCourseView(code: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_course_view", { p_code: code.toUpperCase() });
  if (error) {
    // No es crítico para la experiencia del visitante — no bloquear el
    // checkout por esto, solo dejar rastro en los logs del servidor.
    console.error("No se pudo registrar la vista del curso:", error.message);
  }
}

interface CourseSessionRow {
  id: number;
  course_code: string;
  titulo: string;
  fecha: string;
  meet_url: string;
}

function mapSessionRow(row: CourseSessionRow): CourseSession {
  return { id: row.id, courseCode: row.course_code, titulo: row.titulo, fecha: row.fecha, meetUrl: row.meet_url };
}

/** La próxima sesión en vivo agendada de un curso, o null si no hay ninguna futura. */
export async function getUpcomingSession(courseCode: string): Promise<CourseSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_sessions")
    .select("id, course_code, titulo, fecha, meet_url")
    .eq("course_code", courseCode)
    .gte("fecha", new Date().toISOString())
    .order("fecha", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapSessionRow(data as CourseSessionRow) : null;
}
