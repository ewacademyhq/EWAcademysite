import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Activar/desactivar la cuenta de un alumno — a diferencia del mismo toggle
 * para docentes, acá se exige un motivo (pedido explícito del usuario, para
 * auditoría: tocar el acceso de un alumno es más sensible que el de un
 * docente). Igual que en docentes, desactivar revoca el acceso real vía ban
 * de Supabase Auth, no solo lo oculta en la UI.
 */
export async function PATCH(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const activo = body?.activo as boolean | undefined;
  const motivo = (body?.motivo as string | undefined)?.trim();

  if (!id || typeof activo !== "boolean" || !motivo) {
    return NextResponse.json({ error: "Faltan id, activo y motivo" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("users")
    .update({ activo })
    .eq("id", id)
    .eq("rol", "alumno");
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: banError } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: activo ? "none" : "876000h",
  });
  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    entity: "user",
    entity_id: id,
    de: activo ? "desactivado" : "activo",
    a: activo ? "activo" : "desactivado",
    usuario_id: admin.id,
    nota: motivo,
  });

  return NextResponse.json({ ok: true });
}
