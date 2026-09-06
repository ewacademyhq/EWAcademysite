import { createClient } from "@/lib/supabase/server";
import { isoToDMY, initials } from "@/lib/date";
import type { Enrollment, EstadoMatricula } from "@/lib/types";

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
}

function mapRow(row: EnrollmentRow, nombre: string): Enrollment {
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
  "id, user_id, course_code, cuota_congelada, congelada_desde, estado, ultimo_pago_at, medio, progreso";

/** Todas las matrículas del usuario logueado (RLS ya las limita a las suyas). */
export async function getMyEnrollments(nombre: string): Promise<Enrollment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_COLUMNS)
    .eq("user_id", user.id)
    .order("id");

  if (error) throw error;
  return (data as EnrollmentRow[]).map((row) => mapRow(row, nombre));
}

/** Una matrícula puntual del usuario logueado, o null si no está matriculado en ese curso. */
export async function getMyEnrollment(
  courseCode: string,
  nombre: string
): Promise<Enrollment | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_COLUMNS)
    .eq("user_id", user.id)
    .eq("course_code", courseCode)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as EnrollmentRow, nombre) : null;
}

export interface PaymentRow {
  id: number;
  periodo: string;
  monto: number;
  medio: "Mercado Pago" | "Transferencia";
  estado: string;
}

/** Historial de pagos reales de una matrícula del usuario logueado. */
export async function getMyPayments(enrollmentId: number): Promise<PaymentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, periodo, monto, medio, estado")
    .eq("enrollment_id", enrollmentId)
    .order("periodo", { ascending: false });

  if (error) throw error;
  return data;
}

export interface ModuleRow {
  id: number;
  numero: number;
  titulo: string;
  orden: number;
}

/** Módulos de un curso — la lectura es pública (0001_init.sql). */
export async function getCourseModules(courseCode: string): Promise<ModuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, numero, titulo, orden")
    .eq("course_code", courseCode)
    .order("orden");

  if (error) throw error;
  return data;
}

/** Mapa module_id -> estado ('completo', etc.) para la matrícula dada. */
export async function getMyModuleProgress(
  enrollmentId: number
): Promise<Record<number, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("module_progress")
    .select("module_id, estado")
    .eq("enrollment_id", enrollmentId);

  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.module_id, row.estado]));
}
