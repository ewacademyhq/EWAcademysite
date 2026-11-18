"use client";

import { useState } from "react";

/** Aviso de modo pre-lanzamiento (EWA-061) — se muestra en cada carga, sin recordar que ya se vio. */
export function EnDesarrolloPopup({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-6"
      style={{ background: "rgba(14,14,14,.72)" }}
    >
      <div
        className="w-full max-w-[480px] border border-[var(--line)] bg-[var(--surface)] p-7"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 className="text-[20px] font-medium text-[var(--text)]">
          Estamos preparando todo para vos
        </h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">
          EW Academy está terminando los últimos detalles antes de abrir las
          puertas. A partir del{" "}
          <strong className="font-medium text-[var(--text)]">
            1° de diciembre de 2026
          </strong>{" "}
          vas a poder inscribirte a nuestros cursos y, cuando corresponda,
          realizar las nivelaciones previas.
        </p>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">
          Mientras tanto, podés recorrer el sitio y conocer la propuesta
          académica.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="h-11 bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
