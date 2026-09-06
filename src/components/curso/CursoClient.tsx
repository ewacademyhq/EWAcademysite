"use client";

import { useState } from "react";
import type { Course, Enrollment } from "@/lib/types";
import type { ModuleRow } from "@/lib/data/mycourse";
import { createClient } from "@/lib/supabase/client";
import { BackLink } from "@/components/ui/BackLink";
import { Toast } from "@/components/ui/Toast";

const DOCENTE_BIO: Record<string, string> = {
  "Nicolás Rivas": "Red Team @ fintech",
  "Micaela Duarte": "QA Lead @ scale-up de logística",
  "Federico Ojeda": "ML Engineer @ startup de IA",
  "Bruno Salgado": "Game Developer independiente",
};

// Sin un sistema de clases grabadas todavía (Fase 7), esta lista queda de
// muestra — no viene de ninguna tabla real.
const RECORDINGS = [
  { titulo: "Clase 3: práctica guiada", meta: "22/08 · 1h 52m" },
  { titulo: "Laboratorio del módulo 2", meta: "19/08 · 2h 04m" },
  { titulo: "Repaso de fundamentos", meta: "15/08 · 1h 41m" },
];

export function CursoClient({
  course,
  enrollment,
  modules,
  progress,
}: {
  course: Course;
  enrollment: Enrollment;
  modules: ModuleRow[];
  progress: Record<number, string>;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [progressState, setProgressState] = useState(progress);
  const mora = enrollment.estado === "mora";

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function completeModule(moduleId: number) {
    const supabase = createClient();
    // complete_my_module hace el upsert de module_progress y recalcula
    // enrollments.progreso en una sola transacción (con permiso elevado
    // propio, verificando que la matrícula sea del usuario autenticado) —
    // ver docs/SPEC.md, un alumno no puede actualizar su propia matrícula
    // directamente por RLS.
    const { data: pct, error } = await supabase.rpc("complete_my_module", {
      p_enrollment_id: enrollment.id,
      p_module_id: moduleId,
    });

    if (error) {
      flash(`No se pudo guardar tu progreso: ${error.message}`);
      return;
    }

    setProgressState((prev) => ({ ...prev, [moduleId]: "completo" }));
    flash(`Módulo marcado como completo — ${pct}% del curso`);
  }

  const doneFlags = modules.map((m) => progressState[m.id] === "completo");
  const rows = modules.map((m, i) => {
    const done = doneFlags[i];
    const unlockedBySequence = i === 0 || doneFlags[i - 1];
    const locked = mora ? !done : !unlockedBySequence;

    const estadoLabel = done
      ? "Completo"
      : mora
        ? "Sin acceso"
        : unlockedBySequence
          ? "Disponible"
          : "Bloqueado";

    const btnLabel = done ? "Repasar" : mora ? "Sin acceso" : locked ? "Bloqueado" : "Marcar como completo";

    return { ...m, done, locked, estadoLabel, btnLabel, current: !done && !locked };
  });

  const doneTotal = rows.filter((r) => r.done).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[var(--line)] px-[34px] py-[26px]">
        <div>
          <BackLink href="/panel" />
          <div className="mt-4 text-[12px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
            {course.vertical} · {course.modalidad === "cohorte" ? "Cohorte" : "Autogestionado"}
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
            <p className="mt-1 text-[13.5px] opacity-90">A confirmar · Google Meet</p>
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
              <span className="text-[13px] text-[var(--faint)]">
                {doneTotal} de {modules.length} completados
              </span>
            </div>

            {rows.length === 0 && (
              <div className="px-6 py-6 text-[13px] text-[var(--faint)]">
                Este curso todavía no tiene módulos cargados.
              </div>
            )}

            {rows.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i !== rows.length - 1 ? "border-b border-[var(--line)]" : ""
                }`}
              >
                <span
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center text-[12.5px] font-medium"
                  style={{
                    background: m.current ? "var(--accent)" : "var(--surface2)",
                    color: m.current ? "var(--accent-ink)" : "var(--dim)",
                  }}
                >
                  {m.numero}
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
                      {m.estadoLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    m.locked
                      ? flash(mora ? "Módulo sin acceso" : "Completá el módulo anterior primero")
                      : m.done
                        ? flash(`Repasando ${m.titulo}`)
                        : completeModule(m.id)
                  }
                  disabled={m.locked}
                  className={`h-9 shrink-0 px-4 text-[12px] font-medium uppercase tracking-[.06em] ${
                    m.locked
                      ? "cursor-not-allowed text-[var(--faint)]"
                      : "border border-[var(--line2)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {m.btnLabel}
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
