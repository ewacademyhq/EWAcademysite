import { Reveal } from "@/components/ui/Reveal";

export function ClosingPoster() {
  return (
    <section className="bg-[var(--accent)] px-8 py-[76px] text-center">
      <Reveal as="div" className="mx-auto max-w-[1280px]">
        <h2
          className="font-bold uppercase text-[var(--accent-ink)]"
          style={{
            fontFamily: "var(--font-humane)",
            fontSize: "clamp(60px, 8vw, 120px)",
            lineHeight: 0.84,
          }}
        >
          Empezá este mes
        </h2>
        <a
          href="#catalogo"
          className="mt-8 inline-flex h-11 items-center justify-center bg-[var(--accent-ink)] px-6 text-[13px] font-medium uppercase tracking-[.07em] text-[var(--accent)] transition-opacity hover:opacity-85"
        >
          Elegir un curso
        </a>
      </Reveal>
    </section>
  );
}
