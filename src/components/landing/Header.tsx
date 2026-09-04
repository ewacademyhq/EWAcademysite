import Link from "next/link";
import { btnPrimary, btnSecondary } from "@/components/ui/buttons";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-[70px] flex items-center border-b-2 border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-8">
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
          <a
            href="#catalogo"
            className="text-[13px] uppercase tracking-[.1em] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
          >
            Cursos
          </a>
          <a
            href="#modalidad"
            className="text-[13px] uppercase tracking-[.1em] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
          >
            Cursada
          </a>
          <a
            href="#pago"
            className="text-[13px] uppercase tracking-[.1em] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
          >
            Pagos
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="#" className={btnSecondary}>
            Ingresar
          </a>
          <a href="#catalogo" className={btnPrimary}>
            Ver cursos
          </a>
        </div>
      </div>
    </header>
  );
}
