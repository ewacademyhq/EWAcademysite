import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendClaseReprogramada } from "@/lib/email";

/**
 * Avisa a los alumnos matriculados cuando el docente reprograma una clase
 * (Q15 + aviso de O3). Un docente no tiene policy de select sobre `users`
 * de otra persona (solo la suya, 0002_auth.sql) — para juntar los emails de
 * sus alumnos hace falta el cliente de service_role, igual que en
 * /api/admin/docentes. Antes de usarlo se valida a mano que el curso sea
 * realmente de este docente.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "docente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const courseCode = body?.courseCode as string | undefined;
  const titulo = body?.titulo as string | undefined;
  const fechaLabel = body?.fechaLabel as string | undefined;
  if (!courseCode || !titulo || !fechaLabel) {
    return NextResponse.json({ error: "Faltan courseCode, titulo y fechaLabel" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("docente_id, titulo")
    .eq("code", courseCode)
    .maybeSingle();

  if (courseError || !course || course.docente_id !== user.id) {
    return NextResponse.json({ error: "No autorizado para este curso" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: alumnos, error: alumnosError } = await admin
    .from("enrollments")
    .select("users!user_id(nombre, email)")
    .eq("course_code", courseCode)
    .in("estado", ["activa", "mora"]);

  if (alumnosError) {
    return NextResponse.json({ error: alumnosError.message }, { status: 500 });
  }

  const destinatarios = (alumnos ?? [])
    .map((row) => (Array.isArray(row.users) ? row.users[0] : row.users))
    .filter((u): u is { nombre: string; email: string } => Boolean(u?.email));

  await sendClaseReprogramada({ to: destinatarios, titulo, curso: course.titulo, fechaLabel });
  return NextResponse.json({ ok: true, avisados: destinatarios.length });
}
