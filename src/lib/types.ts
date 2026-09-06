export type Vertical = "Ciberseguridad" | "QA" | "IA" | "Videojuegos";
export type Modalidad = "cohorte" | "continuo";
export type PagoTipo = "pct" | "fijo";
export type MoraTipo = "ninguno" | "pct" | "fijo";

export interface Course {
  code: string;
  vertical: Vertical;
  modalidad: Modalidad;
  titulo: string;
  desc: string;
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
  moraTipo?: MoraTipo;
  moraValor?: number;
  graciaDias?: number;
  /** Fecha de fin de cohorte, dd/mm/yyyy — null en cursos autogestionados. */
  fechaFin?: string | null;
}

export type EstadoMatricula = "activa" | "mora" | "pendiente" | "finalizada" | "deuda";

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
  medio: "Mercado Pago" | "Transferencia";
  prog: string;
}
