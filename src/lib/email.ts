import "server-only";
import { Resend } from "resend";

// Mientras no haya un dominio propio verificado en Resend, esto manda desde
// su dominio de prueba (onboarding@resend.dev) — ajustar cuando el dominio
// de EW Academia esté verificado (ver guía en el chat).
const FROM = process.env.RESEND_FROM ?? "EW Academia <onboarding@resend.dev>";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function client(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendMatriculaConfirmada({
  to,
  nombre,
  curso,
}: {
  to: string;
  nombre: string;
  curso: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn(`[email] RESEND_API_KEY no configurada — no se avisó la matrícula confirmada a ${to}`);
    return;
  }
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: `Tu matrícula en ${curso} ya está activa`,
    html: `<p>Hola ${nombre},</p><p>Tu pago fue aprobado y tu matrícula en <strong>${curso}</strong> ya está activa. Entrá a tu panel para empezar a cursar.</p>`,
  });
  if (error) console.error("[email] error enviando confirmación de matrícula:", error);
}

export async function sendClaseReprogramada({
  to,
  titulo,
  curso,
  fechaLabel,
}: {
  to: { email: string; nombre: string }[];
  titulo: string;
  curso: string;
  fechaLabel: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn(`[email] RESEND_API_KEY no configurada — no se avisó la reprogramación de "${titulo}"`);
    return;
  }
  if (to.length === 0) return;

  // Un envío por alumno (no un solo "to" con todos) para no exponerles entre
  // sí sus direcciones de correo.
  const results = await Promise.allSettled(
    to.map((alumno) =>
      client().emails.send({
        from: FROM,
        to: alumno.email,
        subject: `Cambio de fecha: ${titulo}`,
        html: `<p>Hola ${alumno.nombre},</p><p>La clase <strong>${titulo}</strong> de ${curso} se reprogramó para el ${fechaLabel}.</p>`,
      })
    )
  );
  for (const r of results) {
    if (r.status === "rejected") console.error("[email] error avisando reprogramación:", r.reason);
  }
}
