"use client";

export function DeleteDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: { code: string; alumnos: number } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-6"
      style={{ background: "rgba(14,14,14,.72)" }}
    >
      <div
        className="w-full max-w-[460px] border border-[var(--line)] bg-[var(--surface)] p-7"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h2 className="text-[20px] font-medium">¿Eliminar {target.code}?</h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--dim)]">
          Se eliminan el curso, sus módulos y el vínculo con {target.alumnos}{" "}
          {target.alumnos === 1 ? "matrícula" : "matrículas"}. Los pagos ya
          acreditados quedan en el historial. Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-11 border border-[var(--line2)] px-5 text-[13px] font-medium uppercase tracking-[.06em] hover:border-[var(--text)]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="h-11 bg-[var(--danger)] px-5 text-[13px] font-medium uppercase tracking-[.06em] text-white hover:brightness-110"
          >
            Eliminar definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}
