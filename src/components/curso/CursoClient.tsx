"use client";

import { useState } from "react";
import type { Course, Enrollment } from "@/lib/types";
import { BackLink } from "@/components/ui/BackLink";
import { Toast } from "@/components/ui/Toast";

const DOCENTE_BIO: Record<string, string> = {
  "Nicolás Rivas": "Red Team @ fintech",
  "Micaela Duarte": "QA Lead @ scale-up de logística",
  "Federico Ojeda": "ML Engineer @ startup de IA",
  "Bruno Salgado": "Game Developer independiente",
};

const BASE_MODULES = [
  { n: "1", titulo: "Módulo 1 · fundamentos", estado: "Completo" as const, clases: "4 clases grabadas", material: "12 archivos", btn: "Repasar" },
  { n: "2", titulo: "Módulo 2 · desarrollo", estado: "Completo" as const, clases: "5 clases grabadas", material: "9 archivos", btn: "Repasar" },
  { n: "3", titulo: "Módulo 3 · práctica avanzada", estado: "En curso" as const, clases: "3 de 5 clases", material: "7 archivos", btn: "Continuar" },
  { n: "4", titulo: "Módulo 4 · integración", estado: "Bloqueado" as const, clases: "Abre el 12/09", material: "—", btn: "Bloqueado" },
];

const RECORDINGS = [
  { titulo: "Clase 3: práctica guiada", meta: "22/08 · 1h 52m" },
  { titulo: "Laboratorio del módulo 2", meta: "19/08 · 2h 04m" },
  { titulo: "Repaso de fundamentos", meta: "15/08 · 1h 41m" },
];

export function CursoClient({
  course,
  enrollment,
}: {
  course: Course;
  enrollment: Enrollment;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const mora = enrollment.estado === "mora";

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }

  const modules = BASE_MODULES.map((m) => {
    const done = m.estado === "Completo";
    const locked = m.estado === "Bloqueado" || (mora && !done);
    const estado = mora && !done ? "Sin acceso" : m.estado;
    const btn = mora && !done ? "Sin acceso" : m.btn;
    return { ...m, estado, btn, locked, done, current: m.estado === "En curso" };
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[var(--line)] px-[34px] py-[26px]">
        <div>
          <BackLink href="/panel" />
          <div className="mt-4 text-[12px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
            {course.vertical} · {course.modalidad === "cohorte" ? "Cohorte 2026-B" : "Autogestionado"}
          </div>
          <h1
            className="mt-2 font-bold uppercase text-[var(--text)]"
            style={{ fontFamily: "var(--font-humane)", fontSize: "60px", lineHeight: 0.84 }}
          >
            {course.titulo.split(/\s*[—:]\s*/).pop()}
          </h1>
        </div>
        <a
          href="#"
          className="mt-2 text-[13px] font-medium tracking-[.06em] text-[var(--text)] hover:text-[var(--accent)]"
        >
          Carpeta de Drive del curso ↗
        </a>
      </div>

      <div className="grid grid-cols-1 gap-5 px-[34px] py-6 lg:grid-cols-[1.6fr_.85fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <div className="bg-[var(--accent)] p-6 text-[var(--accent-ink)]">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] opacity-80">
              En vivo · Próxima
            </div>
            <h2 className="mt-2 text-[19px] font-medium">
              Clase en vivo — {course.titulo.split(/\s*[—:]\s*/)[0]}
            </h2>
            <p className="mt-1 text-[13.5px] opacity-90">
              Jue 04/09 · 19:00 ART · Google Meet
            </p>
            <button
              onClick={() => flash("Abriendo Google Meet…")}
              className="mt-5 inline-flex h-11 items-center bg-[var(--accent-ink)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent)] transition-opacity hover:opacity-85"
            >
              Entrar a la clase
            </button>
          </div>

          <div className="border border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
                Módulos
              </div>
              <span className="text-[13px] text-[var(--faint)]">3 de 6 completados</span>
            </div>

            {modules.map((m, i) => (
              <div
                key={m.n}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i !== modules.length - 1 ? "border-b border-[var(--line)]" : ""
                }`}
              >
                <span
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center text-[12.5px] font-medium"
                  style={{
                    background: m.current && !mora ? "var(--accent)" : "var(--surface2)",
                    color: m.current && !mora ? "var(--accent-ink)" : "var(--dim)",
                  }}
                >
                  {m.n}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15.5px]">{m.titulo}</span>
                    <span
                      className="border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[.08em]"
                      style={{
                        borderColor: "var(--line2)",
                        color: m.locked ? "var(--faint)" : m.current ? "var(--accent)" : "var(--dim)",
                      }}
                    >
                      {m.estado}
                    </span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-[var(--faint)]">
                    {m.clases} · {m.material}
                  </div>
                </div>
                <button
                  onClick={() => (m.locked ? flash("Módulo sin acceso") : flash(`Abriendo módulo ${m.n}`))}
                  className={`h-9 shrink-0 px-4 text-[12px] font-medium uppercase tracking-[.06em] ${
                    m.locked
                      ? "cursor-not-allowed text-[var(--faint)]"
                      : "border border-[var(--line2)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {m.btn}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-6">
          <div className="border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Grabaciones recientes
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {RECORDINGS.map((r) => (
                <div key={r.titulo} className="flex items-center gap-3">
                  <span className="flex h-9 w-[54px] shrink-0 items-center justify-center bg-[var(--surface2)] text-[var(--faint)]">
                    ▶
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px]">{r.titulo}</div>
                    <div className="text-[12px] text-[var(--faint)]">{r.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Docente
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--line2)] text-[13px] font-medium">
                {course.docente
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <div className="text-[14px] font-medium">{course.docente}</div>
                <div className="text-[12.5px] text-[var(--faint)]">
                  {DOCENTE_BIO[course.docente] ?? "Docente del curso"}
                </div>
              </div>
            </div>
            <button
              onClick={() => flash("Mensaje enviado al docente")}
              className="mt-5 inline-flex h-10 w-full items-center justify-center border border-[var(--line2)] text-[12px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Consultar por mensaje
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
