import type { Course, EstadoMatricula } from "./types";

export const PRECIO_MIN = 40000;

export const DOCENTES = [
  "Nicolás Rivas",
  "Micaela Duarte",
  "Federico Ojeda",
  "Bruno Salgado",
  "Sin asignar",
];

export const POOL = [
  "Camila Vera",
  "Tomás Ledesma",
  "Brenda Ojeda",
  "Matías Miró",
  "Paula Insfrán",
];

export function nextCode(prefijo: string, courses: Course[]): string {
  const prefix = prefijo || "EW";
  const nums = courses
    .filter((c) => c.code.startsWith(prefix + "-"))
    .map((c) => parseInt(c.code.split("-")[1], 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export const ESTADOS: Record<EstadoMatricula, { label: string; color: string; soft: string }> = {
  activa: { label: "Activa", color: "var(--good)", soft: "var(--good-soft)" },
  pendiente: { label: "Pend. aprobación", color: "var(--accent)", soft: "var(--accent-soft)" },
  finalizada: { label: "Finalizada", color: "var(--dim)", soft: "var(--surface2)" },
};

/**
 * Transiciones manuales permitidas desde el panel de admin. "finalizada" es
 * terminal (la cierra solo el cron de fin de cohorte/baja a 30 días) — para
 * corregir un error de carga existe el flujo de "Forzar corrección", que
 * pasa por force_estado_change() en la base y no por esta lista (ver
 * supabase/migrations/0026_pago_unico_y_estados_simples.sql).
 */
export const ALLOWED_TRANSITIONS: Record<EstadoMatricula, EstadoMatricula[]> = {
  pendiente: ["activa"],
  activa: ["finalizada"],
  finalizada: [],
};

export function docentePagoOf(course: Pick<Course, "pagoTipo" | "pagoValor" | "precio">): number {
  return course.pagoTipo === "pct"
    ? (course.precio * (course.pagoValor || 0)) / 100
    : course.pagoValor || 0;
}

export const CONTENIDO_STALE_MONTHS = 6;

/**
 * Un curso autogestionado deja de ofrecerse a la venta si pasaron más de
 * CONTENIDO_STALE_MONTHS sin marcarlo como actualizado — no afecta el acceso
 * de quien ya se matriculó, solo si aparece en el catálogo/checkout público.
 * Las cohortes nunca son "stale": se cierran solas por fecha_fin.
 */
export function isCourseStale(course: Pick<Course, "modalidad" | "contenidoActualizadoAt">): boolean {
  if (course.modalidad !== "continuo") return false;
  if (!course.contenidoActualizadoAt) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - CONTENIDO_STALE_MONTHS);
  return new Date(course.contenidoActualizadoAt) <= cutoff;
}
