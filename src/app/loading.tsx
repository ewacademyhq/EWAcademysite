export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-3 w-3 bg-[var(--accent)]"
              style={{ animation: `pulse-square 1s ${i * 0.15}s infinite ease-in-out` }}
            />
          ))}
        </div>
        <span className="text-[13px] uppercase tracking-[.1em] text-[var(--faint)]">
          Cargando…
        </span>
      </div>
      <style>{`
        @keyframes pulse-square {
          0%, 80%, 100% { opacity: .25; transform: scale(.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
