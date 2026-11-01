import "server-only";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const GOOGLE_OAUTH = "https://oauth2.googleapis.com/token";

export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  );
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Drive no está configurado (faltan GOOGLE_DRIVE_CLIENT_ID/SECRET/REFRESH_TOKEN)");
  }

  const res = await fetch(GOOGLE_OAUTH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google rechazó la autenticación (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface DriveFolder {
  id: string;
  webViewLink: string;
}

/** Crea la carpeta suelta en el Drive de la cuenta única (GOOGLE_DRIVE_REFRESH_TOKEN). */
export async function createDriveFolder(name: string): Promise<DriveFolder> {
  const token = await getAccessToken();
  const res = await fetch(`${DRIVE_API}/files?fields=id,webViewLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive rechazó la creación de la carpeta (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id: string; webViewLink: string };
  return { id: data.id, webViewLink: data.webViewLink };
}

type SharePermission =
  | { type: "anyone"; role: "reader" | "writer" }
  | { type: "user"; role: "reader" | "writer"; email: string };

export async function shareFolder(folderId: string, permission: SharePermission): Promise<void> {
  const token = await getAccessToken();
  const body =
    permission.type === "anyone"
      ? { type: "anyone", role: permission.role }
      : { type: "user", role: permission.role, emailAddress: permission.email };

  const res = await fetch(`${DRIVE_API}/files/${folderId}/permissions?sendNotificationEmail=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive rechazó compartir la carpeta (${res.status}): ${errBody}`);
  }
}
