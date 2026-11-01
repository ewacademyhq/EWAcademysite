import "server-only";

const ZOOM_API = "https://api.zoom.us/v2";
const ZOOM_OAUTH = "https://zoom.us/oauth/token";

// Duración fija por ahora — no hay campo de duración en el form del docente.
// Exportada para que el chequeo de superposición de horarios use el mismo
// valor (ver src/lib/session-overlap.ts).
export const DEFAULT_DURATION_MIN = 90;
const ZOOM_TIMEZONE = "America/Argentina/Buenos_Aires";

export function isZoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET &&
      process.env.ZOOM_HOST_EMAIL
  );
}

async function getAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom no está configurado (faltan ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET)");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${ZOOM_OAUTH}?grant_type=account_credentials&account_id=${accountId}`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom rechazó la autenticación (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface ZoomMeeting {
  id: number;
  joinUrl: string;
}

/**
 * Crea la reunión bajo la cuenta única de Zoom (ZOOM_HOST_EMAIL) — hay un
 * solo host para toda la academia, no una cuenta por docente. `join_before_host`
 * queda en true para que los alumnos no se queden esperando a que alguien
 * entre logueado con esa cuenta.
 */
export async function createZoomMeeting(topic: string, startTimeIso: string): Promise<ZoomMeeting> {
  const token = await getAccessToken();
  const hostEmail = process.env.ZOOM_HOST_EMAIL!;

  const res = await fetch(`${ZOOM_API}/users/${encodeURIComponent(hostEmail)}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: startTimeIso,
      duration: DEFAULT_DURATION_MIN,
      timezone: ZOOM_TIMEZONE,
      settings: { join_before_host: true, waiting_room: false },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom rechazó la creación de la reunión (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: number; join_url: string };
  return { id: data.id, joinUrl: data.join_url };
}

export async function updateZoomMeeting(meetingId: number, topic: string, startTimeIso: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(`${ZOOM_API}/meetings/${meetingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic, start_time: startTimeIso, timezone: ZOOM_TIMEZONE }),
  });

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Zoom rechazó la reprogramación (${res.status}): ${body}`);
  }
}

/** Best-effort: si la reunión ya no existe en Zoom (404), no es un error. */
export async function deleteZoomMeeting(meetingId: number): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${ZOOM_API}/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Zoom rechazó la cancelación (${res.status}): ${body}`);
  }
}
