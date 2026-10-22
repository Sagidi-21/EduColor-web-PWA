/**
 * `/ficha-preview` es una ruta de depuración que genera fichas/soluciones en el cliente.
 * En producción debe permanecer cerrada (contención). No es un gate de contenido del bundle.
 */

export function isFichaPreviewPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/ficha-preview" || path.endsWith("/ficha-preview");
}

/** false en builds de producción (import.meta.env.PROD). */
export function isFichaPreviewAllowed(isProd: boolean = import.meta.env.PROD): boolean {
  return !isProd;
}
