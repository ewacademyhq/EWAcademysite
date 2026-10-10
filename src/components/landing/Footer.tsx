import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex flex-col gap-3 px-8 py-8 text-[13px] text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
      <span>EW Academy · EW Gaming Club · Resistencia, Chaco</span>
      <span>Precios en ARS · IVA incluido</span>
      <nav className="flex gap-4">
        <Link href="/privacidad" className="hover:text-[var(--text)]">
          Privacidad
        </Link>
        <Link href="/terminos" className="hover:text-[var(--text)]">
          Términos
        </Link>
      </nav>
    </footer>
  );
}
