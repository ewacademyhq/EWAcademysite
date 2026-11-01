import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDriveFolder, isDriveConfigured, shareFolder } from "@/lib/google-drive";

/**
 * Crea la carpeta de Drive de un curso (en la cuenta única, ver
 * GOOGLE_DRIVE_REFRESH_TOKEN) y la comparte: cualquiera con el link queda
 * como lector (cubre alumnos/navegación general — se usa junto con el gate
 * de "arrancó el cohorte" en CursoClient), el docente del curso y cada admin
 * quedan como editores directos. Guarda el link en courses.drive_folder_url.
 * Usa el service role porque tiene que leer el email de otros usuarios
 * (docente + admins), algo que ni el docente ni el admin logueado pueden
 * hacer con su propio cliente por RLS.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.rol !== "docente" && user.rol !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!isDriveConfigured()) {
    return NextResponse.json({ error: "Google Drive no está configurado" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const courseCode = (body?.courseCode as string | undefined)?.trim().toUpperCase();
  if (!courseCode) {
    return NextResponse.json({ error: "Falta el código del curso" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("code, titulo, docente_id")
    .eq("code", courseCode)
    .maybeSingle();
  if (courseError || !course) {
    return NextResponse.json({ error: "No se encontró el curso" }, { status: 404 });
  }
  if (user.rol === "docente" && course.docente_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [{ data: docente }, { data: admins }] = await Promise.all([
    course.docente_id
      ? admin.from("users").select("email").eq("id", course.docente_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("users").select("email").eq("rol", "admin"),
  ]);

  let folder;
  try {
    folder = await createDriveFolder(`${course.code} — ${course.titulo}`);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo crear la carpeta de Drive" },
      { status: 502 }
    );
  }

  // Compartir es best-effort por permiso: un email inválido no debería tirar
  // abajo una carpeta que ya se creó bien.
  await shareFolder(folder.id, { type: "anyone", role: "reader" }).catch(() => {});
  if (docente?.email) {
    await shareFolder(folder.id, { type: "user", role: "writer", email: docente.email }).catch(() => {});
  }
  for (const a of admins ?? []) {
    if (a.email) await shareFolder(folder.id, { type: "user", role: "writer", email: a.email }).catch(() => {});
  }

  const { error: updateError } = await admin
    .from("courses")
    .update({ drive_folder_url: folder.webViewLink })
    .eq("code", courseCode);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: folder.webViewLink });
}
