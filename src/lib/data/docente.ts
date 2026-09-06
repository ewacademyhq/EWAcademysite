import { createClient } from "@/lib/supabase/server";
import { isoToDMY, initials } from "@/lib/date";
import type {
  Course,
  Enrollment,
  EstadoMatricula,
  MoraTipo,
  Modalidad,
  PagoTipo,
  Receipt,
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
  duracion: string;
  pago_tipo: PagoTipo;
  pago_valor: number;
  comision: number;
  mora_tipo: MoraTipo;
  mora_valor: number;
  vendidos: number;
  vistas: number;
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
    moraTipo: row.mora_tipo,
    moraValor: Number(row.mora_valor),
  };
}

const COURSE_COLUMNS =
  "code, vertical, modalidad, titulo, descripcion, precio, fecha_inicio, duracion, pago_tipo, pago_valor, comision, mora_tipo, mora_valor, vendidos, vistas";

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

interface EnrollmentRow {
  id: number;
  user_id: string;
  course_code: string;
  cuota_congelada: number;
  congelada_desde: string;
  estado: EstadoMatricula;
  ultimo_pago_at: string | null;
  medio: "Mercado Pago" | "Transferencia" | null;
  progreso: number;
  alumno: { nombre: string } | { nombre: string }[] | null;
}

function alumnoNombre(row: EnrollmentRow): string {
  const a = row.alumno;
  if (!a) return "(sin nombre)";
  return Array.isArray(a) ? a[0]?.nombre ?? "(sin nombre)" : a.nombre;
}

function mapEnrollmentRow(row: EnrollmentRow): Enrollment {
  const nombre = alumnoNombre(row);
  return {
    id: row.id,
    userId: row.user_id,
    nombre,
    ini: initials(nombre),
    code: row.course_code,
    cuota: Number(row.cuota_congelada),
    desde: isoToDMY(row.congelada_desde),
    estado: row.estado,
    pago: row.ultimo_pago_at ? isoToDMY(row.ultimo_pago_at) : "—",
    medio: row.medio ?? "Mercado Pago",
    prog: `${row.progreso}%`,
  };
}

const ENROLLMENT_COLUMNS =
  "id, user_id, course_code, cuota_congelada, congelada_desde, estado, ultimo_pago_at, medio, progreso, alumno:users!user_id(nombre)";

/**
 * Matrículas de los cursos del docente autenticado. RLS ("Un docente ve las
 * matrículas de sus cursos", 0002_auth.sql) ya limita esto a sus propios
 * cursos, así que no hace falta pasarle los códigos — igual filtramos con
 * `in` para no depender solo de RLS si el join de alumno trajera de más.
 */
export async function getMyStudentEnrollments(courseCodes: string[]): Promise<Enrollment[]> {
  if (courseCodes.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_COLUMNS)
    .in("course_code", courseCodes)
    .order("id");

  if (error) throw error;
  return (data as unknown as EnrollmentRow[]).map(mapEnrollmentRow);
}

interface ReceiptRow {
  id: number;
  enrollment_id: number;
  archivo_url: string;
  monto: number;
  subido_at: string;
  enrollment: {
    course_code: string;
    users: { nombre: string } | { nombre: string }[] | null;
  } | null;
}

/** Comprobantes pendientes de los cursos del docente autenticado. */
export async function getMyReceiptQueue(courseCodes: string[]): Promise<Receipt[]> {
  if (courseCodes.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select(
      "id, enrollment_id, archivo_url, monto, subido_at, enrollment:enrollments!enrollment_id(course_code, users!user_id(nombre))"
    )
    .eq("estado", "pendiente")
    .order("subido_at");

  if (error) throw error;

  return (data as unknown as ReceiptRow[])
    .filter((row) => row.enrollment && courseCodes.includes(row.enrollment.course_code))
    .map((row) => {
      const users = row.enrollment?.users;
      const nombre = Array.isArray(users) ? users[0]?.nombre : users?.nombre;
      return {
        id: row.id,
        enrollmentId: row.enrollment_id,
        alumno: nombre ?? "(sin nombre)",
        curso: row.enrollment?.course_code ?? "—",
        monto: `ARS ${new Intl.NumberFormat("es-AR").format(Number(row.monto))}`,
        fecha: new Date(row.subido_at).toLocaleString("es-AR"),
        archivo: row.archivo_url,
      };
    });
}
