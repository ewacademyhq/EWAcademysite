import "server-only";

const MP_API = "https://api.mercadopago.com";

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

interface CreatePreferenceArgs {
  enrollmentId: number;
  courseTitle: string;
  precio: number;
  siteUrl: string;
}

interface MpPreference {
  id: string;
  init_point: string;
}

/**
 * Crea una preferencia de Checkout Pro para el primer pago. Esto NO es la
 * suscripción recurrente ("débito automático") que promete el checkout —
 * es un pago único que activa la matrícula. El cobro automático de los
 * meses siguientes queda para una fase posterior (Suscripciones/preapproval
 * de Mercado Pago). Ver docs/SPEC.md.
 */
export async function createPreference({
  enrollmentId,
  courseTitle,
  precio,
  siteUrl,
}: CreatePreferenceArgs): Promise<MpPreference> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado");

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: courseTitle,
          quantity: 1,
          unit_price: precio,
          currency_id: "ARS",
        },
      ],
      external_reference: String(enrollmentId),
      back_urls: {
        success: `${siteUrl}/panel`,
        pending: `${siteUrl}/panel`,
        failure: `${siteUrl}/checkout`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago rechazó la preferencia (${res.status}): ${body}`);
  }

  return res.json();
}

export interface MpPayment {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
}

export async function getPayment(paymentId: string): Promise<MpPayment> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado");

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`No se pudo leer el pago ${paymentId} (${res.status}): ${body}`);
  }

  return res.json();
}
