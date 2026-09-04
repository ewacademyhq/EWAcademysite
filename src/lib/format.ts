export function formatARS(value: number): string {
  return `ARS ${new Intl.NumberFormat("es-AR").format(Math.round(value))}`;
}

export function formatShort(value: number): string {
  if (value >= 1e6) {
    return `ARS ${(value / 1e6).toFixed(1).replace(".", ",")}M`;
  }
  return formatARS(value);
}
