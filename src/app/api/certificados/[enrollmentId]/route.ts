import { createElement } from "react";
import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CertificadoPdf } from "@/components/certificados/CertificadoPdf";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function generarCodigo(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

/**
 * Certificado de finalización (Q13), generado al vuelo — no se guarda el
 * PDF en Storage, solo el código de verificación (tabla `certificados`),
 * para que la URL del QR sea siempre la misma.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ enrollmentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { enrollmentId } = await params;
  const supabase = await createClient();

  // La policy de `enrollments` ya resuelve quién puede ver esta fila (el
  // propio alumno, su docente o el admin) — si no vuelve nada, no tiene
  // permiso o no existe, y en los dos casos respondemos 404 por igual.
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("id, estado, users!user_id(nombre), courses!course_code(titulo, duracion, vertical)")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error || !enrollment) {
    return NextResponse.json({ error: "Matrícula no encontrada" }, { status: 404 });
  }
  if (enrollment.estado !== "finalizada") {
    return NextResponse.json({ error: "Esta matrícula todavía no está finalizada" }, { status: 403 });
  }

  const alumno = Array.isArray(enrollment.users) ? enrollment.users[0] : enrollment.users;
  const curso = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
  if (!alumno || !curso) {
    return NextResponse.json({ error: "Faltan datos del alumno o del curso" }, { status: 500 });
  }

  let { data: certificado } = await supabase
    .from("certificados")
    .select("codigo, emitido_at")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  if (!certificado) {
    const codigo = generarCodigo();
    const { data: creado, error: createError } = await supabase
      .from("certificados")
      .insert({ enrollment_id: Number(enrollmentId), codigo })
      .select("codigo, emitido_at")
      .single();
    if (createError || !creado) {
      return NextResponse.json(
        { error: createError?.message ?? "No se pudo generar el certificado" },
        { status: 500 }
      );
    }
    certificado = creado;
  }

  // Fecha real en que pasó a "finalizada" si quedó en la auditoría; si no,
  // la fecha en que se emitió el certificado por primera vez.
  const { data: auditRow } = await supabase
    .from("audit_log")
    .select("at")
    .eq("entity", "enrollment")
    .eq("entity_id", String(enrollmentId))
    .eq("a", "finalizada")
    .order("at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fechaRef = new Date(auditRow?.at ?? certificado.emitido_at);
  const fechaLabel = `${MESES[fechaRef.getMonth()]} ${fechaRef.getFullYear()}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const qrDataUrl = await QRCode.toDataURL(`${siteUrl}/certificado/${certificado.codigo}`, { margin: 1 });

  // renderToBuffer tipa su parámetro como ReactElement<DocumentProps> (el
  // <Document> de react-pdf en sí), no como "cualquier componente que
  // termine renderizando uno" — CertificadoPdf hace justamente eso.
  const documentElement = createElement(CertificadoPdf, {
    alumnoNombre: alumno.nombre,
    cursoTitulo: curso.titulo,
    duracion: curso.duracion,
    area: curso.vertical,
    fechaLabel,
    qrDataUrl,
    codigo: certificado.codigo,
  }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(documentElement);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${enrollmentId}.pdf"`,
    },
  });
}
