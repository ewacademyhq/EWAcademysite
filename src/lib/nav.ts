export type Role = "alumno" | "docente" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  alumno: "Alumno",
  docente: "Docente",
  admin: "Administración",
};

export interface NavItem {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
}

export function navFor(role: Role, defaultCourseCode: string): NavItem[] {
  if (role === "alumno") {
    return [
      { label: "Mi panel", href: "/panel", isActive: (p) => p === "/panel" },
      {
        label: "Mi curso",
        href: `/curso/${defaultCourseCode}`,
        isActive: (p) => p.startsWith("/curso"),
      },
      { label: "Pagos", href: "/panel", isActive: () => false },
      { label: "Certificados", href: "/panel", isActive: () => false },
    ];
  }

  if (role === "docente") {
    return [
      { label: "Resumen", href: "/docente", isActive: (p) => p === "/docente" },
      { label: "Alumnos", href: "/docente", isActive: () => false },
      { label: "Material", href: "/docente", isActive: () => false },
      { label: "Clases en vivo", href: "/docente", isActive: () => false },
    ];
  }

  return [
    { label: "KPIs", href: "/admin/kpi", isActive: (p) => p === "/admin/kpi" },
    { label: "Pagos y mora", href: "/admin/pagos", isActive: (p) => p === "/admin/pagos" },
    { label: "Cursos", href: "/admin/cursos", isActive: (p) => p === "/admin/cursos" },
    { label: "Matrículas", href: "/admin/matriculas", isActive: (p) => p === "/admin/matriculas" },
    { label: "Economía", href: "/admin/economia", isActive: (p) => p === "/admin/economia" },
  ];
}
