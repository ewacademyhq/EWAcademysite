import { createClient } from "@/lib/supabase/server";
import type { Course, MoraTipo, PagoTipo, Modalidad, Vertical } from "@/lib/types";

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
}

function formatFecha(iso: string | null): string {
  if (!iso) return "A definir";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
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
    // El docente real depende de Fase 2 (auth) — hasta entonces no hay
    // usuarios reales a los que enlazar `docente_id`.
    docente: "Sin asignar",
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
