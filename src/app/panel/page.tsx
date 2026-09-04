import { AppShell } from "@/components/shell/AppShell";
import { PanelClient } from "@/components/panel/PanelClient";
import { ENROLL0 } from "@/lib/fixtures";

const CURRENT_STUDENT = "Sofía Miranda";

export default function PanelPage() {
  const enrollments = ENROLL0.filter((e) => e.nombre === CURRENT_STUDENT);

  return (
    <AppShell role="alumno" defaultCourseCode={enrollments[0]?.code ?? ""}>
      <PanelClient enrollments={enrollments} />
    </AppShell>
  );
}
