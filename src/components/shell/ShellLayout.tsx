"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import type { Role } from "@/lib/nav";

/**
 * Fase 8 — el sidebar fijo de 240px no tenía ningún comportamiento definido
 * en mobile (se comía casi toda la pantalla en un viewport de 375px). Este
 * wrapper le agrega una topbar + drawer: en `md:` para arriba se comporta
 * exactamente igual que antes (sidebar fijo a la izquierda).
 */
export function ShellLayout({
  role,
  defaultCourseCode,
  nombre,
  children,
}: {
  role: Role;
  defaultCourseCode: string;
  nombre: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Bloquear el scroll del body detrás del drawer mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen">
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b-2 border-[var(--line)] bg-[var(--bg2)] px-4 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center text-[var(--text)]"
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
        <span className="text-[13px] font-medium uppercase tracking-[.14em]">EW Academy</span>
        <span className="w-9" aria-hidden="true" />
      </div>

      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[240px] shrink-0 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          role={role}
          defaultCourseCode={defaultCourseCode}
          nombre={nombre}
          onNavigate={() => setOpen(false)}
        />
      </div>

      <main className="min-w-0 flex-1 pt-14 pb-[140px] md:pt-0">{children}</main>
    </div>
  );
}
