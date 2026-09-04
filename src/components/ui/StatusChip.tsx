import { ESTADOS } from "@/lib/business";
import type { EstadoMatricula } from "@/lib/types";

export function StatusChip({ estado }: { estado: EstadoMatricula }) {
  const info = ESTADOS[estado];
  return (
    <span
      className="inline-flex items-center gap-2 border border-[var(--line2)] px-3 py-1.5 text-[12px] font-medium uppercase tracking-[.06em]"
      style={{ color: info.color }}
    >
      <span className="h-[7px] w-[7px]" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}
