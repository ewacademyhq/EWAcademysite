"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";

const TABS = [
  { key: "kpi", label: "KPIs", href: "/admin/kpi", title: "Tablero", subtitle: "Agosto 2026 · datos de muestra" },
  { key: "pagos", label: "Pagos y mora", href: "/admin/pagos", title: "Pagos y mora", subtitle: "Cola manual y control de mora" },
  { key: "cursos", label: "Cursos", href: "/admin/cursos", title: "Cursos", subtitle: "Alta, edición y baja de cursos" },
  { key: "matriculas", label: "Matrículas", href: "/admin/matriculas", title: "Matrículas", subtitle: "Estado, cuotas y asignación" },
  { key: "economia", label: "Economía", href: "/admin/economia", title: "Economía", subtitle: "Reparto por curso y neto para la academia" },
] as const;

export function AdminHeader({ onNewCourse }: { onNewCourse: () => void }) {
  const pathname = usePathname();
  const active = TABS.find((t) => t.href === pathname) ?? TABS[0];

  return (
    <div className="border-b-2 border-[var(--line)] px-[34px] py-[26px]">
      <BackLink href="/" />
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="font-bold uppercase text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "56px", lineHeight: 0.84 }}
          >
            {active.title}
          </h1>
          <p className="mt-2 text-[13.5px] text-[var(--dim)]">{active.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex h-11 items-center border border-[var(--line2)] px-5 text-[13px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
            Exportar
          </button>
          <button
            onClick={onNewCourse}
            className="inline-flex h-11 items-center bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
          >
            Nuevo curso
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`border-b-[3px] pb-3 text-[13px] font-medium uppercase tracking-[.04em] transition-colors ${
              t.key === active.key
                ? "border-b-[var(--accent)] text-[var(--text)]"
                : "border-b-transparent text-[var(--faint)] hover:text-[var(--dim)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
