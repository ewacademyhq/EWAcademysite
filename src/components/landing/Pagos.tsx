import { Reveal } from "@/components/ui/Reveal";

const steps = [
  { kicker: "Paso 01", title: "Elegís medio de pago", body: "Mercado Pago o transferencia con comprobante." },
  { kicker: "Paso 02", title: "Se acredita", body: "Al instante con Mercado Pago, o en hasta 24 h hábiles si mandás comprobante." },
  { kicker: "Paso 03", title: "Accedés al toque", body: "Un solo pago por el precio total del curso — sin cuotas ni vencimientos." },
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
            Pago único
          </h2>
          <p className="mt-6 max-w-[70ch] text-[16px] leading-[1.6] text-[var(--dim)]">
            Cada curso tiene un precio total único, informado antes de pagar.
            Un solo pago y listo — sin mensualidades, sin vencimientos, sin
            letra chica.
          </p>
        </Reveal>

        <Reveal
          as="div"
          className="mt-10 grid grid-cols-1 gap-px bg-[var(--line)] sm:grid-cols-3"
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
        </Reveal>
      </div>
    </section>
  );
}
