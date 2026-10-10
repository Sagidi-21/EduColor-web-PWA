/** CSS vars de color de clase para el documento de ficha (iframe / PDF / Word). */

function darkenHex(hex: string): string {
  const h = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return h;
  const darken = (start: number) =>
    Math.max(0, Math.round(start * 0.6))
      .toString(16)
      .padStart(2, "0");
  return `#${darken(parseInt(h.slice(1, 3), 16))}${darken(parseInt(h.slice(3, 5), 16))}${darken(parseInt(h.slice(5, 7), 16))}`;
}

/** Prefijo CSS con `--color-primary` / `--color-primary-dark` desde el color de la clase. */
export function buildAccentCssVars(accentColor: string | undefined): string {
  const hex = accentColor?.trim();
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "";
  const dark = darkenHex(hex);
  return `:root{--color-primary:${hex};--color-primary-dark:${dark};}\n`;
}
