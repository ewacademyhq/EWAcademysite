"use client";

import { useState } from "react";

export function MotivoDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = "accent",
  placeholder,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "accent" | "danger";
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (nota: string) => void;
}) {
  const [nota, setNota] = useState("");

  if (!open) return null;

  const puedeConfirmar = nota.trim().length > 0;

  function handleCancel() {
    setNota("");
    onCancel();
  }

  function handleConfirm() {
    if (!puedeConfirmar) return;
    onConfirm(nota.trim());
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
        <h2 className="text-[20px] font-medium">{title}</h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">{message}</p>
        <div className="mt-4">
          <label className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
            Motivo (obligatorio)
          </label>
          <textarea
            className="mt-2 h-20 w-full border border-[var(--line2)] bg-[var(--surface)] p-3 text-[13.5px] text-[var(--text)]"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={placeholder}
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
            className={`h-11 px-5 text-[13px] font-medium uppercase tracking-[.06em] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
              variant === "danger" ? "bg-[var(--danger)] text-white" : "bg-[var(--accent)] text-[var(--accent-ink)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
