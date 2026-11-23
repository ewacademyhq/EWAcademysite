import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRestablecerContrasena } from "@/lib/email";

/**
 * El admin dispara un restablecimiento de contraseña para un alumno que
 * llama por soporte (olvidó la contraseña, no le llega el mail de
 * "olvidé mi contraseña", etc.). Mismo patrón que reenviar invitación a
 * docente: se genera un link de "recovery" con la API de admin y se manda
 * por nuestro propio Resend (ya brandeado) en vez del mail nativo de
 * Supabase. El admin nunca ve ni define la contraseña real — la elige el
 * alumno al abrir el link, en /activar-cuenta (misma pantalla que ya sirve
 * para esto).
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: alumno, error: alumnoError } = await supabase
    .from("users")
    .select("nombre, email")
    .eq("id", id)
    .eq("rol", "alumno")
    .maybeSingle();

  if (alumnoError || !alumno) {
    return NextResponse.json({ error: alumnoError?.message ?? "Alumno no encontrado" }, { status: 404 });
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: alumno.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/activar-cuenta` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message ?? "No se pudo generar el link" }, { status: 500 });
  }

  await sendRestablecerContrasena({
    to: alumno.email,
    nombre: alumno.nombre,
    actionLink: linkData.properties.action_link,
  });

  await supabase.from("audit_log").insert({
    entity: "user",
    entity_id: id,
    de: null,
    a: "restablecimiento de contraseña enviado",
    usuario_id: admin.id,
  });

  return NextResponse.json({ ok: true });
}
