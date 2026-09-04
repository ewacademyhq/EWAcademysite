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
  pagoTipo: PagoTipo;
  pagoValor: number;
  comision: number;
  vendidos: number;
  vistas: number;
  moraTipo?: MoraTipo;
  moraValor?: number;
}

export type EstadoMatricula = "activa" | "mora" | "pendiente" | "finalizada" | "deuda";

export interface AuditEntry {
  id: number;
  txt: string;
}

export interface Receipt {
  id: number;
  alumno: string;
  curso: string;
  monto: string;
  fecha: string;
  archivo: string;
}

export interface Enrollment {
  id: number;
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
