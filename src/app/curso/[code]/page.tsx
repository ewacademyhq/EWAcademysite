import { notFound } from "next/navigation";
import { ENROLL0 } from "@/lib/fixtures";
import { courseByCode } from "@/lib/business";
import { AppShell } from "@/components/shell/AppShell";
import { CursoClient } from "@/components/curso/CursoClient";

const CURRENT_STUDENT = "Sofía Miranda";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const enrollment = ENROLL0.find(
    (e) => e.nombre === CURRENT_STUDENT && e.code === upperCode
  );
  const course = courseByCode(upperCode);

  if (!enrollment || !course) notFound();

  return (
    <AppShell role="alumno" defaultCourseCode={upperCode}>
      <CursoClient course={course} enrollment={enrollment} />
    </AppShell>
  );
}
