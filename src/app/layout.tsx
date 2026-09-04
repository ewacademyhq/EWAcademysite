import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EW Academy",
  description:
    "EW Academy — cursos online y en vivo de Ciberseguridad, QA, Inteligencia Artificial y Desarrollo de Videojuegos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=nippo@400,500,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
