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
        Términos y Condiciones de Uso y Servicios Educativos
      </h1>
      <p className="mt-2 text-[13px] text-[var(--faint)]">Última actualización: 13 de octubre de 2026</p>

      <H2>Identificación y objeto</H2>
      <P>
        Academia EW, plataforma privada educativa con titularidad unipersonal inscripta en Monotributo,
        CUIT 20-33214263-2, domicilio comercial declarado Liniers 1500, Resistencia, Chaco, Argentina,
        ofrece formación digital y servicios educativos en academiaew.com y academiaew.com.ar. Contacto:{" "}
        {SUPPORT_EMAIL}.
      </P>
      <P>
        Los servicios están destinados exclusivamente a personas mayores de 18 años. Al registrarte,
        declarás ser mayor de edad — la fecha de nacimiento que cargás al crear tu cuenta se usa para
        verificarlo.
      </P>

      <H2>Aceptación</H2>
      <P>
        El registro y la contratación requieren aceptación expresa de estos Términos, registrándose la
        versión y fecha cuando resulta técnicamente posible. Las condiciones particulares de cada curso se
        informan antes de la contratación.
      </P>

      <H2>Servicios y certificación</H2>
      <P>
        Ofrecemos cursos grabados y en vivo, tutorías, talleres, capacitaciones presenciales o híbridas,
        evaluaciones y certificados. Salvo indicación respaldada expresamente, las certificaciones son
        privadas y no equivalen a títulos oficiales habilitantes. Los requisitos para obtener certificados
        se indican antes de contratar.
      </P>

      <H2>Acceso ilimitado</H2>
      <P>
        Como condición general, los cursos adquiridos ofrecen acceso ilimitado, sin fecha predeterminada de
        vencimiento, a los videos y materiales incluidos. Pueden existir cursos con plazos distintos,
        siempre informados claramente antes del pago.
      </P>
      <P>
        Acceso ilimitado no supone que el servicio exista perpetuamente ni la adquisición de propiedad sobre
        el contenido. La disponibilidad queda sujeta al mantenimiento del servicio, licencias y causas
        técnicas, legales o contractuales justificadas. Ante discontinuaciones o cambios sustanciales se
        informará a los afectados y se respetarán las soluciones y derechos reconocidos por la ley de
        consumo.
      </P>

      <H2>Propiedad intelectual</H2>
      <P>
        Los videos, grabaciones, PDF, guías, manuales, presentaciones, evaluaciones, imágenes, código
        fuente, diseños y demás obras originales están protegidos por la Ley 11.723 cuando corresponda.
        Academia EW ejerce derechos sobre los contenidos propios o aquellos para los cuales cuente con
        cesión o licencia suficiente. Los materiales ajenos conservan sus derechos y licencias.
      </P>
      <P>
        La compra de un curso concede una licencia personal, no exclusiva y no transferible para formación,
        sin transferir propiedad intelectual ni derechos de explotación comercial.
      </P>

      <H2>Usos prohibidos</H2>
      <P>
        Sin autorización del titular de derechos o salvo excepción legal aplicable, se prohíbe reproducir,
        republicar, redistribuir, revender o retransmitir contenidos; compartir PDF o archivos con terceros;
        grabar sesiones privadas; facilitar credenciales; eludir controles de acceso; realizar extracción
        automatizada masiva o eliminar marcas de autoría. Los materiales autorizados para descarga pueden
        conservarse para estudio personal conforme a su licencia.
      </P>

      <H2>Clases grabadas</H2>
      <P>
        Las clases pueden grabarse, con aviso previo y autorizaciones aplicables, para su publicación
        educativa a usuarios habilitados. Pueden conservarse sin vencimiento académico previsto siempre que
        subsistan los derechos y bases jurídicas necesarias. La grabación de una clase no transfiere
        automáticamente los derechos de los docentes ni la autorización de imagen y voz de participantes.
      </P>

      <H2>Contratación docente</H2>
      <P>
        Los docentes pueden prestar servicios mediante contratos de locación de servicios u otras
        modalidades legalmente válidas. El contrato de servicios por sí solo no transfiere derechos de
        propiedad intelectual. Debe celebrarse una licencia o cesión expresa que defina grabación, edición,
        alojamiento, comercialización, promoción, duración, territorio, remuneración y eventual
        disponibilidad después de finalizada la relación contractual.
      </P>

      <H2>Trabajos de alumnos</H2>
      <P>
        Los estudiantes conservan los derechos que les correspondan sobre obras y proyectos originales. Su
        entrega permite la revisión y evaluación necesarias; cualquier difusión promocional o
        aprovechamiento comercial adicional precisa la autorización pertinente.
      </P>

      <H2>Integridad y convivencia</H2>
      <P>
        Se prohíben el plagio, suplantación, fraude académico, acoso, discriminación, vulneración de la
        privacidad, uso indebido de IA en evaluaciones y cualquier interferencia maliciosa con el servicio.
        La Academia puede aplicar medidas justificadas y proporcionadas, con vías de revisión cuando
        corresponda.
      </P>

      <H2>Cuentas y seguridad</H2>
      <P>
        Las cuentas son personales. No está permitido venderlas, compartir claves ni permitir el uso por
        terceros no habilitados. Se prohíbe introducir malware, acceder a datos de otras personas, explotar
        vulnerabilidades o intentar eludir restricciones de seguridad sin autorización.
      </P>

      <H2>Precios y pagos</H2>
      <P>
        Antes de la compra se comunican precio, duración, modalidad, condiciones de matrícula, medios de
        pago, vigencia de acceso y certificación. Los pagos pueden efectuarse mediante Mercado Pago o
        transferencia bancaria. Promociones, becas y planes de cuotas se rigen por condiciones claramente
        informadas.
      </P>

      <H2>Arrepentimiento y devoluciones</H2>
      <P>
        Para las contrataciones a distancia comprendidas en el derecho legal de revocación, el consumidor
        puede ejercer el derecho de arrepentimiento dentro del plazo general de diez (10) días corridos,
        computados de acuerdo con las reglas legales aplicables. Se respetan las excepciones legales que
        efectivamente correspondan a cada caso, incluidas las previstas para determinados contenidos o
        servicios digitales.
      </P>
      <P>
        No se niega automáticamente la revocación por haber iniciado sesión o visualizado contenido. Cuando
        proceda, se tramita la devolución según los requisitos y plazos legales, utilizando el medio de pago
        original cuando sea posible.
      </P>

      <H2>Botón de arrepentimiento y baja</H2>
      <P>
        En los sitios se habilitan mecanismos visibles de Botón de Arrepentimiento y, cuando corresponda,
        Botón de Baja, conforme a la normativa argentina vigente. No se exigen obstáculos injustificados ni
        pasos adicionales que contradigan la legislación; pueden aplicarse verificaciones razonables de
        identidad y se emite constancia de recepción.
      </P>

      <H2>Certificados</H2>
      <P>
        Se emiten conforme a requisitos académicos y administrativos informados (asistencia, evaluaciones,
        actividades y pagos aplicables). Se pueden emplear sistemas de verificación de autenticidad.
        Cualquier revocación por fraude debe basarse en hechos comprobables y permitir revisión según
        corresponda.
      </P>

      <H2>Suspensiones</H2>
      <P>
        La Academia puede adoptar medidas proporcionales ante incumplimientos graves, fraude, uso indebido
        de credenciales o distribución no autorizada de obras protegidas, respetando los derechos legales y
        contractuales del usuario.
      </P>

      <H2>Disponibilidad y cambios</H2>
      <P>
        La plataforma procura mantener los servicios disponibles; pueden existir tareas de mantenimiento e
        incidentes técnicos. Modificaciones sustanciales de cursos ya contratados se comunicarán y darán
        lugar a las soluciones exigibles por ley. No se excluye responsabilidad legal por incumplimientos.
      </P>

      <H2>Inteligencia artificial</H2>
      <P>
        No se autoriza la extracción de contenido protegido para entrenar o comercializar modelos externos,
        ni la comercialización de cursos derivados que reproduzcan obras protegidas sin permiso, salvo usos
        permitidos por ley. Los conocimientos e ideas no protegidos siguen siendo de libre utilización.
      </P>

      <H2>Privacidad, normas y contacto</H2>
      <P>
        El tratamiento de datos se rige por la Política de Privacidad de Academia EW. Se respetan la Ley
        24.240, la Ley 25.326, la Ley 11.723, el Código Civil y Comercial y las demás normas aplicables.
        Ninguna cláusula restringe derechos irrenunciables de consumidores ni la competencia legal de
        tribunales y autoridades.
      </P>
      <P>
        Academia EW · CUIT 20-33214263-2 · Liniers 1500, Resistencia, Chaco · academiaew.com ·
        academiaew.com.ar · {SUPPORT_EMAIL}
      </P>
    </article>
  );
}
