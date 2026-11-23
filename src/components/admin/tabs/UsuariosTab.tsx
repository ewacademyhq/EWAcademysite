"use client";

import { useState } from "react";
import type { AlumnoAdmin } from "@/lib/data/admin";
import { EditarEmailDialog, type EditarEmailTarget } from "@/components/admin/EditarEmailDialog";
import { MotivoDialog } from "@/components/admin/MotivoDialog";

export function UsuariosTab({
  alumnos,
  onEditarEmail,
  onRestablecerContrasena,
  onToggleActivo,
}: {
  alumnos: AlumnoAdmin[];
  onEditarEmail: (id: string, email: string) => Promise<boolean>;
  onRestablecerContrasena: (id: string) => Promise<boolean>;
  onToggleActivo: (id: string, activo: boolean, motivo: string) => Promise<boolean>;
}) {
  const [editTarget, setEditTarget] = useState<EditarEmailTarget | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AlumnoAdmin | null>(null);
  const [restableciendo, setRestableciendo] = useState<string | null>(null);

  async function handleRestablecer(id: string) {
    setRestableciendo(id);
    await onRestablecerContrasena(id);
    setRestableciendo(null);
  }

  return (
    <div className="px-[34px] py-6">
      <p className="mb-4 text-[12.5px] text-[var(--faint)]">
        Todos los alumnos registrados, tengan o no una matrícula. Para soporte: editar
        email, mandar un link para que el alumno elija contraseña nueva, o
        desactivar/reactivar el acceso.
      </p>

      <div className="overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[1.2fr_1.4fr_.9fr_.7fr_.8fr_auto] gap-4 border-b border-[var(--line)] px-6 py-3 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--faint)]">
            <span>Nombre</span>
            <span>Email</span>
            <span>Alta</span>
            <span>Email</span>
            <span>Estado</span>
            <span className="justify-self-end">Acciones</span>
          </div>
          {alumnos.length === 0 && (
            <div className="px-6 py-8 text-center text-[13px] text-[var(--faint)]">
              Todavía no hay ningún alumno registrado.
            </div>
          )}
          {alumnos.map((a, i) => (
            <div
              key={a.id}
              className={`grid grid-cols-[1.2fr_1.4fr_.9fr_.7fr_.8fr_auto] items-center gap-4 px-6 py-3.5 text-[13px] ${
                i !== alumnos.length - 1 ? "border-b border-[var(--line)]" : ""
              }`}
            >
              <span>{a.nombre}</span>
              <span className="text-[var(--dim)]">{a.email}</span>
              <span className="text-[var(--dim)]">{new Date(a.createdAt).toLocaleDateString("es-AR")}</span>
              <span style={{ color: a.emailVerificado ? "var(--good)" : "var(--faint)" }}>
                {a.emailVerificado ? "Confirmado" : "Sin confirmar"}
              </span>
              <span style={{ color: a.activo ? "var(--good)" : "var(--danger)" }}>
                {a.activo ? "Activo" : "Desactivado"}
              </span>
              <div className="flex flex-wrap justify-self-end gap-2">
                <button
                  onClick={() => setEditTarget({ id: a.id, nombre: a.nombre, email: a.email })}
                  className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Editar email
                </button>
                <button
                  onClick={() => handleRestablecer(a.id)}
                  disabled={restableciendo === a.id}
                  className="h-8 border border-[var(--line2)] px-3 text-[11.5px] font-medium uppercase tracking-[.06em] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {restableciendo === a.id ? "Enviando…" : "Restablecer contraseña"}
                </button>
                <button
                  onClick={() => setToggleTarget(a)}
                  className="h-8 border px-3 text-[11.5px] font-medium uppercase tracking-[.06em]"
                  style={{
                    borderColor: a.activo ? "var(--danger)" : "var(--line2)",
                    color: a.activo ? "var(--danger)" : "var(--text)",
                  }}
                >
                  {a.activo ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditarEmailDialog
        key={editTarget?.id ?? "none"}
        target={editTarget}
        onCancel={() => setEditTarget(null)}
        onConfirm={async (email) => {
          if (!editTarget) return;
          const ok = await onEditarEmail(editTarget.id, email);
          if (ok) setEditTarget(null);
        }}
      />

      <MotivoDialog
        open={toggleTarget !== null}
        title={toggleTarget?.activo ? `Desactivar a ${toggleTarget.nombre}` : `Reactivar a ${toggleTarget?.nombre}`}
        message={
          toggleTarget?.activo
            ? "Le revoca el acceso real a la cuenta (no solo lo oculta). Queda registrado en la auditoría."
            : "Le devuelve el acceso real a la cuenta. Queda registrado en la auditoría."
        }
        confirmLabel={toggleTarget?.activo ? "Desactivar" : "Reactivar"}
        variant={toggleTarget?.activo ? "danger" : "accent"}
        placeholder="Ej: lo pidió el alumno por soporte, sospecha de cuenta comprometida, etc."
        onCancel={() => setToggleTarget(null)}
        onConfirm={async (motivo) => {
          if (!toggleTarget) return;
          const ok = await onToggleActivo(toggleTarget.id, !toggleTarget.activo, motivo);
          if (ok) setToggleTarget(null);
        }}
      />
    </div>
  );
}
