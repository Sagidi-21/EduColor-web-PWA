/** CSS vars de color de clase para el documento de ficha (iframe / PDF / Word). */

/** Prefijo CSS con `--color-primary` desde el color de la clase (sin variante dark). */
export function buildAccentCssVars(accentColor: string | undefined): string {
  const hex = accentColor?.trim();
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "";
  return `:root{--color-primary:${hex};}\n`;
}
