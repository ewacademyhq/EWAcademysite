import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { PanelClient } from "@/components/panel/PanelClient";
import { getCurrentUser } from "@/lib/auth";
import { getMyEnrollments } from "@/lib/data/mycourse";
import { getCourses, getCourseByCode, getUpcomingSession } from "@/lib/data/courses";
import type { Course, CourseSession } from "@/lib/types";

export const metadata: Metadata = { title: "Mi panel", robots: { index: false, follow: false } };

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [enrollments, recommended] = await Promise.all([
    getMyEnrollments(user.nombre),
    getCourses(),
  ]);

  // Los cursos propios se resuelven sin el filtro de "vencido" del catálogo
  // público (getCourses) — un autogestionado que pasó los 6 meses sin
  // actualizarse deja de ofrecerse a la venta, pero quien ya está matriculado
  // no puede perder su curso del panel por eso.
  const myCourseCodes = [...new Set(enrollments.map((e) => e.code))];
  const [myCourses, nextSessions] = await Promise.all([
    Promise.all(myCourseCodes.map((code) => getCourseByCode(code))),
    Promise.all(myCourseCodes.map((code) => getUpcomingSession(code))),
  ]);

  const courseMap = new Map<string, Course>(recommended.map((c) => [c.code, c]));
  for (const c of myCourses) if (c) courseMap.set(c.code, c);
  const courses = Array.from(courseMap.values());

  const nextSessionByCourse: Record<string, CourseSession | null> = {};
  myCourseCodes.forEach((code, i) => (nextSessionByCourse[code] = nextSessions[i]));

  return (
    <AppShell role="alumno" defaultCourseCode={enrollments[0]?.code ?? ""}>
      <PanelClient
        enrollments={enrollments}
        courses={courses}
        nextSessionByCourse={nextSessionByCourse}
      />
    </AppShell>
  );
}
