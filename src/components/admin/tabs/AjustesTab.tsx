export function AjustesTab({
  enrollmentEnabled,
  onToggle,
}: {
  enrollmentEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="px-[34px] py-6">
      <div className="max-w-[640px] border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="text-[11.5px] font-medium uppercase tracking-[.14em] text-[var(--faint)]">
          Modo pre-lanzamiento
        </div>
        <h3 className="mt-2 text-[18px] font-medium text-[var(--text)]">Inscripciones</h3>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-[var(--dim)]">
          Mientras esté desactivado, la landing y la ficha de cada curso
          muestran un aviso de sitio en desarrollo y el botón de pago queda
          deshabilitado. Activalo recién cuando el catálogo esté listo para
          vender de verdad.
        </p>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
          <div>
            <div className="text-[14px] font-medium text-[var(--text)]">
              {enrollmentEnabled ? "Inscripciones habilitadas" : "Inscripciones deshabilitadas"}
            </div>
            <div className="mt-1 text-[12.5px] text-[var(--faint)]">
              {enrollmentEnabled
                ? "El sitio vende normalmente."
                : "Aviso de “sitio en desarrollo” activo en toda la landing y el checkout."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggle(!enrollmentEnabled)}
            className={`h-11 shrink-0 px-5 text-[13px] font-medium uppercase tracking-[.06em] transition-colors ${
              enrollmentEnabled
                ? "border border-[var(--line2)] text-[var(--text)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                : "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-600)]"
            }`}
          >
            {enrollmentEnabled ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}
