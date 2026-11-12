import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReenvioInvitacionDocente } from "@/lib/email";

/**
 * Reenvía la invitación a un docente que todavía no activó su cuenta (link
 * vencido o nunca abierto). inviteUserByEmail() falla si el usuario de Auth
 * ya existe, así que acá se genera un link de "recovery" en su lugar — el
 * mismo truco que usa cualquier link de reset de contraseña — y se manda
 * por nuestro propio Resend en vez de depender del envío automático de
 * Supabase (que solo corre para un alta 100% nueva).
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("nombre, email")
    .eq("id", id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? "Docente no encontrado" }, { status: 404 });
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: profile.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/activar-cuenta` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message ?? "No se pudo generar el link" }, { status: 500 });
  }

  await sendReenvioInvitacionDocente({
    to: profile.email,
    nombre: profile.nombre,
    actionLink: linkData.properties.action_link,
  });

  return NextResponse.json({ ok: true });
}
