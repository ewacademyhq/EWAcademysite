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

/** Envoltorio con el branding de EW Academy (logo, acento naranja, pie) — mismo estilo en todos los mails que manda la app. */
function emailShell(bodyHtml: string): string {
  return `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; background: #ffffff;">
  <div style="margin-bottom: 28px;">
    <span style="display: inline-block; background: #d9631a; color: #ffffff; font-weight: bold; padding: 6px 10px; font-size: 14px; letter-spacing: 1px;">EW</span>
    <span style="font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-left: 8px; vertical-align: middle;">ACADEMY</span>
  </div>
  ${bodyHtml}
  <p style="font-size: 12px; color: #bbb; margin-top: 32px;">EW Academy · academiaew.com</p>
</div>`;
}

function emailTitulo(texto: string): string {
  return `<h1 style="font-size: 22px; margin: 0 0 16px; line-height: 1.3;">${texto}</h1>`;
}

function emailParrafo(html: string): string {
  return `<p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 24px;">${html}</p>`;
}

function emailBoton(label: string, url: string): string {
  return `<a href="${url}" style="display: inline-block; background: #d9631a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 14px 28px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${label}</a>`;
}

function emailNotaLink(textoAntesDelLink: string, url: string): string {
  return `<p style="font-size: 13px; color: #777; line-height: 1.6; margin-top: 28px;">${textoAntesDelLink}<br><a href="${url}" style="color: #d9631a; word-break: break-all;">${url}</a></p>`;
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
  const panelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/panel`;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: `Tu matrícula en ${curso} ya está activa`,
    html: emailShell(
      emailTitulo(`¡Tu matrícula está activa, ${nombre}!`) +
        emailParrafo(`Tu pago fue aprobado y tu matrícula en <strong>${curso}</strong> ya está activa.`) +
        emailBoton("Ir a mi panel", panelUrl)
    ),
  });
  if (error) console.error("[email] error enviando confirmación de matrícula:", error);
}

export async function sendVerificacionEmail({
  to,
  nombre,
  token,
}: {
  to: string;
  nombre: string;
  token: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn(`[email] RESEND_API_KEY no configurada — no se mandó la verificación a ${to}`);
    return;
  }
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/verificar-email?token=${token}`;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: "Confirmá tu email en EW Academy",
    html: emailShell(
      emailTitulo(`Confirmá tu email, ${nombre}`) +
        emailParrafo(
          "Hacé clic en el botón para confirmar que esta es tu casilla de verdad. Si no lo confirmás, vas a seguir teniendo acceso normal a tu cuenta — pero si escribiste mal tu email al registrarte, esta es la forma de que lo detectemos."
        ) +
        emailBoton("Confirmar mi email", url) +
        emailNotaLink("Si el botón no funciona, copiá y pegá este link en tu navegador:", url)
    ),
  });
  if (error) console.error("[email] error enviando verificación de email:", error);
}

export async function sendReenvioInvitacionDocente({
  to,
  nombre,
  actionLink,
}: {
  to: string;
  nombre: string;
  actionLink: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn(`[email] RESEND_API_KEY no configurada — no se reenvió la invitación a ${to}`);
    return;
  }
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: "Tu invitación a EW Academy (reenviada)",
    html: emailShell(
      emailTitulo(`Te reenviamos tu invitación, ${nombre}`) +
        emailParrafo("Tu link anterior venció o ya se usó. Hacé clic en el botón de abajo para crear tu contraseña y activar tu cuenta de docente.") +
        emailBoton("Aceptar invitación", actionLink) +
        emailNotaLink("Si el botón no funciona, copiá y pegá este link en tu navegador:", actionLink)
    ),
  });
  if (error) console.error("[email] error reenviando invitación de docente:", error);
}

export async function sendRestablecerContrasena({
  to,
  nombre,
  actionLink,
}: {
  to: string;
  nombre: string;
  actionLink: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn(`[email] RESEND_API_KEY no configurada — no se mandó el restablecimiento de contraseña a ${to}`);
    return;
  }
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: "Restablecé tu contraseña en EW Academy",
    html: emailShell(
      emailTitulo(`Restablecé tu contraseña, ${nombre}`) +
        emailParrafo(
          "Un administrador de EW Academy inició un restablecimiento de contraseña para tu cuenta. Hacé clic en el botón para elegir una nueva — si no lo pediste vos, podés ignorar este mail."
        ) +
        emailBoton("Elegir contraseña nueva", actionLink) +
        emailNotaLink("Si el botón no funciona, copiá y pegá este link en tu navegador:", actionLink)
    ),
  });
  if (error) console.error("[email] error mandando restablecimiento de contraseña:", error);
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
        html: emailShell(
          emailTitulo(`Cambio de fecha: ${titulo}`) +
            emailParrafo(`Hola ${alumno.nombre}, la clase <strong>${titulo}</strong> de ${curso} se reprogramó para el ${fechaLabel}.`)
        ),
      })
    )
  );
  for (const r of results) {
    if (r.status === "rejected") console.error("[email] error avisando reprogramación:", r.reason);
  }
}
