import { createClient } from "@/lib/supabase/server";
import { isoToDMY, initials } from "@/lib/date";
import type {
  Course,
  Enrollment,
  EstadoMatricula,
  Modalidad,
  MoraTipo,
  PagoTipo,
  Receipt,
  Vertical,
} from "@/lib/types";

export interface PersonOption {
  id: string;
  nombre: string;
}

interface AdminCourseRow {
  code: string;
  vertical: Vertical;
  modalidad: Modalidad;
  titulo: string;
  descripcion: string;
  precio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  duracion: string;
  docente_id: string | null;
  pago_tipo: PagoTipo;
  pago_valor: number;
  comision: number;
  mora_tipo: MoraTipo;
  mora_valor: number;
  gracia_dias: number;
  vendidos: number;
  vistas: number;
  docente: { nombre: string } | { nombre: string }[] | null;
}

function docenteNombre(row: AdminCourseRow): string {
  const d = row.docente;
  if (!d) return "Sin asignar";
  return Array.isArray(d) ? d[0]?.nombre ?? "Sin asignar" : d.nombre;
}

function mapCourseRow(row: AdminCourseRow): Course {
  return {
    code: row.code,
    vertical: row.vertical,
    modalidad: row.modalidad,
    titulo: row.titulo,
    desc: row.descripcion,
    precio: Number(row.precio),
    fecha: row.modalidad === "continuo" ? "Inmediato" : isoToDMY(row.fecha_inicio),
    duracion: row.duracion,
    docente: docenteNombre(row),
    docenteId: row.docente_id,
    pagoTipo: row.pago_tipo,
    pagoValor: Number(row.pago_valor),
    comision: Number(row.comision),
    vendidos: row.vendidos,
    vistas: row.vistas,
    moraTipo: row.mora_tipo,
    moraValor: Number(row.mora_valor),
    graciaDias: row.gracia_dias,
    fechaFin: row.modalidad === "cohorte" ? (row.fecha_fin ? isoToDMY(row.fecha_fin) : null) : null,
  };
}

const ADMIN_COURSE_COLUMNS =
  "code, vertical, modalidad, titulo, descripcion, precio, fecha_inicio, fecha_fin, duracion, docente_id, pago_tipo, pago_valor, comision, mora_tipo, mora_valor, gracia_dias, vendidos, vistas, docente:users!docente_id(nombre)";

export async function getAdminCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(ADMIN_COURSE_COLUMNS)
    .order("code");

  if (error) throw error;
  return (data as unknown as AdminCourseRow[]).map(mapCourseRow);
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

export async function getAllEnrollments(): Promise<Enrollment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_COLUMNS)
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

export async function getReceiptQueue(): Promise<Receipt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select(
      "id, enrollment_id, archivo_url, monto, subido_at, enrollment:enrollments!enrollment_id(course_code, users!user_id(nombre))"
    )
    .eq("estado", "pendiente")
    .order("subido_at");

  if (error) throw error;

  return (data as unknown as ReceiptRow[]).map((row) => {
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

export async function getDocentes(): Promise<PersonOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, nombre")
    .eq("rol", "docente")
    .order("nombre");

  if (error) throw error;
  return data;
}

export async function getAlumnos(): Promise<PersonOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, nombre")
    .eq("rol", "alumno")
    .order("nombre");

  if (error) throw error;
  return data;
}
