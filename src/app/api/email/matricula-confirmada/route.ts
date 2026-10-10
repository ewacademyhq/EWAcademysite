import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendMatriculaConfirmada } from "@/lib/email";

/**
 * Dispara el mail de confirmación de matrícula (Q15) cuando el admin aprueba
 * un comprobante. El admin ya tiene policy de select sobre `users`
 * (0002_auth.sql), así que alcanza con el cliente normal de la sesión.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const enrollmentId = body?.enrollmentId as number | undefined;
  if (!enrollmentId) {
    return NextResponse.json({ error: "Falta enrollmentId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("course_code, users!user_id(nombre, email), courses!course_code(titulo)")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Matrícula no encontrada" }, { status: 404 });
  }

  const alumno = Array.isArray(data.users) ? data.users[0] : data.users;
  const curso = Array.isArray(data.courses) ? data.courses[0] : data.courses;
  if (!alumno?.email || !curso?.titulo) {
    return NextResponse.json({ error: "Faltan datos del alumno o del curso" }, { status: 500 });
  }

  await sendMatriculaConfirmada({ to: alumno.email, nombre: alumno.nombre, curso: curso.titulo });
  return NextResponse.json({ ok: true });
}
