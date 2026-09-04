import { BackLink } from "@/components/ui/BackLink";

export function CheckoutHeader() {
  return (
    <header className="border-b-2 border-[var(--line)] px-8 py-6">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between">
        <div className="flex items-center gap-6">
          <BackLink />
          <h1 className="text-[13px] font-medium uppercase tracking-[.14em]">
            Matriculación
          </h1>
        </div>
        <span className="text-[13px] uppercase tracking-[.08em] text-[var(--faint)]">
          Paso 2 de 3
        </span>
      </div>
    </header>
  );
}
