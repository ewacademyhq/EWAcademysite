"use client";

import { useState } from "react";
import type { Enrollment, EstadoMatricula } from "@/lib/types";
import { ESTADOS } from "@/lib/business";

export function ForceEstadoDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: Enrollment | null;
  onCancel: () => void;
  onConfirm: (estado: EstadoMatricula, nota: string) => void;
}) {
  const [estado, setEstado] = useState<EstadoMatricula | "">("");
  const [nota, setNota] = useState("");

  if (!target) return null;

  const opciones = (Object.keys(ESTADOS) as EstadoMatricula[]).filter((k) => k !== target.estado);
  const puedeConfirmar = estado !== "" && nota.trim().length > 0;

  function handleCancel() {
    setEstado("");
    setNota("");
    onCancel();
  }

  function handleConfirm() {
    if (!puedeConfirmar) return;
    onConfirm(estado as EstadoMatricula, nota.trim());
    setEstado("");
    setNota("");
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-6"
      style={{ background: "rgba(14,14,14,.72)" }}
    >
      <div
        className="w-full max-w-[460px] border border-[var(--line)] bg-[var(--surface)] p-7"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 className="text-[20px] font-medium">Forzar corrección de estado</h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">
          {target.nombre} está en{" "}
          <strong className="font-medium text-[var(--text)]">{ESTADOS[target.estado].label}</strong>,
          un estado terminal. Esto es solo para corregir un error de carga — queda
          registrado en el historial de auditoría con el motivo que escribas.
        </p>
        <div className="mt-4">
          <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Nuevo estado
          </label>
          <select
            className="mt-2 h-11 w-full border border-[var(--line2)] bg-[var(--surface)] px-3 text-[14px]"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoMatricula)}
          >
            <option value="">Elegir…</option>
            {opciones.map((k) => (
              <option key={k} value={k}>
                {ESTADOS[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Motivo (obligatorio)
          </label>
          <textarea
            className="mt-2 h-20 w-full border border-[var(--line2)] bg-[var(--surface)] p-3 text-[13.5px] text-[var(--text)]"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: se cargó mal la fecha de fin de cohorte, el curso sigue activo."
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="h-11 border border-[var(--line2)] px-5 text-[13px] font-medium uppercase tracking-[.06em] hover:border-[var(--text)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!puedeConfirmar}
            className="h-11 bg-[var(--accent)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-[var(--accent-ink)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Forzar cambio
          </button>
        </div>
      </div>
    </div>
  );
}
