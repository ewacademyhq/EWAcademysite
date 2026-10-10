import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = { title: "Términos y Condiciones" };

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

export default function TerminosPage() {
  return (
    <article>
      <h1
        className="font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "42px", lineHeight: 0.9 }}
      >
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-[13px] text-[var(--faint)]">Vigentes desde octubre de 2026</p>

      <div className="mt-6 border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-4 text-[13.5px] leading-[1.6] text-[var(--text)]">
        Este documento es un <strong className="font-medium">borrador orientativo</strong>, escrito para
        reflejar cómo funciona la plataforma hoy. No reemplaza el asesoramiento de un abogado: antes de
        considerarlo válido, EW Academy debe hacerlo revisar por un profesional, en particular la sección de
        reembolsos/cancelación, que depende de la política comercial real del negocio.
      </div>

      <H2>Aceptación</H2>
      <P>
        Al crear una cuenta o matricularte en un curso de EW Academy, aceptás estos Términos y Condiciones y
        la Política de Privacidad.
      </P>

      <H2>El servicio</H2>
      <P>
        EW Academy ofrece cursos online de tecnología, en dos modalidades: cohorte (fecha de inicio y fin
        fijas, con clases en vivo) y autogestionado (acceso inmediato, a tu ritmo).
      </P>

      <H2>Tu cuenta</H2>
      <P>
        Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad que ocurra en tu
        cuenta.
      </P>

      <H2>Precios y pagos</H2>
      <P>
        Los precios están expresados en pesos argentinos (ARS), IVA incluido. Aceptamos Mercado Pago (débito
        automático) y transferencia bancaria con comprobante sujeto a aprobación. Tu cuota queda congelada al
        valor del día en que te matriculaste, independientemente de si el curso sube de precio después.
      </P>

      <H2>Reembolsos y cancelación</H2>
      <P>
        <em>[A completar con la política real de EW Academy — no la inventamos acá.]</em> Podés informar la
        baja de un curso desde tu panel, con 30 días de aviso antes de que se haga efectiva.
      </P>

      <H2>Propiedad intelectual</H2>
      <P>
        El contenido de los cursos (clases, material, grabaciones) es propiedad de EW Academy o de sus
        docentes y se licencia solo para tu uso personal — no está permitido redistribuirlo ni revenderlo.
      </P>

      <H2>Certificados</H2>
      <P>
        Emitimos un certificado de finalización cuando completás un curso con las cuotas al día. El
        certificado incluye un código de verificación público.
      </P>

      <H2>Límite de responsabilidad</H2>
      <P>
        EW Academy pone a disposición el contenido y la infraestructura de la plataforma con el mejor
        esfuerzo, pero no garantiza resultados laborales o profesionales específicos derivados de cursar.
      </P>

      <H2>Ley aplicable</H2>
      <P>
        Estos términos se rigen por las leyes de la República Argentina, con jurisdicción en los tribunales
        de Resistencia, Chaco.
      </P>

      <H2>Cambios a estos términos</H2>
      <P>Podemos actualizar este documento; la fecha de vigencia figura arriba.</P>

      <H2>Contacto</H2>
      <P>Para cualquier consulta, escribinos a {SUPPORT_EMAIL}.</P>
    </article>
  );
}
