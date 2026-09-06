export type Rol = "alumno" | "docente" | "admin";

export const ROLE_HOME: Record<Rol, string> = {
  alumno: "/panel",
  docente: "/docente",
  admin: "/admin/kpi",
};
