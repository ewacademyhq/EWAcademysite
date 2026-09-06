"use client";

import { useEffect } from "react";
import Link from "next/link";
import { btnPrimary, btnSecondary } from "@/components/ui/buttons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center text-[var(--text)]">
      <div
        className="font-bold uppercase text-[var(--danger)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "64px", lineHeight: 0.8 }}
      >
        Ups
      </div>
      <h1 className="text-[19px] font-medium">Algo falló de nuestro lado</h1>
      <p className="max-w-[46ch] text-[13.5px] leading-[1.6] text-[var(--dim)]">
        No pudimos cargar esta página. Podés reintentar — si el problema
        sigue, avisanos.
      </p>
      <div className="mt-2 flex gap-3">
        <button onClick={() => reset()} className={btnPrimary}>
          Reintentar
        </button>
        <Link href="/" className={btnSecondary}>
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
