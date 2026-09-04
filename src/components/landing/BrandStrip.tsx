import { Reveal } from "@/components/ui/Reveal";

export function BrandStrip() {
  return (
    <section className="border-b-2 border-[var(--line)] bg-[var(--bg2)] px-8 py-[34px]">
      <Reveal
        as="div"
        className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 sm:flex-row sm:items-center"
      >
        <div
          className="font-bold text-[var(--accent)]"
          style={{ fontFamily: "var(--font-humane)", fontSize: "82px", lineHeight: 0.8 }}
        >
          EW
        </div>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-[var(--dim)]">
          <span className="text-[var(--text)]">
            &ldquo;EW quiere decir «norte» en qom.&rdquo;
          </span>{" "}
          EW Gaming Club nació en Resistencia, Chaco, y hoy EW Academy se
          cursa online desde cualquier provincia o país hispanohablante.
        </p>
      </Reveal>
    </section>
  );
}
