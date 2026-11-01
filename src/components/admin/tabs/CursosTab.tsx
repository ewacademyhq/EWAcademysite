"use client";

import { useState } from "react";
import type { Course, Enrollment } from "@/lib/types";
import { formatARS } from "@/lib/format";
import { dmyToISO } from "@/lib/date";

const DIAS_AVISO_MINIMO = 14;

/** Días calendario hasta `course.fecha` (ya viene en DMY) — null si no hay fecha cargada. */
function diasHastaInicio(course: Course): number | null {
  const iso = dmyToISO(course.fecha);
  if (!iso) return null;
  const inicio = new Date(iso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  return Math.round((inicio.getTime() - hoy.getTime()) / 86_400_000);
}

export function CursosTab({
  courses,
  enroll,
  onEdit,
  onDelete,
  onUnificar,
}: {
  courses: Course[];
  enroll: Enrollment[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onUnificar: (origenCode: string, destinoCode: string) => Promise<boolean>;
}) {
  const [unificando, setUnificando] = useState<string | null>(null);
  const [destinoPick, setDestinoPick] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  async function confirmarUnificar(origenCode: string) {
    if (!destinoPick) return;
    setTrabajando(true);
    const ok = await onUnificar(origenCode, destinoPick);
    setTrabajando(false);
    if (ok) {
      setUnificando(null);
      setDestinoPick("");
    }
  }

  return (
    <div className="px-[34px] py-6">
      <p className="mb-4 text-[12.5px] text-[var(--faint)]">
        Editable: precio, docente, módulos y alumnos asignados.
      </p>
      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[2.1fr_.8fr_.9fr_.6fr_.8fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Curso</span>
            <span>Modalidad</span>
            <span>Docente</span>
            <span>Alumnos</span>
            <span>Precio</span>
            <span className="justify-self-end">Acciones</span>
          </div>
          {courses.map((c, i) => {
            const inscriptos = enroll.filter((e) => e.code === c.code).length;
            const dias = diasHastaInicio(c);
            const bajoMinimo =
              c.modalidad === "cohorte" &&
              Boolean(c.cupoMinimo) &&
              inscriptos < (c.cupoMinimo ?? 0) &&
              dias !== null &&
              dias <= DIAS_AVISO_MINIMO;
            const listoParaBorrar = Boolean(c.pendienteBorrado) && inscriptos === 0;
            const otrasCohortes = courses.filter((d) => d.code !== c.code && d.modalidad === "cohorte");

            return (
              <div
                key={c.code}
                className={`${i !== courses.length - 1 ? "border-b border-[var(--line)]" : ""}`}
              >
                <div className="grid grid-cols-[2.1fr_.8fr_.9fr_.6fr_.8fr_auto] items-center gap-4 px-6 py-3.5 text-[13px]">
                  <div>
                    <div>{c.titulo}</div>
                    <div className="mt-0.5 text-[12px] text-[var(--faint)]">
                      {c.code} · {c.vertical}
                    </div>
                  </div>
                  <span className="text-[var(--dim)]">
                    {c.modalidad === "cohorte" ? "Cohorte" : "Autogest."}
                  </span>
                  <span className="text-[var(--dim)]">{c.docente}</span>
                  <div>
                    <span>{c.cupoMaximo ? `${inscriptos} / ${c.cupoMaximo}` : inscriptos}</span>
                    {bajoMinimo && (
                      <div className="mt-0.5 text-[11px] text-[var(--danger)]">
                        ⚠ bajo el mínimo ({c.cupoMinimo}){dias! < 0 ? " · ya pasó el inicio" : ` · inicia en ${dias}d`}
                      </div>
                    )}
                    {listoParaBorrar && (
                      <div className="mt-0.5 text-[11px] text-[var(--accent)]">
                        Reasignado — listo para borrar
                      </div>
                    )}
                  </div>
                  <span>{formatARS(c.precio)}</span>
                  <div className="flex justify-self-end gap-2">
                    {c.modalidad === "cohorte" && inscriptos > 0 && (
                      <button
                        onClick={() => {
                          setUnificando(unificando === c.code ? null : c.code);
                          setDestinoPick("");
                        }}
                        className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Unificar
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(c)}
                      className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(c)}
                      className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {unificando === c.code && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line2)] bg-[var(--surface2)] px-6 py-3.5">
                    <span className="text-[12px] text-[var(--faint)]">
                      Mover los alumnos sin progreso de {c.code} a:
                    </span>
                    <select
                      className="h-9 border border-[var(--line2)] bg-[var(--surface)] px-3 text-[12.5px]"
                      value={destinoPick}
                      onChange={(e) => setDestinoPick(e.target.value)}
                    >
                      <option value="">Elegir curso destino…</option>
                      {otrasCohortes.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} · {d.titulo}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => confirmarUnificar(c.code)}
                      disabled={!destinoPick || trabajando}
                      className="h-9 bg-[var(--accent)] px-4 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {trabajando ? "Moviendo…" : "Confirmar"}
                    </button>
                    <button
                      onClick={() => setUnificando(null)}
                      className="h-9 px-3 text-[12px] text-[var(--faint)] hover:text-[var(--text)]"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
