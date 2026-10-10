import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colores copiados a mano de src/app/globals.css (:root) — satori/ImageResponse
// no puede leer var(--accent), solo valores inline. Mantener en sync si cambia la marca.
const BG = "#131313";
const ACCENT = "#ef7828";
const ACCENT_INK = "#141414";
const TEXT = "#efebe7";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 160,
              background: ACCENT,
              color: ACCENT_INK,
              fontSize: 72,
              fontWeight: 700,
              clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)",
            }}
          >
            EW
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 500,
              color: TEXT,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Academy
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
