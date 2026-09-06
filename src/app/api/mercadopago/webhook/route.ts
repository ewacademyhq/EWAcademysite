import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayment } from "@/lib/mercadopago";
import { todayISO } from "@/lib/date";

async function handlePaymentId(paymentId: string | null) {
  if (!paymentId) return NextResponse.json({ ok: true });

  try {
    const payment = await getPayment(paymentId);
    if (payment.status !== "approved" || !payment.external_reference) {
      return NextResponse.json({ ok: true });
    }

    const enrollmentId = Number(payment.external_reference);
    const supabase = createAdminClient();

    await supabase
      .from("enrollments")
      .update({ estado: "activa", ultimo_pago_at: todayISO() })
      .eq("id", enrollmentId);

    await supabase.from("payments").insert({
      enrollment_id: enrollmentId,
      periodo: todayISO(),
      monto: payment.transaction_amount,
      medio: "Mercado Pago",
      estado: "acreditado",
      acreditado_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error procesando webhook de Mercado Pago:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Mercado Pago manda la notificación real por POST...
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const paymentId =
    body?.data?.id ?? request.nextUrl.searchParams.get("id") ?? null;
  return handlePaymentId(paymentId ? String(paymentId) : null);
}

// ...pero a veces valida la URL del webhook con un GET simple.
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("id");
  return handlePaymentId(paymentId);
}
