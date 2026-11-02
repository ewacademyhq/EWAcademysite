import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { DocenteClient } from "@/components/docente/DocenteClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getMyTeachingCourses,
  getMyStudentEnrollments,
  getMyReceiptQueue,
  getMyUpcomingSessions,
  getMyLiquidacion,
  getMyFacturas,
} from "@/lib/data/docente";
import { getVerticales } from "@/lib/data/courses";

export const metadata: Metadata = { title: "Panel docente", robots: { index: false, follow: false } };

export default async function DocentePage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login antes de esto

  const courses = await getMyTeachingCourses(user.id, user.nombre);
  const codes = courses.filter((c) => c.estado === "publicado").map((c) => c.code);
  const [enrollments, queue, sessions, liquidacion, facturas, verticales] = await Promise.all([
    getMyStudentEnrollments(codes),
    getMyReceiptQueue(codes),
    getMyUpcomingSessions(codes),
    getMyLiquidacion(user.id),
    getMyFacturas(user.id),
    getVerticales(),
  ]);

  return (
    <AppShell role="docente" defaultCourseCode={courses.find((c) => c.estado === "publicado")?.code ?? ""}>
      <DocenteClient
        docente={user.nombre}
        docenteId={user.id}
        docenteBio={user.bio}
        courses={courses}
        enrollments={enrollments}
        queue={queue}
        sessions={sessions}
        liquidacion={liquidacion}
        facturas={facturas}
        verticales={verticales}
      />
    </AppShell>
  );
}
