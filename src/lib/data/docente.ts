import { createClient } from "@/lib/supabase/server";
import { isoToDMY, initials } from "@/lib/date";
import { docentePagoOf } from "@/lib/business";
import type {
  Course,
  CourseSession,
  EstadoCurso,
  Modalidad,
  PagoTipo,
  Vertical,
} from "@/lib/types";

interface DocenteCourseRow {
  code: string;
  vertical: Vertical;
  modalidad: Modalidad;
  titulo: string;
  descripcion: string;
  precio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  duracion: string;
  pago_tipo: PagoTipo;
  pago_valor: number;
  comision: number;
  vendidos: number;
  vistas: number;
  drive_folder_url: string | null;
  clases_totales: number | null;
  estado: EstadoCurso;
  motivo_rechazo: string | null;
  dias_semana: number[] | null;
  hora_inicio: string | null;
}

function mapCourseRow(row: DocenteCourseRow, docente: string): Course {
  return {
    code: row.code,
    vertical: row.vertical,
    modalidad: row.modalidad,
    titulo: row.titulo,
    desc: row.descripcion,
    precio: Number(row.precio),
    fecha: row.modalidad === "continuo" ? "Inmediato" : isoToDMY(row.fecha_inicio),
    duracion: row.duracion,
    docente,
    pagoTipo: row.pago_tipo,
    pagoValor: Number(row.pago_valor),
    comision: Number(row.comision),
    vendidos: row.vendidos,
    vistas: row.vistas,
    driveFolderUrl: row.drive_folder_url,
    clasesTotales: row.clases_totales,
    fechaFin: row.fecha_fin,
    estado: row.estado,
    motivoRechazo: row.motivo_rechazo,
    diasSemana: row.dias_semana,
    horaInicio: row.hora_inicio ? row.hora_inicio.slice(0, 5) : null,
  };
}

const COURSE_COLUMNS =
  "code, vertical, modalidad, titulo, descripcion, precio, fecha_inicio, fecha_fin, duracion, pago_tipo, pago_valor, comision, vendidos, vistas, drive_folder_url, clases_totales, estado, motivo_rechazo, dias_semana, hora_inicio";

/** Cursos a cargo del docente autenticado (RLS de courses ya es de lectura pública). */
export async function getMyTeachingCourses(teacherId: string, teacherNombre: string): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("docente_id", teacherId)
    .order("code");

  if (error) throw error;
  return (data as DocenteCourseRow[]).map((row) => mapCourseRow(row, teacherNombre));
}

export interface DocenteStudent {
  id: number;
  code: string;
  nombre: string;
  ini: string;
}

interface EnrollmentNombreRow {
  id: number;
  course_code: string;
  alumno: { nombre: string } | { nombre: string }[] | null;
}

function alumnoNombre(row: EnrollmentNombreRow): string {
  const a = row.alumno;
  if (!a) return "(sin nombre)";
  return Array.isArray(a) ? a[0]?.nombre ?? "(sin nombre)" : a.nombre;
}

/**
 * Nombres de los alumnos matriculados en los cursos del docente autenticado
 * — a propósito, nada de estado/progreso/pago: la matrícula (quién pagó,
 * quién está en mora, etc.) es terreno exclusivo de administración, el
 * docente solo necesita saber a quién tiene en su clase. RLS ("Un docente ve
 * las matrículas de sus cursos", 0002_auth.sql) sigue acotando esto a sus
 * propios cursos — esa misma policy la necesita `getMyLiquidacion` más abajo
 * para contar alumnos, por eso no se saca, solo se reduce lo que se expone acá.
 */
export async function getMyStudentEnrollments(courseCodes: string[]): Promise<DocenteStudent[]> {
  if (courseCodes.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, course_code, alumno:users!user_id(nombre)")
    .in("course_code", courseCodes)
    .order("id");

  if (error) throw error;
  return (data as unknown as EnrollmentNombreRow[]).map((row) => {
    const nombre = alumnoNombre(row);
    return { id: row.id, code: row.course_code, nombre, ini: initials(nombre) };
  });
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

/**
 * Próximas sesiones en vivo de los cursos del docente autenticado (RLS de
 * `course_sessions` ya limita la escritura a sus propios cursos; acá además
 * filtramos por fecha futura, igual que hace `getUpcomingSession` del lado
 * del alumno).
 */
export async function getMyUpcomingSessions(courseCodes: string[]): Promise<CourseSession[]> {
  if (courseCodes.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_sessions")
    .select("id, course_code, titulo, fecha, meet_url")
    .in("course_code", courseCodes)
    .gte("fecha", new Date().toISOString())
    .order("fecha", { ascending: true });

  if (error) throw error;
  return (data as CourseSessionRow[]).map(mapSessionRow);
}

export interface LiquidacionCurso {
  code: string;
  titulo: string;
  modalidad: Modalidad;
  /** Texto corto del desglose ("2/8 clases dadas este mes · 100 alumnos", o "3 matrículas activadas este mes"). */
  detalle: string;
  total: number;
}

export interface Liquidacion {
  /** Primer día del mes en curso, ISO yyyy-mm-dd. */
  periodo: string;
  cursos: LiquidacionCurso[];
  total: number;
}

/**
 * Cuánto le corresponde cobrar al docente este mes — se recalcula al leer
 * (igual que `EconomiaTab.tsx` para el neto de la academia), no hay ninguna
 * tabla de liquidaciones ni ledger. Pago único por curso, no mensual
 * recurrente: en cohorte se prorratea el pool del curso según cuántas de las
 * clases totales dio ese mes; en autogestionado se paga una sola vez por
 * cada matrícula activada ese mes (no se vuelve a contar en los meses
 * siguientes, porque se filtra por `congelada_desde` de ese mes puntual).
 */
export async function getMyLiquidacion(teacherId: string): Promise<Liquidacion> {
  const supabase = await createClient();
  const { data: courseRows, error: courseError } = await supabase
    .from("courses")
    .select("code, titulo, modalidad, pago_tipo, pago_valor, precio, clases_totales")
    .eq("docente_id", teacherId);

  if (courseError) throw courseError;

  const now = new Date();
  const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const inicioMesSiguiente = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
  const periodo = inicioMes;

  const cohorteCodes = (courseRows ?? []).filter((c) => c.modalidad === "cohorte").map((c) => c.code);
  const continuoCodes = (courseRows ?? []).filter((c) => c.modalidad === "continuo").map((c) => c.code);

  const alumnosPorCurso: Record<string, number> = {};
  if (cohorteCodes.length > 0) {
    const { data, error } = await supabase
      .from("enrollments")
      .select("course_code")
      .in("course_code", cohorteCodes)
      .in("estado", ["activa", "finalizada"]);
    if (error) throw error;
    for (const r of data ?? []) alumnosPorCurso[r.course_code] = (alumnosPorCurso[r.course_code] ?? 0) + 1;
  }

  const sesionesPorCurso: Record<string, number> = {};
  if (cohorteCodes.length > 0) {
    const { data, error } = await supabase
      .from("course_sessions")
      .select("course_code")
      .in("course_code", cohorteCodes)
      .gte("fecha", `${inicioMes}T00:00:00`)
      .lt("fecha", `${inicioMesSiguiente}T00:00:00`)
      .lt("fecha", now.toISOString());
    if (error) throw error;
    for (const r of data ?? []) sesionesPorCurso[r.course_code] = (sesionesPorCurso[r.course_code] ?? 0) + 1;
  }

  const activadasPorCurso: Record<string, number> = {};
  if (continuoCodes.length > 0) {
    const { data, error } = await supabase
      .from("enrollments")
      .select("course_code")
      .in("course_code", continuoCodes)
      .in("estado", ["activa", "finalizada"])
      .gte("congelada_desde", inicioMes)
      .lt("congelada_desde", inicioMesSiguiente);
    if (error) throw error;
    for (const r of data ?? []) activadasPorCurso[r.course_code] = (activadasPorCurso[r.course_code] ?? 0) + 1;
  }

  const cursos: LiquidacionCurso[] = (courseRows ?? []).map((c) => {
    const pagoOf = (precio: number) =>
      docentePagoOf({ pagoTipo: c.pago_tipo, pagoValor: Number(c.pago_valor), precio });

    if (c.modalidad === "cohorte") {
      const alumnos = alumnosPorCurso[c.code] ?? 0;
      const pool = pagoOf(Number(c.precio)) * alumnos;
      const clasesTotales = c.clases_totales ?? 0;
      const clasesDadas = sesionesPorCurso[c.code] ?? 0;
      const total = clasesTotales > 0 ? pool * (clasesDadas / clasesTotales) : 0;
      return {
        code: c.code,
        titulo: c.titulo,
        modalidad: "cohorte",
        detalle: `${clasesDadas}/${clasesTotales} clases dadas este mes · ${alumnos} alumnos`,
        total,
      };
    }

    const activadas = activadasPorCurso[c.code] ?? 0;
    return {
      code: c.code,
      titulo: c.titulo,
      modalidad: "continuo",
      detalle: `${activadas} ${activadas === 1 ? "matrícula activada" : "matrículas activadas"} este mes`,
      total: pagoOf(Number(c.precio)) * activadas,
    };
  });

  return { periodo, cursos, total: cursos.reduce((a, c) => a + c.total, 0) };
}

export interface FacturaRow {
  id: number;
  periodo: string;
  monto: number;
  archivoUrl: string;
  estado: string;
  subidoAt: string;
}

/** Facturas ya subidas por el docente autenticado (RLS las limita a las suyas). */
export async function getMyFacturas(teacherId: string): Promise<FacturaRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas")
    .select("id, periodo, monto, archivo_url, estado, subido_at")
    .eq("docente_id", teacherId)
    .order("periodo", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    periodo: r.periodo,
    monto: Number(r.monto),
    archivoUrl: r.archivo_url,
    estado: r.estado,
    subidoAt: r.subido_at,
  }));
}
