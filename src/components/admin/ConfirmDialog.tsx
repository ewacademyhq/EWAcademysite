"use client";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = "accent",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "accent" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

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
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-11 border border-[var(--line2)] px-5 text-[13px] font-medium uppercase tracking-[.06em] hover:border-[var(--text)]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`h-11 px-5 text-[13px] font-medium uppercase tracking-[.06em] hover:brightness-110 ${
              variant === "danger"
                ? "bg-[var(--danger)] text-white"
                : "bg-[var(--accent)] text-[var(--accent-ink)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
