import { Reveal } from "@/components/ui/Reveal";
import { btnPrimary, btnSecondary } from "@/components/ui/buttons";

function joinConY(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export function Hero({
  verticales,
  proximoInicioLabel,
}: {
  verticales: string[];
  proximoInicioLabel: string | null;
}) {
  const stats = [
    { value: String(verticales.length), label: "verticales" },
    { value: "48h", label: "en vivo por cohorte" },
    { value: "1:12", label: "docente-alumnos" },
  ];
  const badge = proximoInicioLabel
    ? `Cohortes abiertas · ${proximoInicioLabel}`
    : "Elegí la fecha que te quede mejor";

  return (
    <section className="relative overflow-hidden border-b-2 border-[var(--line)] px-8 pt-[76px] pb-[72px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "106px 100%",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[var(--accent-soft)]"
        style={{ clipPath: "polygon(26% 0, 100% 0, 100% 100%, 0 100%)" }}
      />

      <div className="relative mx-auto max-w-[1280px]">
        <Reveal>
          <div className="mb-6 flex items-center gap-2.5">
            <span
              className="h-[3px] w-[34px] bg-[var(--accent)]"
              style={{ transform: "skewX(-24deg)" }}
            />
            <span className="text-[12px] font-medium uppercase tracking-[.2em] text-[var(--accent)]">
              {badge}
            </span>
          </div>

          <h1
            className="max-w-[19ch] font-bold uppercase text-[var(--text)]"
            style={{
              fontFamily: "var(--font-humane)",
              fontSize: "clamp(70px, 10vw, 164px)",
              lineHeight: 0.84,
              letterSpacing: ".005em",
            }}
          >
            Despierta tu curiosidad, transforma tu futuro.
          </h1>

          <p className="mt-8 max-w-[56ch] text-[18px] leading-[1.62] text-[var(--dim)]">
            Cursos online y en vivo de {joinConY(verticales)}, dictados por
            profesionales en actividad.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href="#catalogo" className={btnPrimary}>
              Reservar mi lugar
            </a>
            <a href="#modalidad" className={btnSecondary}>
              Cómo es la cursada
            </a>
          </div>
        </Reveal>

        <Reveal className="mt-16 grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[var(--bg)] px-6 py-6">
              <div
                className="font-bold text-[var(--accent)]"
                style={{ fontFamily: "var(--font-humane)", fontSize: "46px", lineHeight: 0.8 }}
              >
                {stat.value}
              </div>
              <div className="mt-2 text-[13px] uppercase tracking-[.1em] text-[var(--dim)]">
                {stat.label}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
