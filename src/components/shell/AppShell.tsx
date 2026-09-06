import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import type { Role } from "@/lib/nav";
import { getCurrentUser } from "@/lib/auth";

export async function AppShell({
  role,
  defaultCourseCode,
  children,
}: {
  role: Role;
  defaultCourseCode: string;
  children: ReactNode;
}) {
  // El middleware ya garantiza sesión + rol correcto antes de llegar acá;
  // este redirect es sólo defensa en profundidad (ej. sesión que expiró
  // entre el middleware y el render).
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} defaultCourseCode={defaultCourseCode} nombre={user.nombre} />
      <main className="flex-1 pb-[140px]">{children}</main>
    </div>
  );
}
