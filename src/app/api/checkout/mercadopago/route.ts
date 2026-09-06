import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseByCode } from "@/lib/data/courses";
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { todayISO } from "@/lib/date";

/**
 * Arranca la matriculación por Mercado Pago.
 *
 * Sin MERCADOPAGO_ACCESS_TOKEN configurado: activa la matrícula directo
 * (simulado, hasta tener credenciales reales — ver docs/SPEC.md).
 * Con credenciales: crea la matrícula en estado "pendiente" y devuelve el
 * link de Checkout Pro; la activación real la hace el webhook cuando
 * Mercado Pago confirma el pago.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const courseCode = body?.courseCode as string | undefined;

  if (!courseCode) {
    return NextResponse.json({ error: "Falta courseCode" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const course = await getCourseByCode(courseCode);
  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, estado")
    .eq("user_id", user.id)
    .eq("course_code", courseCode)
    .maybeSingle();

  if (existing?.estado === "activa") {
    return NextResponse.json({ mode: "already-active" });
  }

  let enrollmentId = existing?.id as number | undefined;

  if (!enrollmentId) {
    const { data: created, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_code: courseCode,
        cuota_congelada: course.precio,
        estado: "pendiente",
        medio: "Mercado Pago",
      })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: error?.message ?? "No se pudo crear la matrícula" },
        { status: 500 }
      );
    }
    enrollmentId = created.id;
  }

  if (!enrollmentId) {
    return NextResponse.json({ error: "No se pudo resolver la matrícula" }, { status: 500 });
  }

  if (!isMercadoPagoConfigured()) {
    // Activar una matrícula es una acción del "gateway de pago", no del
    // alumno — igual que hace el webhook real, se hace con el cliente de
    // service_role, nunca con la sesión del propio alumno (que solo puede
    // leer/crear su matrícula, no activarla — ver 0002_auth.sql).
    const admin = createAdminClient();
    const { error } = await admin
      .from("enrollments")
      .update({ estado: "activa", ultimo_pago_at: todayISO() })
      .eq("id", enrollmentId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ mode: "simulated" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  try {
    const preference = await createPreference({
      enrollmentId,
      courseTitle: course.titulo,
      precio: course.precio,
      siteUrl,
    });
    return NextResponse.json({ mode: "redirect", url: preference.init_point });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
