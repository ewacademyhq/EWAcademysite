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

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 flex flex-col gap-2 text-[14.5px] leading-[1.7] text-[var(--dim)]">{children}</ul>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="pl-4" style={{ textIndent: "-1em" }}>
      <span className="text-[var(--accent)]">· </span>
      {children}
    </li>
  );
}

export default function PrivacidadPage() {
  return (
    <article>
      <h1
        className="font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "42px", lineHeight: 0.9 }}
      >
        Política de Privacidad y Protección de Datos Personales
      </h1>
      <p className="mt-2 text-[13px] text-[var(--faint)]">Última actualización: 13 de octubre de 2026</p>

      <H2>Identificación del responsable</H2>
      <P>
        Academia EW es una plataforma privada de formación y capacitación del ecosistema EW Gaming Club,
        con actividad comercial en Resistencia, Chaco, República Argentina.
      </P>
      <P>
        Nombre comercial: Academia EW. Titularidad: persona humana inscripta en Monotributo. CUIT:
        20-33214263-2. Domicilio comercial declarado: Liniers 1500, Resistencia, Chaco, Argentina. Sitios:
        academiaew.com y academiaew.com.ar. Contacto: {SUPPORT_EMAIL}.
      </P>

      <H2>Alcance</H2>
      <P>
        La presente política regula el tratamiento de datos de estudiantes, docentes, visitantes y usuarios
        de los sitios, aulas virtuales, inscripciones, clases, evaluaciones y certificaciones. Se aplica la
        Ley 25.326 de Protección de Datos Personales y normativa complementaria. Los servicios están
        destinados exclusivamente a personas mayores de 18 años.
      </P>

      <H2>Datos recopilados</H2>
      <P>Según las necesidades del servicio podrán tratarse las siguientes categorías:</P>
      <UL>
        <LI>
          Identificación y contacto: nombre, apellido, DNI cuando sea necesario, fecha de nacimiento (para
          verificar que sos mayor de 18 años), email, teléfono y datos de facturación.
        </LI>
        <LI>Cuenta y seguridad: identificadores, información técnica de autenticación y registros de acceso.</LI>
        <LI>
          Información académica: cursos, asistencia, progreso, trabajos, calificaciones, evaluaciones y
          certificados.
        </LI>
        <LI>
          Información de pagos: comprobantes, identificadores de transacción, importes y estados; no se
          almacenan directamente números completos de tarjeta ni códigos de seguridad.
        </LI>
        <LI>
          Contenido audiovisual: imagen, voz, intervenciones y chat de clases grabadas, previa información y
          autorizaciones pertinentes.
        </LI>
        <LI>
          Datos técnicos: dirección IP, navegador, dispositivo y registros de seguridad, según la
          implementación efectiva.
        </LI>
      </UL>

      <H2>Finalidades</H2>
      <P>
        Los datos se utilizan para registrar cuentas, gestionar matrículas y pagos, brindar acceso a cursos,
        administrar asistencias y evaluaciones, emitir certificados, enviar comunicaciones académicas y
        operativas, atender soporte, prevenir fraudes, mejorar el servicio y cumplir obligaciones legales y
        fiscales. Las comunicaciones promocionales se realizarán conforme a las autorizaciones o bases
        legales pertinentes.
      </P>

      <H2>Base jurídica</H2>
      <P>
        El tratamiento se funda en consentimiento informado cuando resulta exigible, en las obligaciones
        derivadas de la relación educativa o comercial, en el cumplimiento de obligaciones legales u otras
        excepciones reconocidas por la Ley 25.326. Cuando resulte aplicable el RGPD, se identificarán sus
        bases jurídicas específicas; el mero acceso desde Europa no determina por sí solo su aplicación.
      </P>

      <H2>Clases y grabaciones</H2>
      <P>
        Podemos grabar clases, tutorías, talleres y eventos educativos para permitir repaso y disponibilidad
        a usuarios autorizados. Se informa previamente la existencia de la grabación, su finalidad y las
        condiciones de acceso. Cuando corresponde se solicita consentimiento o autorización específica para
        imagen y voz.
      </P>
      <P>
        Las grabaciones pueden conservarse sin un vencimiento académico predeterminado mientras exista una
        finalidad legítima y se respeten los derechos de las personas. La retención de datos personales
        identificables no es indefinida por defecto ni sin justificación. La difusión promocional requiere
        autorización diferenciada cuando corresponda.
      </P>

      <H2>Acceso y protección del material</H2>
      <P>
        Las grabaciones y los recursos digitales están restringidos a personas habilitadas. El acceso
        ilimitado a un curso, cuando se ofrece, significa ausencia de vencimiento predeterminado y se rige
        por las condiciones contractuales. Los derechos de autor y las restricciones de reproducción se
        detallan en los Términos y Condiciones.
      </P>

      <H2>Trabajos estudiantiles</H2>
      <P>
        Los estudiantes conservan los derechos de propiedad intelectual que les correspondan sobre sus
        creaciones. Podemos recibir, almacenar y evaluar sus entregas para cumplir el servicio educativo;
        los usos públicos o comerciales necesitan las autorizaciones pertinentes.
      </P>

      <H2>Con quién compartimos datos</H2>
      <P>
        Trabajamos con prestadores de infraestructura y autenticación, de procesamiento de pagos y de envío
        de comunicaciones por email, en la medida necesaria para prestar el servicio. No vendemos bases de
        datos personales con fines comerciales. El intercambio se limita a lo necesario y está sujeto a las
        garantías de confidencialidad y seguridad aplicables.
      </P>

      <H2>Ubicación y transferencias internacionales</H2>
      <P>
        Academia EW opera comercialmente desde Argentina. La infraestructura utilizada por ciertos
        prestadores podría estar alojada o procesar datos fuera del país. Las transferencias
        internacionales se realizan solo mediante mecanismos permitidos y garantías legalmente exigibles.
      </P>

      <H2>Conservación</H2>
      <P>
        Los datos se conservan durante el tiempo necesario para las finalidades comunicadas, y los períodos
        adicionales exigidos por normas legales, contables o fiscales. Los registros académicos y
        certificados pueden mantenerse para verificación; las grabaciones, como obras educativas, pueden
        permanecer disponibles sin plazo predeterminado sujeto a derechos y necesidad. Los datos
        innecesarios se eliminan o anonimizan cuando corresponde.
      </P>

      <H2>Seguridad</H2>
      <P>
        Aplicamos medidas técnicas y organizativas razonables: controles de acceso, autenticación, permisos
        por rol, protección de comunicaciones y procedimientos de respuesta a incidentes. Ningún sistema
        ofrece seguridad absoluta.
      </P>

      <H2>Tus derechos</H2>
      <P>
        Podés ejercer tus derechos de acceso, rectificación, actualización, supresión y confidencialidad
        cuando proceda, escribiendo a {SUPPORT_EMAIL}. La Ley 25.326 prevé, en términos generales, diez días
        corridos para responder solicitudes fehacientes de acceso y cinco días hábiles para rectificación,
        actualización o supresión. Podemos solicitar una verificación razonable de tu identidad. La Agencia
        de Acceso a la Información Pública es la autoridad nacional de control.
      </P>

      <H2>Eliminación de cuentas</H2>
      <P>
        Podés solicitar la eliminación de tu cuenta; la baja de cuenta no elimina necesariamente documentos
        que deban conservarse por exigencias legales o razones legítimas de acreditación académica. Te
        explicamos los efectos sobre el acceso a materiales antes de confirmar.
      </P>

      <H2>Cookies y sesión</H2>
      <P>
        Usamos cookies de sesión y autenticación para mantenerte logueado — son cookies esenciales, no de
        seguimiento ni de publicidad. Según el funcionamiento actualmente declarado no empleamos cookies
        publicitarias ni analítica de terceros. Si en el futuro se incorporan, se actualizarán los avisos y
        consentimientos aplicables.
      </P>

      <H2>Inteligencia artificial</H2>
      <P>
        Si integramos herramientas de inteligencia artificial que procesen datos personales, informaremos
        las finalidades y garantías correspondientes. Los datos personales no se destinan a entrenamiento
        externo para finalidades ajenas al servicio sin una base jurídica válida.
      </P>

      <H2>Cambios y contacto</H2>
      <P>
        Esta política puede actualizarse por cambios legales o técnicos; las modificaciones sustanciales se
        informarán y, cuando corresponda, se solicitarán nuevas autorizaciones. Para cualquier consulta
        sobre esta política o tus datos, escribinos a {SUPPORT_EMAIL}.
      </P>
    </article>
  );
}
