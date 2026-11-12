import type { Metadata } from "next";
import Link from "next/link";
import { ActivarCuentaForm } from "@/components/auth/ActivarCuentaForm";

export const metadata: Metadata = { title: "Activar cuenta", robots: { index: false, follow: false } };

export default function ActivarCuentaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8 py-16">
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <span
          className="flex h-[34px] w-[34px] items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-ink)]"
          style={{ clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)" }}
        >
          EW
        </span>
        <span className="text-[15px] font-medium uppercase tracking-[.14em]">Academy</span>
      </Link>

      <h1
        className="mb-3 font-bold uppercase text-[var(--text)]"
        style={{ fontFamily: "var(--font-humane)", fontSize: "48px", lineHeight: 0.84 }}
      >
        Creá tu contraseña
      </h1>
      <p className="mb-8 max-w-[360px] text-center text-[13.5px] text-[var(--dim)]">
        Es el último paso para activar tu cuenta.
      </p>

      <ActivarCuentaForm />
    </main>
  );
}
