"use client";

import { useState } from "react";

export interface EditarEmailTarget {
  id: string;
  nombre: string;
  email: string;
}

export function EditarEmailDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: EditarEmailTarget | null;
  onCancel: () => void;
  onConfirm: (email: string) => void;
}) {
  const [email, setEmail] = useState(target?.email ?? "");

  if (!target) return null;

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const puedeConfirmar = emailValido && email.trim().toLowerCase() !== target.email.toLowerCase();

  function handleCancel() {
    setEmail(target!.email);
    onCancel();
  }

  function handleConfirm() {
    if (!puedeConfirmar) return;
    onConfirm(email.trim().toLowerCase());
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
        <h2 className="text-[20px] font-medium">Editar email de {target.nombre}</h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">
          Cambia el email de login y de contacto. El alumno va a tener que usar el email
          nuevo para iniciar sesión de ahora en más.
        </p>
        <div className="mt-4">
          <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Email nuevo
          </label>
          <input
            type="email"
            className="mt-2 h-11 w-full border border-[var(--line2)] bg-[var(--surface)] px-3.5 text-[14px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alumno@ejemplo.com"
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
            Guardar email
          </button>
        </div>
      </div>
    </div>
  );
}
