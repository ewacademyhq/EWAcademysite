/** "2026-09-15" -> "15/09/2026". */
export function isoToDMY(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

/** "15/09/2026" -> "2026-09-15". Devuelve null si no matchea el formato. */
export function dmyToISO(dmy: string): string | null {
  const match = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/** Fecha de hoy en formato "YYYY-MM-DD" (para columnas `date`). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function initials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
