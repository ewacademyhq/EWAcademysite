import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AdminClient, type AdminTab } from "@/components/admin/AdminClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getAdminCourses,
  getAllEnrollments,
  getReceiptQueue,
  getDocentes,
  getAlumnos,
} from "@/lib/data/admin";

const VALID_TABS: AdminTab[] = ["kpi", "pagos", "cursos", "matriculas", "economia"];

export default async function AdminTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;

  if (!VALID_TABS.includes(tab as AdminTab)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [courses, enrollments, queue, docentes, alumnos] = await Promise.all([
    getAdminCourses(),
    getAllEnrollments(),
    getReceiptQueue(),
    getDocentes(),
    getAlumnos(),
  ]);

  return (
    <AppShell role="admin" defaultCourseCode="">
      <AdminClient
        tab={tab as AdminTab}
        initialCourses={courses}
        initialEnrollments={enrollments}
        initialQueue={queue}
        docentes={docentes}
        alumnos={alumnos}
        adminId={user.id}
        adminNombre={user.nombre}
      />
    </AppShell>
  );
}
