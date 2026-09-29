import type { LitroCategory, LitroItem } from "../../../core/activities/elLitro";

/**
 * Cubre las tres carpetas de elLitro: `+litro` (más), `litro` (referencia) y
 * `-litro` (menos). El motor declara el nombre de fichero, no su carpeta, así
 * que la clave del mapa es `carpeta/archivo.png`.
 */
const modules = import.meta.glob<string>("../../../assets/*litro/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const byFolderAndFile = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  const parts = path.split("/");
  byFolderAndFile.set(`${parts[parts.length - 2]}/${parts[parts.length - 1]}`, url);
}

const FOLDER: Record<LitroCategory, string> = {
  mas: "+litro",
  litro: "litro",
  menos: "-litro",
};

/** Devuelve la URL de la imagen, o "" si el asset no llegara a empaquetarse. */
export function litroImageUrl(item: LitroItem): string {
  return byFolderAndFile.get(`${FOLDER[item.category]}/${item.file}`) ?? "";
}

/** Recipiente de 1 litro usado como referencia visual en los ejercicios de clasificar. */
export const REFERENCE_ITEM: LitroItem = {
  name: "botella de litro",
  file: "botella de litro.png",
  category: "litro",
};
