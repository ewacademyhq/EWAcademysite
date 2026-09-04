import { Reveal } from "@/components/ui/Reveal";

const cells = [
  {
    title: "Cohorte",
    body: "Fecha de inicio y fin fijas, cupo limitado, entregas con fecha. Las grabaciones de cada clase quedan publicadas a las 24 horas.",
  },
  {
    title: "Autogestionado",
    body: "Entrás el día que pagás, sin fecha de corte. Mentoría por consulta y el mismo material que la cohorte.",
  },
  {
    title: "Material",
    body: "Una carpeta por módulo con slides, datasets y labs. El acceso sigue el estado de tu matrícula.",
    path: "/CIBER-101/modulo-03/labs",
  },
];

export function Modalidad() {
  return (
    <section id="modalidad" className="border-t-2 border-[var(--line)] px-8 py-[76px]">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <div className="text-[11.5px] font-medium uppercase tracking-[.2em] text-[var(--accent)]">
            02 — Modalidad
          </div>
          <h2
            className="mt-3 font-bold uppercase text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "76px", lineHeight: 0.85 }}
          >
            Dos formas de cursar
          </h2>
        </Reveal>

        <Reveal
          as="div"
          className="mt-10 grid grid-cols-1 gap-px bg-[var(--line)] md:grid-cols-3"
        >
          {cells.map((cell) => (
            <div key={cell.title} className="bg-[var(--bg)] p-[26px]">
              <h3 className="text-[21px] font-medium tracking-[-.01em]">
                {cell.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-[1.6] text-[var(--dim)]">
                {cell.body}
              </p>
              {cell.path && (
                <div className="mt-4 font-mono text-[13px] tracking-[.04em] text-[var(--faint)]">
                  {cell.path}
                </div>
              )}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
