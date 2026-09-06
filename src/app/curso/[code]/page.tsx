import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourseByCode, getUpcomingSession } from "@/lib/data/courses";
import { getMyEnrollment, getCourseModules, getMyModuleProgress } from "@/lib/data/mycourse";
import { AppShell } from "@/components/shell/AppShell";
import { CursoClient } from "@/components/curso/CursoClient";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [course, enrollment] = await Promise.all([
    getCourseByCode(upperCode),
    getMyEnrollment(upperCode, user.nombre),
  ]);

  if (!course || !enrollment) notFound();

  const [modules, progress, nextSession] = await Promise.all([
    getCourseModules(upperCode),
    getMyModuleProgress(enrollment.id),
    getUpcomingSession(upperCode),
  ]);

  return (
    <AppShell role="alumno" defaultCourseCode={upperCode}>
      <CursoClient
        course={course}
        enrollment={enrollment}
        modules={modules}
        progress={progress}
        nextSession={nextSession}
      />
    </AppShell>
  );
}
