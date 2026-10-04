"use client";

import { useState } from "react";
import type { Enrollment, EstadoMatricula } from "@/lib/types";
import { ALLOWED_TRANSITIONS, courseByCode, ESTADOS } from "@/lib/business";
import { formatARS } from "@/lib/format";
import { bajaEfectivaLabel } from "@/lib/date";
import { ForceEstadoDialog } from "@/components/admin/ForceEstadoDialog";

export function MatriculasTab({
  enroll,
  onChangeEstado,
  onForceEstado,
  onToggleMora,
  onOpenFicha,
}: {
  enroll: Enrollment[];
  onChangeEstado: (id: number, estado: EstadoMatricula) => void;
  onForceEstado: (id: number, estado: EstadoMatricula, nota: string) => void;
  onToggleMora: (id: number) => void;
  onOpenFicha: (id: number) => void;
}) {
  const [forceTarget, setForceTarget] = useState<Enrollment | null>(null);

  return (
    <div className="px-[34px] py-6">
      <div className="mb-4 flex flex-col gap-1 text-[12.5px] text-[var(--faint)]">
        <p>Poner en mora es exclusivo de este panel.</p>
        <p>
          Una matrícula pasa a <strong className="font-medium text-[var(--text)]">Finalizada</strong>{" "}
          en la fecha de fin del cohorte si las cuotas están al día; si quedó
          debiendo va a <strong className="font-medium text-[var(--text)]">Finalizada con deuda</strong>.
          Esos dos estados son terminales — para corregir un error de carga
          usá &quot;Forzar corrección&quot;, que pide un motivo y queda en la auditoría.
          El resto de los cambios de estado queda registrado igual, con quién
          lo hizo y cuándo.
        </p>
      </div>

      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[1.4fr_.7fr_1.2fr_.85fr_.85fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Alumno</span>
            <span>Curso</span>
            <span>Estado</span>
            <span>Cuota congelada</span>
            <span>Precio de hoy</span>
            <span className="justify-self-end">Acciones</span>
          </div>
          {enroll.map((e, i) => {
            const course = courseByCode(e.code);
            const vigente = course?.precio ?? e.cuota;
            const diff = vigente - e.cuota;
            const info = ESTADOS[e.estado];
            const siguientes = ALLOWED_TRANSITIONS[e.estado];
            const terminal = siguientes.length === 0;
            return (
              <div
                key={e.id}
                className={`grid grid-cols-[1.4fr_.7fr_1.2fr_.85fr_.85fr_auto] items-center gap-4 px-6 py-3.5 text-[13px] ${
                  i !== enroll.length - 1 ? "border-b border-[var(--line)]" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--line2)] text-[11px] font-medium">
                    {e.ini}
                  </span>
                  {e.nombre}
                </span>
                <span className="text-[var(--dim)]">{e.code}</span>
                <div className="flex flex-col gap-1">
                  <select
                    value={e.estado}
                    disabled={terminal}
                    onChange={(ev) => onChangeEstado(e.id, ev.target.value as EstadoMatricula)}
                    className="h-9 border px-2 text-[12.5px] font-medium disabled:cursor-not-allowed disabled:opacity-80"
                    style={{ borderColor: "var(--line2)", color: info.color, background: info.soft }}
                  >
                    <option value={e.estado}>{ESTADOS[e.estado].label}</option>
                    {siguientes.map((k) => (
                      <option key={k} value={k}>
                        {ESTADOS[k].label}
                      </option>
                    ))}
                  </select>
                  {terminal && (
                    <button
                      onClick={() => setForceTarget(e)}
                      className="text-left text-[11px] uppercase tracking-[.06em] text-[var(--faint)] hover:text-[var(--accent)] hover:underline"
                    >
                      Forzar corrección…
                    </button>
                  )}
                  {e.bajaSolicitadaAt && (
                    <span className="text-[11px] text-[var(--danger)]">
                      Baja solicitada · efectiva {bajaEfectivaLabel(e.bajaSolicitadaAt)}
                    </span>
                  )}
                </div>
                <span>{formatARS(e.cuota)}</span>
                <span style={{ color: diff > 0 ? "var(--accent)" : "var(--faint)" }}>
                  {diff === 0 ? "igual" : formatARS(vigente)}
                </span>
                <div className="flex justify-self-end gap-2">
                  <button
                    onClick={() => onOpenFicha(e.id)}
                    className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] transition-colors hover:border-[var(--text)]"
                  >
                    Ficha
                  </button>
                  {!terminal && (
                    <button
                      onClick={() => onToggleMora(e.id)}
                      className="h-8 border px-3 text-[11.5px] font-medium uppercase tracking-[.06em]"
                      style={{
                        borderColor: e.estado === "mora" ? "var(--danger)" : "var(--line2)",
                        background: e.estado === "mora" ? "var(--danger-soft)" : "transparent",
                        color: e.estado === "mora" ? "var(--danger)" : "var(--text)",
                      }}
                    >
                      {e.estado === "mora" ? "Levantar mora" : "Poner en mora"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ForceEstadoDialog
        target={forceTarget}
        onCancel={() => setForceTarget(null)}
        onConfirm={(estado, nota) => {
          if (forceTarget) onForceEstado(forceTarget.id, estado, nota);
          setForceTarget(null);
        }}
      />
    </div>
  );
}
