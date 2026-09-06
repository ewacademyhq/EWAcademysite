"use client";

import type { Course, Enrollment } from "@/lib/types";
import { deudaTotal, moraRecargo } from "@/lib/business";
import { formatARS } from "@/lib/format";
import { StatusChip } from "@/components/ui/StatusChip";

export function FichaDrawer({
  enrollment,
  course,
  historial,
  onClose,
  onUpdatePrice,
  onToggleMora,
}: {
  enrollment: Enrollment | null;
  course: Course | null;
  historial: string[];
  onClose: () => void;
  onUpdatePrice: (id: number) => void;
  onToggleMora: (id: number) => void;
}) {
  if (!enrollment || !course) return null;

  const mora = enrollment.estado === "mora";
  const recargo = mora ? moraRecargo(course, enrollment.cuota) : 0;
  const diff = course.precio - enrollment.cuota;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" style={{ background: "rgba(14,14,14,.72)" }}>
      <div
        className="flex h-full w-full max-w-[560px] flex-col overflow-y-auto border-l-2 border-[var(--accent)] bg-[var(--bg)]"
        style={{ boxShadow: "var(--shadow)", animation: "slideUp .18s ease" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
            Ficha de alumno
          </div>
          <button
            onClick={onClose}
            className="h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--text)]"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-medium">{enrollment.nombre}</h2>
            <StatusChip estado={enrollment.estado} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <div className="text-[11px] uppercase tracking-[.08em] text-[var(--faint)]">
                Curso
              </div>
              <div className="mt-1">{course.code} · {course.titulo}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[.08em] text-[var(--faint)]">
                Cuota congelada
              </div>
              <div className="mt-1">
                {formatARS(enrollment.cuota)} · desde {enrollment.desde}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[.08em] text-[var(--faint)]">
                Precio vigente del curso
              </div>
              <div className="mt-1" style={{ color: diff > 0 ? "var(--accent)" : "var(--faint)" }}>
                {formatARS(course.precio)} ·{" "}
                {diff > 0 ? `+${formatARS(diff)} sobre su cuota` : "sin diferencia"}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[.08em] text-[var(--faint)]">
                Último pago
              </div>
              <div className="mt-1">{enrollment.pago} · {enrollment.medio}</div>
            </div>
          </div>

          {mora && (
            <div className="mt-5 border-l-[3px] border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3.5 text-[13px] leading-[1.6]">
              Debe {formatARS(deudaTotal(enrollment))}: la cuota a su valor
              congelado {formatARS(enrollment.cuota)}
              {recargo ? ` más ${formatARS(recargo)} de recargo` : ", sin recargo"}.
              Pasado el período de gracia, sus próximas cuotas toman el
              precio de lista vigente ({formatARS(course.precio)}).
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => onUpdatePrice(enrollment.id)}
              className="inline-flex h-11 items-center justify-center border border-[var(--line2)] text-[13px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Actualizar cuota al precio vigente
            </button>
            <button
              onClick={() => onToggleMora(enrollment.id)}
              className="inline-flex h-11 items-center justify-center border text-[13px] font-medium uppercase tracking-[.06em]"
              style={{
                borderColor: "var(--danger)",
                background: mora ? "var(--danger-soft)" : "transparent",
                color: "var(--danger)",
              }}
            >
              {mora ? "Levantar la mora y reactivar acceso" : "Poner en mora (pausa el acceso)"}
            </button>
          </div>

          <div className="mt-8">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Historial de auditoría
            </div>
            {historial.length === 0 ? (
              <p className="mt-3 text-[13px] text-[var(--faint)]">
                Sin cambios registrados.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {historial.map((txt, i) => (
                  <li key={i} className="text-[12.5px] text-[var(--dim)]">
                    {txt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
