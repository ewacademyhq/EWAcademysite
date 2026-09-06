import type { Course, Enrollment } from "@/lib/types";
import { formatShort } from "@/lib/format";

const REVENUE: [string, number][] = [
  ["Mar", 9.8],
  ["Abr", 11.1],
  ["May", 10.4],
  ["Jun", 13.6],
  ["Jul", 14.2],
  ["Ago", 16.2],
];
const MAX_REVENUE = 16.2;

const FUNNEL: [string, number][] = [
  ["Vistas de ficha de curso", 21150],
  ["Matriculaciones iniciadas", 412],
  ["Pagos acreditados", 91],
  ["Canceladas / abandonadas", 34],
];

export function KpiTab({ courses, enroll }: { courses: Course[]; enroll: Enrollment[] }) {
  const activas = enroll.filter((e) => e.estado === "activa").length;
  const enMora = enroll.filter((e) => e.estado === "mora");
  const ingresoMes = enroll
    .filter((e) => e.estado === "activa" || e.estado === "pendiente")
    .reduce((a, e) => a + e.cuota, 0);
  const maxSold = Math.max(0, ...courses.map((c) => c.vendidos));
  const verticales = new Set(courses.map((c) => c.vertical)).size;

  const tiles = [
    { label: "Facturación del mes", value: formatShort(ingresoMes * 12), delta: "+8,4% vs. julio", color: "var(--good)", mark: "var(--accent)" },
    { label: "Verticales activas", value: String(verticales), delta: `${courses.length} cursos publicados`, color: "var(--dim)", mark: "var(--accent)" },
    { label: "Matrículas activas", value: String(activas), delta: `${enroll.length} matrículas totales`, color: "var(--dim)", mark: "var(--accent)" },
    { label: "Tasa de mora", value: `${enroll.length ? Math.round((enMora.length / enroll.length) * 100) : 0}%`, delta: `${enMora.length} alumnos pausados`, color: "var(--danger)", mark: "var(--danger)" },
    { label: "Conversión visita → pago", value: "0,43%", delta: "91 pagos de 21.150 vistas", color: "var(--dim)", mark: "var(--accent)" },
  ];

  const topSold = [...courses]
    .sort((a, b) => b.vendidos - a.vendidos)
    .map((c) => ({
      titulo: c.titulo,
      n: `${c.vendidos} matrículas`,
      ingreso: formatShort(c.vendidos * c.precio),
      w: maxSold ? Math.round((c.vendidos / maxSold) * 100) : 0,
    }));

  const funnel = FUNNEL.map(([label, n]) => ({
    label,
    n: n.toLocaleString("es-AR"),
    w: Math.max(3, Math.round((n / FUNNEL[0][1]) * 100)),
    pct: ((n / FUNNEL[0][1]) * 100).toFixed(1).replace(".", ",") + "%",
  }));

  const revenue = REVENUE.map(([mes, valor]) => ({
    mes,
    label: `ARS ${String(valor).replace(".", ",")}M`,
    h: Math.round((valor / MAX_REVENUE) * 100),
    active: mes === "Ago",
  }));

  const topViewed = [...courses]
    .sort((a, b) => b.vistas - a.vistas)
    .map((c) => {
      const conv = c.vistas ? (c.vendidos / c.vistas) * 100 : 0;
      return {
        titulo: c.titulo,
        vistas: c.vistas.toLocaleString("es-AR"),
        conv: conv.toFixed(1).replace(".", ",") + "%",
        good: conv >= 0.3,
      };
    });

  return (
    <div className="grid grid-cols-12 gap-4 px-[34px] py-6">
      <div className="col-span-12 grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="border-t-[3px] bg-[var(--surface)] p-5" style={{ borderTopColor: t.mark }}>
            <div className="text-[11px] font-medium uppercase tracking-[.1em] text-[var(--faint)]">
              {t.label}
            </div>
            <div
              className="mt-2 font-bold text-[var(--text)]"
              style={{ fontFamily: "var(--font-humane)", fontSize: "62px", lineHeight: 0.8 }}
            >
              {t.value}
            </div>
            <div className="mt-2 text-[12px]" style={{ color: t.color }}>
              {t.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-7">
        <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Cursos más vendidos
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {topSold.map((c) => (
            <div key={c.titulo}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate">{c.titulo}</span>
                <span className="shrink-0 text-[var(--dim)]">
                  {c.n} · {c.ingreso}
                </span>
              </div>
              <div className="mt-1.5 h-[9px] w-full bg-[var(--surface2)]">
                <div
                  className="h-full bg-[var(--accent)]"
                  style={{ width: `${c.w}%`, animation: "grow .8s cubic-bezier(.2,.7,.2,1)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-5">
        <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Embudo de venta
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {funnel.map((f, i) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="h-[26px] flex-1 bg-[var(--surface2)]">
                <div
                  className="flex h-full items-center px-2 text-[11px] font-medium"
                  style={{
                    width: `${f.w}%`,
                    background: i === 3 ? "var(--danger)" : i === 2 ? "var(--accent)" : i === 1 ? "var(--accent-soft)" : "var(--line2)",
                    color: i === 3 ? "#fff" : i === 2 ? "var(--accent-ink)" : "var(--dim)",
                  }}
                >
                  {f.label}: {f.n}
                </div>
              </div>
              <span className="w-[54px] shrink-0 text-right text-[12.5px] text-[var(--dim)]">
                {f.pct}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] leading-[1.5] text-[var(--faint)]">
          Se cuenta como cancelada la matrícula iniciada que no acreditó pago
          en 7 días, más las bajas voluntarias del mes.
        </p>
      </div>

      <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-7">
        <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Facturación mensual
        </div>
        <div className="mt-6 flex h-[170px] items-end gap-4">
          {revenue.map((r) => (
            <div key={r.mes} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[11.5px] text-[var(--dim)]">{r.label}</span>
              <div
                className="w-full"
                style={{
                  height: `${r.h}%`,
                  background: r.active ? "var(--accent)" : "var(--line2)",
                }}
              />
              <span className="text-[11.5px] uppercase tracking-[.06em] text-[var(--faint)]">
                {r.mes}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-12 border border-[var(--line)] bg-[var(--surface)] p-6 lg:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Cursos más consultados
          </div>
          <span className="border border-[var(--accent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[.08em] text-[var(--accent)]">
            Requiere tracking
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {topViewed.map((c) => (
            <div key={c.titulo} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="truncate">{c.titulo}</span>
              <span className="shrink-0 text-[var(--dim)]">
                {c.vistas} vistas ·{" "}
                <span style={{ color: c.good ? "var(--good)" : "var(--danger)" }}>{c.conv}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] leading-[1.5] text-[var(--faint)]">
          Datos de muestra. En producción salen del evento de vista de ficha
          de curso, atribuido a la matrícula si convierte.
        </p>
      </div>
    </div>
  );
}
