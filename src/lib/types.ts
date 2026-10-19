/** Nombre de una vertical (tabla `verticales`, antes era un enum fijo — ver Q8). */
export type Vertical = string;
export type Modalidad = "cohorte" | "continuo";
export type PagoTipo = "pct" | "fijo";

export interface Course {
  code: string;
  vertical: Vertical;
  modalidad: Modalidad;
  titulo: string;
  desc: string;
  /** Precio total del curso (pago único, no mensual). */
  precio: number;
  fecha: string;
  duracion: string;
  docente: string;
  docenteId?: string | null;
  pagoTipo: PagoTipo;
  pagoValor: number;
  comision: number;
  vendidos: number;
  vistas: number;
  /** Cantidad total de clases del curso — obligatoria en cohorte, null en autogestionado. Denominador fijo del prorrateo de pago al docente. */
  clasesTotales?: number | null;
  /** Última vez que se actualizó el contenido — solo importa en autogestionado (ver isCourseStale). */
  contenidoActualizadoAt?: string | null;
  /** Fecha de fin de cohorte, ISO yyyy-mm-dd — null en cursos autogestionados. */
  fechaFin?: string | null;
  /** Link real a la carpeta de Drive del curso, lo fija el propio docente. */
  driveFolderUrl?: string | null;
  /** URL pública de la imagen del curso (bucket "cursos"), o null si no se cargó ninguna. */
  imagenUrl?: string | null;
}

export interface CourseSession {
  id: number;
  courseCode: string;
  titulo: string;
  /** ISO 8601 completo (fecha + hora). */
  fecha: string;
  meetUrl: string;
}

export type EstadoMatricula = "pendiente" | "activa" | "finalizada";

export interface AuditEntry {
  id: number;
  txt: string;
}

export interface Receipt {
  id: number;
  enrollmentId: number;
  alumno: string;
  curso: string;
  monto: string;
  fecha: string;
  archivo: string;
}

export interface Enrollment {
  id: number;
  userId: string;
  nombre: string;
  ini: string;
  code: string;
  cuota: number;
  desde: string;
  estado: EstadoMatricula;
  pago: string;
  medio: "Mercado Pago" | "Transferencia" | "Manual";
  prog: string;
  /** Fecha/hora ISO en que el alumno pidió la baja, o null si no pidió ninguna. */
  bajaSolicitadaAt?: string | null;
}
