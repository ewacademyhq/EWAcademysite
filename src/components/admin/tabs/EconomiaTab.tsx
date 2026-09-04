import type { Course, Enrollment } from "@/lib/types";
import { docentePagoOf } from "@/lib/business";
import { formatARS, formatShort } from "@/lib/format";

export function EconomiaTab({ courses, enroll }: { courses: Course[]; enroll: Enrollment[] }) {
  const rows = courses.map((c) => {
    const pagoDocente = docentePagoOf(c);
    const comision = (c.precio * (c.comision || 0)) / 100;
    const neto = c.precio - pagoDocente - comision;
    const alumnos = enroll.filter((e) => e.code === c.code && e.estado !== "finalizada").length;
    return {
      code: c.code,
      titulo: c.titulo,
      alumnos,
      precio: c.precio,
      pagoDocente,
      docenteRegla: c.pagoTipo === "pct" ? `${c.pagoValor}% del precio` : "fijo por alumno",
      comision,
      neto,
      netoMensual: neto * alumnos,
    };
  });

  const netoTotal = rows.reduce((a, r) => a + r.netoMensual, 0);

  return (
    <div className="px-[34px] py-6">
      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[2fr_.9fr_1fr_.9fr_.9fr_.9fr] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Curso</span>
            <span>Precio</span>
            <span>− Docente</span>
            <span>− Comisión</span>
            <span>Neto / alumno</span>
            <span>Neto mensual</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.code}
              className="grid grid-cols-[2fr_.9fr_1fr_.9fr_.9fr_.9fr] items-center gap-4 border-b border-[var(--line)] px-6 py-3.5 text-[13px]"
            >
              <div>
                <div>{r.titulo}</div>
                <div className="mt-0.5 text-[12px] text-[var(--faint)]">
                  {r.code} · {r.alumnos} {r.alumnos === 1 ? "alumno" : "alumnos"}
                </div>
              </div>
              <span>{formatARS(r.precio)}</span>
              <div>
                <div>{formatARS(r.pagoDocente)}</div>
                <div className="text-[11.5px] text-[var(--faint)]">{r.docenteRegla}</div>
              </div>
              <span>{formatARS(r.comision)}</span>
              <span style={{ color: r.neto / r.precio < 0.4 ? "var(--danger)" : "var(--good)" }}>
                {formatARS(r.neto)}
              </span>
              <span>{formatShort(r.netoMensual)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-[var(--line)] bg-[var(--surface2)] px-6 py-4">
            <span className="text-[13px] font-medium uppercase tracking-[.06em]">
              Neto mensual total
            </span>
            <span
              className="font-bold text-[var(--accent)]"
              style={{ fontFamily: "var(--font-humane)", fontSize: "44px", lineHeight: 0.8 }}
            >
              {formatShort(netoTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-4 text-[13.5px] leading-[1.5] text-[var(--dim)]">
        La regla de pago al docente se configura por curso en el editor:
        monto fijo por alumno o porcentaje del precio. La comisión de
        pasarela usa 6,2% por defecto para Mercado Pago y se puede
        sobrescribir por curso.
      </div>
    </div>
  );
}
