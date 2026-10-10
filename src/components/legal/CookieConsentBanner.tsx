"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { btnPrimary } from "@/components/ui/buttons";

const STORAGE_KEY = "ew-cookie-consent";
// Única categoría hoy: cookie esencial de sesión (Supabase `sb-*`). Si en el
// futuro se suma analítica, extender a un objeto de categorías reales
// (ej. { essential: true, analytics: false }) y cambiar el botón único por
// Aceptar/Rechazar, en vez de reescribir este componente.
const CURRENT_VERSION = "1";

export function CookieConsentBanner() {
  // Arranca sin render (null) en server y en client para no desincronizar la
  // hidratación — recién después de montado chequeamos localStorage y, si
  // hace falta, mostramos el banner.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== CURRENT_VERSION) setVisible(true);
    } catch {
      // localStorage no disponible — no mostramos el banner.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      // localStorage no disponible — no persiste, pero no rompe nada.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-3 border-t-2 border-[var(--line)] bg-[var(--surface)] px-6 py-4 text-[13px] text-[var(--dim)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="max-w-[60ch]">
        Usamos cookies esenciales para mantener tu sesión iniciada. Sin cookies de seguimiento ni de
        terceros.{" "}
        <Link href="/privacidad" className="underline hover:text-[var(--text)]">
          Más información
        </Link>
        .
      </p>
      <button onClick={dismiss} className={btnPrimary}>
        Entendido
      </button>
    </div>
  );
}
