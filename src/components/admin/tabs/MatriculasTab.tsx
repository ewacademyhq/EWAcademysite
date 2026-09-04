import type { Enrollment, EstadoMatricula } from "@/lib/types";
import { courseByCode, ESTADOS } from "@/lib/business";
import { formatARS } from "@/lib/format";

const ESTADO_KEYS = Object.keys(ESTADOS) as EstadoMatricula[];

export function MatriculasTab({
  enroll,
  onChangeEstado,
  onToggleMora,
  onOpenFicha,
}: {
  enroll: Enrollment[];
  onChangeEstado: (id: number, estado: EstadoMatricula) => void;
  onToggleMora: (id: number) => void;
  onOpenFicha: (id: number) => void;
}) {
  return (
    <div className="px-[34px] py-6">
      <div className="mb-4 flex flex-col gap-1 text-[12.5px] text-[var(--faint)]">
        <p>Poner en mora es exclusivo de este panel.</p>
        <p>
          Una matrícula pasa a <strong className="font-medium text-[var(--text)]">Finalizada</strong>{" "}
          en la fecha de fin del cohorte si las cuotas están al día; si quedó
          debiendo va a <strong className="font-medium text-[var(--text)]">Finalizada con deuda</strong>.
          Ningún cambio de estado está bloqueado, pero queda registrado quién
          lo hizo y cuándo.
        </p>
      </div>

      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[1.4fr_.7fr_1.2fr_.85fr_.85fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Alumno</span>
            <span>Curso</span>
            <span>Estado</span>
            <span>Cuota congelada</span>
            <span>Precio de hoy</span>
            <span className="justify-self-end">Acciones</span>
          </div>
          {enroll.map((e, i) => {
            const course = courseByCode(e.code);
            const vigente = course?.precio ?? e.cuota;
            const diff = vigente - e.cuota;
            const info = ESTADOS[e.estado];
            return (
              <div
                key={e.id}
                className={`grid grid-cols-[1.4fr_.7fr_1.2fr_.85fr_.85fr_auto] items-center gap-4 px-6 py-3.5 text-[13px] ${
                  i !== enroll.length - 1 ? "border-b border-[var(--line)]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--line2)] text-[11px] font-medium">
                    {e.ini}
                  </span>
                  {e.nombre}
                </span>
                <span className="text-[var(--dim)]">{e.code}</span>
                <select
                  value={e.estado}
                  onChange={(ev) => onChangeEstado(e.id, ev.target.value as EstadoMatricula)}
                  className="h-9 border px-2 text-[12.5px] font-medium"
                  style={{ borderColor: "var(--line2)", color: info.color, background: info.soft }}
                >
                  {ESTADO_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {ESTADOS[k].label}
                    </option>
                  ))}
                </select>
                <span>{formatARS(e.cuota)}</span>
                <span style={{ color: diff > 0 ? "var(--accent)" : "var(--faint)" }}>
                  {diff === 0 ? "igual" : formatARS(vigente)}
                </span>
                <div className="flex justify-self-end gap-2">
                  <button
                    onClick={() => onOpenFicha(e.id)}
                    className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--text)]"
                  >
                    Ficha
                  </button>
                  <button
                    onClick={() => onToggleMora(e.id)}
                    className="h-8 border px-3 text-[11.5px] font-medium uppercase tracking-[.06em]"
                    style={{
                      borderColor: e.estado === "mora" ? "var(--danger)" : "var(--line2)",
                      background: e.estado === "mora" ? "var(--danger-soft)" : "transparent",
                      color: e.estado === "mora" ? "var(--danger)" : "var(--text)",
                    }}
                  >
                    {e.estado === "mora" ? "Levantar mora" : "Poner en mora"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
