import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EW Academy",
    short_name: "EW Academy",
    description: "Cursos online de Ciberseguridad, QA, IA y Desarrollo de Videojuegos.",
    start_url: "/",
    display: "standalone",
    background_color: "#131313",
    theme_color: "#ef7828",
    icons: [
      { src: "/icon/small", sizes: "32x32", type: "image/png" },
      { src: "/icon/large", sizes: "192x192", type: "image/png", purpose: "any" },
    ],
  };
}
