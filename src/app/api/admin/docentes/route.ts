import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Alta y baja de docentes desde el panel de admin (hallazgo QA Q17-19: no
 * había ninguna UI para esto, solo el script scripts/set-role.ts). Usa
 * createAdminClient() (service_role) porque crear/banear un usuario de Auth
 * y tocar su rol en `users` son operaciones del sistema, no algo que la RLS
 * de la sesión del admin deba permitir directo — se valida el rol a mano
 * antes de usar el cliente de service role, igual que en los route handlers
 * de Mercado Pago.
 */

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.rol !== "admin") return null;
  return user;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const nombre = (body?.nombre as string | undefined)?.trim();

  if (!email || !nombre) {
    return NextResponse.json({ error: "Faltan email y nombre" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  let authUserId = existing.users.find((u) => u.email === email)?.id;

  if (!authUserId) {
    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { nombre },
    });
    if (inviteError || !invited?.user) {
      return NextResponse.json(
        { error: inviteError?.message ?? "No se pudo invitar al docente" },
        { status: 500 }
      );
    }
    authUserId = invited.user.id;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ rol: "docente", nombre, activo: true })
    .eq("id", authUserId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ id: authUserId });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const activo = body?.activo as boolean | undefined;

  if (!id || typeof activo !== "boolean") {
    return NextResponse.json({ error: "Faltan id y activo" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase.from("users").update({ activo }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Dar de baja también revoca el acceso real, no solo lo oculta en la UI.
  const { error: banError } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: activo ? "none" : "876000h",
  });
  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
