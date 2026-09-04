import { Reveal } from "@/components/ui/Reveal";

const steps = [
  { kicker: "Paso 01", title: "Elegís medio de pago", body: "Mercado Pago con débito automático, o transferencia con comprobante." },
  { kicker: "Paso 02", title: "Se acredita", body: "Al instante con Mercado Pago, o en hasta 24 h hábiles si mandás comprobante." },
  { kicker: "Paso 03", title: "Precio congelado", body: "Tu cuota queda fija al valor del día que te matriculaste, aunque el curso suba." },
];

export function Pagos() {
  return (
    <section
      id="pago"
      className="border-y-2 border-[var(--line)] bg-[var(--bg2)] px-8 py-[76px]"
    >
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <div className="text-[11.5px] font-medium uppercase tracking-[.2em] text-[var(--accent)]">
            03 — Pagos
          </div>
          <h2
            className="mt-3 font-bold uppercase text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "76px", lineHeight: 0.85 }}
          >
            Sin sorpresas
          </h2>
          <p className="mt-6 max-w-[70ch] text-[16px] leading-[1.6] text-[var(--dim)]">
            Tu cuota queda congelada al valor del día que te matriculaste,
            independiente de si el curso sube de precio después. Tenés 5 días
            de gracia después del vencimiento; pasada la gracia, se suspende
            el acceso a material y clases en vivo hasta que regularices —
            aunque tu progreso y entregas siguen guardados.
          </p>
        </Reveal>

        <Reveal
          as="div"
          className="mt-10 grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step) => (
            <div key={step.kicker} className="bg-[var(--bg2)] p-[24px]">
              <div className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
                {step.kicker}
              </div>
              <h3 className="mt-3 text-[16px] font-medium">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--dim)]">
                {step.body}
              </p>
            </div>
          ))}
          <div className="border-t-[3px] border-[var(--danger)] bg-[var(--bg2)] p-[24px]">
            <div className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--danger)]">
              Si vence
            </div>
            <h3 className="mt-3 text-[16px] font-medium">Pausa por mora</h3>
            <p className="mt-2 text-[14px] leading-[1.5] text-[var(--dim)]">
              Se suspende el acceso a material y clases en vivo hasta
              regularizar la cuota vencida a su valor congelado, más el
              recargo si el curso tiene uno.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
