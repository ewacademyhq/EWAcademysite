"use client";

import { useMemo, useState } from "react";
import { VERTICALS } from "@/lib/fixtures";
import { formatARS } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import type { Course } from "@/lib/types";

const FILTERS = ["Todas", ...VERTICALS] as const;

export function Catalogo({ courses: allCourses }: { courses: Course[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");

  const courses = useMemo(
    () =>
      filter === "Todas"
        ? allCourses
        : allCourses.filter((c) => c.vertical === filter),
    [filter, allCourses]
  );

  return (
    <section id="catalogo" className="px-8 py-[76px]">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <div className="text-[11.5px] font-medium uppercase tracking-[.2em] text-[var(--accent)]">
            01 — Catálogo
          </div>
          <h2
            className="mt-3 font-bold uppercase text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "76px", lineHeight: 0.85 }}
          >
            Cuatro verticales
          </h2>
        </Reveal>

        <Reveal className="mt-8 flex flex-wrap gap-px bg-[var(--line)]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 text-[13px] font-medium uppercase tracking-[.06em] transition-colors ${
                filter === f
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "bg-[var(--bg)] text-[var(--dim)] hover:text-[var(--text)]"
              }`}
            >
              {f}
            </button>
          ))}
        </Reveal>

        <Reveal
          as="div"
          className="mt-px grid gap-px bg-[var(--line)]"
          key={filter}
        >
          {courses.length === 0 ? (
            <div className="bg-[var(--surface)] px-6 py-16 text-center text-[14px] text-[var(--dim)]">
              Todavía no hay cursos cargados en esta vertical.
            </div>
          ) : (
          <div
            className="grid gap-px bg-[var(--line)]"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}
          >
            {courses.map((course) => (
              <article
                key={course.code}
                className="group flex flex-col bg-[var(--surface)] p-[26px] transition-colors hover:bg-[var(--surface2)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[var(--accent)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[.12em] text-[var(--accent-ink)]">
                    {course.vertical}
                  </span>
                  <span className="border border-[var(--line2)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[.12em] text-[var(--dim)]">
                    {course.modalidad === "cohorte" ? "Cohorte" : "Autogestionado"}
                  </span>
                </div>

                <h3 className="mt-4 text-[21px] leading-[1.24] font-medium tracking-[-.01em]">
                  {course.titulo}
                </h3>
                <p className="mt-2.5 flex-1 text-[14.5px] leading-[1.6] text-[var(--dim)]">
                  {course.desc}
                </p>

                <div className="mt-6 border-t border-[var(--line)] pt-5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-bold text-[var(--text)]"
                      style={{ fontFamily: "var(--font-humane)", fontSize: "40px", lineHeight: 0.8 }}
                    >
                      {formatARS(course.precio)}
                    </span>
                    <span className="text-[11px] uppercase tracking-[.1em] text-[var(--faint)]">
                      por mes
                    </span>
                  </div>
                  <div className="mt-2 text-[13px] text-[var(--dim)]">
                    <span className="text-[var(--accent)]">→</span>{" "}
                    {course.fecha === "Inmediato"
                      ? "Ingreso inmediato"
                      : `Inicio ${course.fecha}`}
                  </div>

                  <a
                    href={`/checkout/${course.code}`}
                    className="mt-5 flex h-11 items-center justify-between border border-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                  >
                    Matricularme <span>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
