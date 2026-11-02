"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import type { VerticalOption } from "@/lib/data/admin";

export function VerticalesDrawer({
  open,
  verticales,
  courses,
  onClose,
  onCreate,
  onEdit,
  onDelete,
}: {
  open: boolean;
  verticales: VerticalOption[];
  courses: Course[];
  onClose: () => void;
  onCreate: (nombre: string, prefijo: string) => Promise<boolean>;
  onEdit: (nombreActual: string, nombreNuevo: string, prefijoNuevo: string) => Promise<boolean>;
  onDelete: (nombre: string) => Promise<boolean>;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreDraft, setNombreDraft] = useState("");
  const [prefijoDraft, setPrefijoDraft] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoPrefijo, setNuevoPrefijo] = useState("");
  const [creando, setCreando] = useState(false);

  if (!open) return null;

  function empezarEdicion(v: VerticalOption) {
    setEditando(v.nombre);
    setNombreDraft(v.nombre);
    setPrefijoDraft(v.prefijo);
  }

  async function guardarEdicion(original: string) {
    if (!nombreDraft.trim() || !/^[A-Z]+$/.test(prefijoDraft)) return;
    setGuardando(true);
    const ok = await onEdit(original, nombreDraft.trim(), prefijoDraft);
    setGuardando(false);
    if (ok) setEditando(null);
  }

  async function borrar(nombre: string) {
    setBorrando(nombre);
    await onDelete(nombre);
    setBorrando(null);
  }

  async function agregar() {
    if (!nuevoNombre.trim() || !/^[A-Z]+$/.test(nuevoPrefijo)) return;
    setCreando(true);
    const ok = await onCreate(nuevoNombre.trim(), nuevoPrefijo);
    setCreando(false);
    if (ok) {
      setNuevoNombre("");
      setNuevoPrefijo("");
    }
  }

  const inputClass =
    "h-10 w-full border border-[var(--line2)] bg-[var(--surface)] px-3 text-[13.5px] text-[var(--text)]";

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" style={{ background: "rgba(14,14,14,.72)" }}>
      <div
        className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l-2 border-[var(--accent)] bg-[var(--bg)]"
        style={{ boxShadow: "var(--shadow)", animation: "slideUp .18s ease" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-6 py-5">
          <div>
            <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--accent)]">
              Verticales
            </div>
            <div className="mt-1 text-[15px]">Categorías del catálogo</div>
          </div>
          <button
            onClick={onClose}
            className="h-9 border border-[var(--line2)] px-4 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--text)]"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-px bg-[var(--line)]">
            {verticales.map((v) => {
              const cantidad = courses.filter((c) => c.vertical === v.nombre).length;
              const esEditando = editando === v.nombre;
              return (
                <div key={v.nombre} className="bg-[var(--surface)] p-4">
                  {esEditando ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          className={inputClass}
                          value={nombreDraft}
                          onChange={(e) => setNombreDraft(e.target.value)}
                          placeholder="Nombre"
                        />
                        <input
                          className={`${inputClass} w-28 font-mono uppercase`}
                          value={prefijoDraft}
                          onChange={(e) => setPrefijoDraft(e.target.value.toUpperCase())}
                          placeholder="Prefijo"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarEdicion(v.nombre)}
                          disabled={guardando}
                          className="h-9 flex-1 bg-[var(--accent)] text-[12px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {guardando ? "Guardando…" : "Guardar"}
                        </button>
                        <button
                          onClick={() => setEditando(null)}
                          className="h-9 px-3 text-[12px] text-[var(--faint)] hover:text-[var(--text)]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-medium">{v.nombre}</div>
                        <div className="mt-0.5 font-mono text-[12px] text-[var(--faint)]">
                          {v.prefijo} · {cantidad} {cantidad === 1 ? "curso" : "cursos"}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => empezarEdicion(v)}
                          className="h-9 border border-[var(--line2)] px-3 text-[12px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => borrar(v.nombre)}
                          disabled={cantidad > 0 || borrando === v.nombre}
                          title={cantidad > 0 ? "No se puede borrar: tiene cursos asignados" : undefined}
                          className="h-9 border border-[var(--line2)] px-3 text-[12px] font-medium uppercase tracking-[.06em] text-[var(--danger)] hover:border-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line2)]"
                        >
                          {borrando === v.nombre ? "…" : "Borrar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {verticales.length === 0 && (
              <div className="bg-[var(--surface)] px-4 py-6 text-center text-[13px] text-[var(--dim)]">
                Todavía no hay verticales cargadas.
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
              Nueva vertical
            </label>
            <div className="mt-2 flex gap-2">
              <input
                className={inputClass}
                placeholder="Nombre (ej: Data)"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
              <input
                className={`${inputClass} w-28 font-mono uppercase`}
                placeholder="Prefijo"
                value={nuevoPrefijo}
                onChange={(e) => setNuevoPrefijo(e.target.value.toUpperCase())}
              />
              <button
                onClick={agregar}
                disabled={creando || !nuevoNombre.trim() || !/^[A-Z]+$/.test(nuevoPrefijo)}
                className="h-10 shrink-0 bg-[var(--accent)] px-4 text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creando ? "…" : "Agregar"}
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-[var(--faint)]">
              El prefijo se usa para generar los códigos de curso (ej: DATA-101). Solo mayúsculas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
