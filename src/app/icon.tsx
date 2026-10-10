import { ImageResponse } from "next/og";

const ACCENT = "#ef7828";
const ACCENT_INK = "#141414";

export function generateImageMetadata() {
  return [
    { id: "small", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "large", size: { width: 192, height: 192 }, contentType: "image/png" },
  ];
}

export default function Icon({ id }: { id: string }) {
  const s = id === "large" ? 192 : 32;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ACCENT,
          color: ACCENT_INK,
          fontSize: s * 0.5,
          fontWeight: 700,
        }}
      >
        EW
      </div>
    ),
    { width: s, height: s }
  );
}
