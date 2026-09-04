"use client";

export function Toast({
  message,
  onUndo,
}: {
  message: string | null;
  onUndo?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-4 border border-[var(--line2)] bg-[var(--elev)] px-6 py-4 text-[13.5px] text-[var(--text)] shadow-[var(--shadow)]"
      style={{ animation: "slideUp .3s ease" }}
    >
      <span>{message}</span>
      {onUndo && (
        <button
          onClick={onUndo}
          className="text-[12.5px] font-medium uppercase tracking-[.06em] text-[var(--accent)] hover:underline"
        >
          Deshacer
        </button>
      )}
    </div>
  );
}
