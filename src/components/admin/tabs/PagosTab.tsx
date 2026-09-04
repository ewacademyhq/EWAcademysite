import type { Enrollment, Receipt } from "@/lib/types";
import { formatARS } from "@/lib/format";

export function PagosTab({
  queue,
  enroll,
  onView,
  onApprove,
  onReject,
  onApproveAll,
  onOpenFicha,
}: {
  queue: Receipt[];
  enroll: Enrollment[];
  onView: (r: Receipt) => void;
  onApprove: (r: Receipt) => void;
  onReject: (r: Receipt) => void;
  onApproveAll: () => void;
  onOpenFicha: (id: number) => void;
}) {
  const enMora = enroll.filter((e) => e.estado === "mora");

  return (
    <div className="grid grid-cols-12 gap-4 px-[34px] py-6">
      <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] lg:col-span-7">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <div className="text-[13px]">
            {queue.length ? (
              <span>
                <strong className="font-medium text-[var(--accent)]">{queue.length}</strong>{" "}
                comprobantes esperando
              </span>
            ) : (
              <span className="text-[var(--good)]">Todo revisado</span>
            )}
          </div>
          {queue.length > 0 && (
            <button
              onClick={onApproveAll}
              className="h-9 bg-[var(--accent)] px-4 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
            >
              Aprobar todos
            </button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13.5px] text-[var(--good)]">
            Cola vacía / No hay comprobantes esperando revisión.
          </div>
        ) : (
          queue.map((q, i) => (
            <div
              key={q.id}
              className={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 ${
                i !== queue.length - 1 ? "border-b border-[var(--line)]" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-[14px]">
                  <span className="font-medium">{q.alumno}</span>
                  <span className="border border-[var(--line2)] px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[.08em] text-[var(--dim)]">
                    {q.curso}
                  </span>
                </div>
                <div className="mt-1 text-[12.5px] text-[var(--faint)]">
                  {q.monto} · {q.fecha} · {q.archivo}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onView(q)}
                  className="h-9 border border-[var(--line2)] px-3.5 text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--text)]"
                >
                  Ver
                </button>
                <button
                  onClick={() => onReject(q)}
                  className="h-9 border border-[var(--line2)] px-3.5 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => onApprove(q)}
                  className="h-9 bg-[var(--accent)] px-3.5 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-600)]"
                >
                  Aprobar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] lg:col-span-5">
        <div className="border-b border-[var(--line)] bg-[var(--danger-soft)] px-6 py-4">
          <div
            className="font-bold text-[var(--danger)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "56px", lineHeight: 0.8 }}
          >
            {enMora.length}
          </div>
          <div className="mt-1 text-[13px] text-[var(--dim)]">
            de {enroll.length} · {Math.round((enMora.length / enroll.length) * 1000) / 10}%
          </div>
        </div>
        {enMora.map((e, i) => (
          <div
            key={e.id}
            className={`flex items-center justify-between gap-4 px-6 py-4 ${
              i !== enMora.length - 1 ? "border-b border-[var(--line)]" : ""
            }`}
          >
            <div>
              <div className="text-[14px]">{e.nombre}</div>
              <div className="mt-1 text-[12.5px] text-[var(--danger)]">
                vencida desde {e.pago} · {formatARS(e.cuota)}
              </div>
            </div>
            <button
              onClick={() => onOpenFicha(e.id)}
              className="h-9 shrink-0 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Ficha
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
