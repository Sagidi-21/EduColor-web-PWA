import type { KiloCategory, KiloItem } from "../../../core/activities/elKilo";

/**
 * Cubre las tres carpetas de elKilo: `+kilo` (más), `-kilo` (menos) y `kilo`
 * (solo la pesa de referencia de 1 kg). El motor declara el nombre de fichero,
 * no su carpeta, así que la clave del mapa es `carpeta/archivo.png`.
 */
const modules = import.meta.glob<string>("../../../assets/*kilo/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const byFolderAndFile = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  const parts = path.split("/");
  byFolderAndFile.set(`${parts[parts.length - 2]}/${parts[parts.length - 1]}`, url);
}

const FOLDER: Record<KiloCategory, string> = {
  mas: "+kilo",
  menos: "-kilo",
};

/** Devuelve la URL de la imagen, o "" si el asset no llegara a empaquetarse. */
export function kiloImageUrl(item: KiloItem): string {
  return byFolderAndFile.get(`${FOLDER[item.category]}/${item.file}`) ?? "";
}

/** URL de la pesa de 1 kg, el equivalente a la botella de litro de elLitro. */
export const REFERENCE_URL: string = byFolderAndFile.get("kilo/pesa de 1 kilo.png") ?? "";
