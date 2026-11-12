import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificacionEmail } from "@/lib/email";

/**
 * EWA-040 (opción no bloqueante): genera un token de verificación propio y
 * manda el mail. Se llama después del signup del checkout, y también desde
 * el botón "Reenviar" del panel si el primer mail no llegó. No bloquea nada
 * si falla — el checkout y el acceso siguen funcionando igual.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (user.emailVerificado) return NextResponse.json({ ok: true, yaVerificado: true });

  const token = randomBytes(32).toString("hex");
  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("users")
    .update({ email_verificacion_token: token, email_verificacion_enviado_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await sendVerificacionEmail({ to: user.email, nombre: user.nombre, token });

  return NextResponse.json({ ok: true });
}
