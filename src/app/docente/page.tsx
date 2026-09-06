import { AppShell } from "@/components/shell/AppShell";
import { DocenteClient } from "@/components/docente/DocenteClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getMyTeachingCourses,
  getMyStudentEnrollments,
  getMyReceiptQueue,
  getMyUpcomingSessions,
} from "@/lib/data/docente";

export default async function DocentePage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login antes de esto

  const courses = await getMyTeachingCourses(user.id, user.nombre);
  const codes = courses.map((c) => c.code);
  const [enrollments, queue, sessions] = await Promise.all([
    getMyStudentEnrollments(codes),
    getMyReceiptQueue(codes),
    getMyUpcomingSessions(codes),
  ]);

  return (
    <AppShell role="docente" defaultCourseCode={courses[0]?.code ?? ""}>
      <DocenteClient
        docente={user.nombre}
        courses={courses}
        enrollments={enrollments}
        queue={queue}
        sessions={sessions}
      />
    </AppShell>
  );
}
