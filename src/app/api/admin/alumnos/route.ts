import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * El admin edita el email de un alumno (soporte: errores de carga, cambio de
 * casilla, etc.). Toca auth.users (login real) y public.users (lo que se
 * muestra en la app) — por eso necesita service_role, no alcanza con una
 * policy de RLS para la sesión del admin. `email_confirm: true` evita que
 * Supabase dispare el flujo de doble confirmación por mail: el admin ya
 * verificó la identidad del alumno por el canal de soporte.
 */
export async function PATCH(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const email = (body?.email as string | undefined)?.trim().toLowerCase();

  if (!id || !email) return NextResponse.json({ error: "Faltan id y email" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: antes, error: antesError } = await supabase
    .from("users")
    .select("email")
    .eq("id", id)
    .eq("rol", "alumno")
    .maybeSingle();
  if (antesError || !antes) {
    return NextResponse.json({ error: antesError?.message ?? "Alumno no encontrado" }, { status: 404 });
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ email })
    .eq("id", id)
    .eq("rol", "alumno");
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    entity: "user",
    entity_id: id,
    de: antes.email,
    a: email,
    usuario_id: admin.id,
  });

  return NextResponse.json({ ok: true });
}
