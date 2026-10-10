import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = { title: "Política de Privacidad" };

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 text-[22px] font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-humane)" }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14.5px] leading-[1.7] text-[var(--dim)]">{children}</p>;
}

export default function PrivacidadPage() {
  return (
    <article>
      <h1
        className="font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "42px", lineHeight: 0.9 }}
      >
        Política de Privacidad
      </h1>
      <p className="mt-2 text-[13px] text-[var(--faint)]">Última actualización: octubre de 2026</p>

      <div className="mt-6 border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-4 text-[13.5px] leading-[1.6] text-[var(--text)]">
        Este documento es un <strong className="font-medium">borrador orientativo</strong>, escrito para
        reflejar cómo funciona la plataforma hoy. No reemplaza el asesoramiento de un abogado: antes de
        considerarlo válido para cumplimiento legal, EW Academy debe hacerlo revisar por un profesional
        especializado en protección de datos (Ley 25.326 en Argentina, y RGPD si corresponde a usuarios de
        la Unión Europea).
      </div>

      <H2>Responsable del tratamiento</H2>
      <P>
        EW Academy (EW Gaming Club), con sede en Resistencia, Chaco, Argentina, es responsable de los datos
        personales que se describen en este documento.
      </P>

      <H2>Qué datos recolectamos</H2>
      <P>
        Nombre y apellido, email, y los datos de pago necesarios para procesar tu matrícula. Los pagos se
        gestionan a través de Mercado Pago o por transferencia bancaria con comprobante — EW Academy no
        almacena números de tarjeta ni datos bancarios sensibles; esos datos los procesa directamente el
        medio de pago. También guardamos tu progreso dentro de los cursos y, si corresponde, los
        certificados que emitimos a tu nombre.
      </P>

      <H2>Para qué los usamos</H2>
      <P>
        Para darte acceso a los cursos en los que te matriculás, gestionar cuotas y pagos, emitir
        certificados, avisarte sobre cambios de horario de tus clases en vivo, y responder tus consultas de
        soporte.
      </P>

      <H2>Marco legal</H2>
      <P>
        Tratamos tus datos conforme a la Ley 25.326 de Protección de Datos Personales de la República
        Argentina. Si accedés desde la Unión Europea, también tenés los derechos que te reconoce el
        Reglamento General de Protección de Datos (RGPD).
      </P>

      <H2>Cuánto tiempo conservamos tus datos</H2>
      <P>
        Mientras tu cuenta esté activa, y el tiempo adicional que exija la normativa impositiva o contable
        aplicable a los comprobantes de pago.
      </P>

      <H2>Tus derechos</H2>
      <P>
        Podés pedirnos acceder a tus datos, corregirlos si están mal, o solicitar que los eliminemos
        (derecho al olvido), escribiéndonos a {SUPPORT_EMAIL}.
      </P>

      <H2>Cookies</H2>
      <P>
        Hoy usamos únicamente la cookie de sesión que genera Supabase (nuestro proveedor de autenticación)
        para mantenerte logueado — es una cookie esencial, no de seguimiento ni de publicidad. No usamos
        cookies de analítica ni de terceros. Si en el futuro sumamos alguna, lo vas a ver reflejado acá y en
        el aviso de cookies del sitio.
      </P>

      <H2>Con quién compartimos datos</H2>
      <P>
        Con Mercado Pago (para procesar pagos), Supabase (infraestructura y autenticación) y Resend (envío
        de los emails transaccionales de la plataforma, como la confirmación de matrícula). No vendemos ni
        cedemos tus datos a terceros con fines comerciales.
      </P>

      <H2>Seguridad</H2>
      <P>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra accesos no
        autorizados, pérdida o alteración.
      </P>

      <H2>Contacto</H2>
      <P>Para cualquier consulta sobre esta política o tus datos, escribinos a {SUPPORT_EMAIL}.</P>

      <H2>Cambios a esta política</H2>
      <P>
        Podemos actualizar este documento para reflejar cambios en la plataforma o en la normativa
        aplicable. La fecha de la última actualización figura arriba.
      </P>
    </article>
  );
}
