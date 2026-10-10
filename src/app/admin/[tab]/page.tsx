import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { AdminClient, type AdminTab } from "@/components/admin/AdminClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getAdminCourses,
  getAllEnrollments,
  getReceiptQueue,
  getDocentes,
  getDocentesConCursos,
  getAlumnos,
  getVerticales,
} from "@/lib/data/admin";

const VALID_TABS: AdminTab[] = ["kpi", "pagos", "cursos", "matriculas", "economia", "docentes"];

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

export default async function AdminTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;

  if (!VALID_TABS.includes(tab as AdminTab)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [courses, enrollments, queue, docentes, docentesConCursos, alumnos, verticales] = await Promise.all([
    getAdminCourses(),
    getAllEnrollments(),
    getReceiptQueue(),
    getDocentes(),
    getDocentesConCursos(),
    getAlumnos(),
    getVerticales(),
  ]);

  return (
    <AppShell role="admin" defaultCourseCode="">
      <AdminClient
        tab={tab as AdminTab}
        initialCourses={courses}
        initialEnrollments={enrollments}
        initialQueue={queue}
        docentes={docentes}
        docentesConCursos={docentesConCursos}
        alumnos={alumnos}
        verticales={verticales}
        adminId={user.id}
        adminNombre={user.nombre}
      />
    </AppShell>
  );
}
