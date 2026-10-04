import { COURSES0 } from "./fixtures";
import type { Course, Enrollment, EstadoMatricula } from "./types";

export const GRACE_DAYS = 5;
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
  mora: { label: "Pausada por mora", color: "var(--danger)", soft: "var(--danger-soft)" },
  pendiente: { label: "Pend. aprobación", color: "var(--accent)", soft: "var(--accent-soft)" },
  finalizada: { label: "Finalizada", color: "var(--dim)", soft: "var(--surface2)" },
  deuda: { label: "Finalizada con deuda", color: "var(--accent)", soft: "var(--accent-soft)" },
};

/**
 * Transiciones manuales permitidas desde el panel de admin. "finalizada" y
 * "deuda" son terminales (los cierra solo el cron de fin de cohorte) — para
 * corregir un error de carga existe el flujo de "Forzar corrección", que
 * pasa por force_estado_change() en la base y no por esta lista (ver
 * supabase/migrations/0013_estado_transiciones.sql).
 */
export const ALLOWED_TRANSITIONS: Record<EstadoMatricula, EstadoMatricula[]> = {
  pendiente: ["activa"],
  activa: ["mora", "finalizada"],
  mora: ["activa", "deuda"],
  finalizada: [],
  deuda: [],
};

export function courseByCode(code: string): Course | undefined {
  return COURSES0.find((c) => c.code === code);
}

export function docentePagoOf(course: Pick<Course, "pagoTipo" | "pagoValor" | "precio">): number {
  return course.pagoTipo === "pct"
    ? (course.precio * (course.pagoValor || 0)) / 100
    : course.pagoValor || 0;
}

export function moraRecargo(course: Course | undefined, cuota: number): number {
  const tipo = course?.moraTipo || "pct";
  const valor = course?.moraValor ?? 5;
  if (tipo === "ninguno") return 0;
  if (tipo === "pct") return Math.round((cuota * valor) / 100);
  return valor;
}

export function deudaTotal(enrollment: Enrollment): number {
  const course = courseByCode(enrollment.code);
  return enrollment.cuota + moraRecargo(course, enrollment.cuota);
}
