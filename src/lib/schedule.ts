/**
 * Horario semanal de un curso de cohorte (días + hora) y chequeo de choque.
 * Sin "server-only" a propósito: estas funciones son puras (nada de red/DB)
 * y las usa tanto el servidor (API routes) como componentes de cliente (el
 * calendario de disponibilidad y los formularios de propuesta/edición, para
 * avisar antes de mandar el pedido). La aplicación real del bloqueo vive en
 * la base (trigger `courses_check_schedule_conflict`, `0038_horario_curso.sql`)
 * y en `src/lib/session-overlap.ts` para clases sueltas — esto es solo para
 * dar feedback inmediato en la UI con la misma regla.
 */

/** Clase real: 2 horas. Margen pedido entre el fin estimado de una y el inicio de la siguiente: 20 min. */
export const CLASE_DURACION_MIN = 120;
export const CLASE_MARGEN_MIN = 20;
/** Dos horarios chocan si sus inicios quedan a menos de esto. */
export const VENTANA_CHOQUE_MIN = CLASE_DURACION_MIN + CLASE_MARGEN_MIN;

export const DIAS_SEMANA: { value: number; label: string }[] = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
];

/** Día ISO (1 = lunes .. 7 = domingo) de una fecha, en hora local. */
export function diaIso(fecha: Date): number {
  const d = fecha.getDay();
  return d === 0 ? 7 : d;
}

/**
 * Última fecha (inclusive, "yyyy-mm-dd") en la que puede caer una clase del
 * patrón semanal: `fechaFin` si se cargó, o si no, `fechaInicio` + la
 * cantidad de semanas que hacen falta para dar `clasesTotales` clases a
 * razón de `diasSemana.length` por semana. `null` si falta algún dato.
 */
export function finEfectivoCohorte(
  fechaInicio: string | null,
  fechaFin: string | null,
  clasesTotales: number | null | undefined,
  diasSemana: number[] | null | undefined
): string | null {
  if (fechaFin) return fechaFin;
  if (!fechaInicio || !clasesTotales || clasesTotales <= 0 || !diasSemana || diasSemana.length === 0) return null;
  const semanas = Math.ceil(clasesTotales / diasSemana.length);
  const fin = new Date(`${fechaInicio}T00:00:00`);
  fin.setDate(fin.getDate() + semanas * 7);
  return fin.toISOString().slice(0, 10);
}

function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** ¿Dos horas del día (formato "HH:MM") están a menos de VENTANA_CHOQUE_MIN de diferencia? */
export function horariosChocan(horaA: string, horaB: string): boolean {
  return Math.abs(minutosDesdeMedianoche(horaA) - minutosDesdeMedianoche(horaB)) < VENTANA_CHOQUE_MIN;
}

export interface PatronCurso {
  code: string;
  titulo: string;
  diasSemana: number[] | null;
  horaInicio: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  clasesTotales: number | null;
}

export interface CandidatoHorario {
  diasSemana: number[];
  horaInicio: string;
  fechaInicio: string;
  fechaFin: string | null;
  clasesTotales: number | null;
}

/**
 * Busca, entre otros cursos de cohorte, el primero cuyo patrón semanal choca
 * con el candidato (comparten día, hora dentro de la ventana de choque, y
 * sus rangos de fecha se superponen). `excludeCode` es el propio curso, al
 * editar uno ya existente.
 */
export function encontrarConflictoDePatron(
  candidato: CandidatoHorario,
  otros: PatronCurso[],
  excludeCode?: string
): PatronCurso | null {
  const finCandidato = finEfectivoCohorte(candidato.fechaInicio, candidato.fechaFin, candidato.clasesTotales, candidato.diasSemana) ?? "9999-12-31";
  for (const otro of otros) {
    if (otro.code === excludeCode) continue;
    if (!otro.diasSemana || !otro.horaInicio || !otro.fechaInicio) continue;
    const comparteDia = otro.diasSemana.some((d) => candidato.diasSemana.includes(d));
    if (!comparteDia) continue;
    if (!horariosChocan(otro.horaInicio, candidato.horaInicio)) continue;
    const finOtro = finEfectivoCohorte(otro.fechaInicio, otro.fechaFin, otro.clasesTotales, otro.diasSemana) ?? "9999-12-31";
    const seSuperponen = otro.fechaInicio <= finCandidato && candidato.fechaInicio <= finOtro;
    if (seSuperponen) return otro;
  }
  return null;
}

/**
 * ¿Una fecha+hora puntual (ISO completo) cae dentro del patrón semanal de un
 * curso? Para chocar una clase suelta (`course_sessions`) contra el patrón
 * de otro curso, no solo contra otras clases sueltas.
 */
export function fechaDentroDePatron(fechaIso: string, patron: PatronCurso): boolean {
  if (!patron.diasSemana || !patron.horaInicio || !patron.fechaInicio) return false;
  const fecha = new Date(fechaIso);
  const dia = diaIso(fecha);
  if (!patron.diasSemana.includes(dia)) return false;
  const horaStr = `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
  if (!horariosChocan(horaStr, patron.horaInicio)) return false;
  const fechaDia = fechaIso.slice(0, 10);
  const fin = finEfectivoCohorte(patron.fechaInicio, patron.fechaFin, patron.clasesTotales, patron.diasSemana) ?? "9999-12-31";
  return fechaDia >= patron.fechaInicio && fechaDia <= fin;
}

const NOMBRES_DIA: Record<number, string> = {
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
  7: "domingo",
};

/** [2,4] -> "martes y jueves". [1,3,5] -> "lunes, miércoles y viernes". */
export function formatDiasSemana(dias: number[]): string {
  const nombres = [...dias].sort((a, b) => a - b).map((d) => NOMBRES_DIA[d]).filter(Boolean);
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** Texto público del horario semanal fijo de un curso ("martes y jueves, 19:00 hs"), o null si todavía no se cargó. */
export function formatHorarioSemanal(
  diasSemana: number[] | null | undefined,
  horaInicio: string | null | undefined
): string | null {
  if (!diasSemana || diasSemana.length === 0 || !horaInicio) return null;
  return `${formatDiasSemana(diasSemana)}, ${horaInicio} hs`;
}

/** Todas las fechas ("yyyy-mm-dd") en que cae una clase del patrón, dentro de un rango [desde, hasta] inclusive. Para pintar el calendario. */
export function ocurrenciasEnRango(patron: PatronCurso, desde: string, hasta: string): string[] {
  if (!patron.diasSemana || !patron.horaInicio || !patron.fechaInicio) return [];
  const fin = finEfectivoCohorte(patron.fechaInicio, patron.fechaFin, patron.clasesTotales, patron.diasSemana) ?? "9999-12-31";
  const inicioRango = patron.fechaInicio > desde ? patron.fechaInicio : desde;
  const finRango = fin < hasta ? fin : hasta;
  if (inicioRango > finRango) return [];

  const ocurrencias: string[] = [];
  const cursor = new Date(`${inicioRango}T00:00:00`);
  const limite = new Date(`${finRango}T00:00:00`);
  while (cursor <= limite) {
    if (patron.diasSemana.includes(diaIso(cursor))) {
      ocurrencias.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return ocurrencias;
}
