"use client";

import { useState } from "react";
import Link from "next/link";
import { btnPrimary, btnSecondary } from "@/components/ui/buttons";

const LINKS = [
  { href: "#catalogo", label: "Cursos" },
  { href: "#modalidad", label: "Cursada" },
  { href: "#pago", label: "Pagos" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-[70px] items-center border-b-2 border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-[34px] w-[34px] items-center justify-center bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-ink)]"
            style={{ clipPath: "polygon(14% 0, 100% 0, 86% 100%, 0 100%)" }}
          >
            EW
          </span>
          <span className="text-[15px] font-medium uppercase tracking-[.14em]">
            Academy
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] uppercase tracking-[.1em] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={btnSecondary}>
            Ingresar
          </Link>
          <a href="#catalogo" className={btnPrimary}>
            Ver cursos
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center text-[var(--text)] md:hidden"
        >
          {open ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          ) : (
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-b-2 border-[var(--line)] bg-[var(--bg)] px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[14px] uppercase tracking-[.1em] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex items-center gap-3">
            <Link href="/login" className={btnSecondary} onClick={() => setOpen(false)}>
              Ingresar
            </Link>
            <a href="#catalogo" className={btnPrimary} onClick={() => setOpen(false)}>
              Ver cursos
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
