import { AppShell } from "@/components/shell/AppShell";
import { DocenteClient } from "@/components/docente/DocenteClient";
import { COURSES0, ENROLL0, QUEUE0 } from "@/lib/fixtures";

const CURRENT_TEACHER = "Nicolás Rivas";

export default function DocentePage() {
  const courses = COURSES0.filter((c) => c.docente === CURRENT_TEACHER);

  return (
    <AppShell role="docente" defaultCourseCode={courses[0]?.code ?? ""}>
      <DocenteClient
        docente={CURRENT_TEACHER}
        courses={courses}
        enrollments={ENROLL0}
        queue={QUEUE0}
      />
    </AppShell>
  );
}
