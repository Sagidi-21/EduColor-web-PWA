import type { MoneyItem, TipoDinero } from "../core/activities/monedasBilletes";

/**
 * Resuelve URLs de monedas/billetes en `src/assets/dinero/`.
 * Vive en platform para que el generador de fichas pueda usarlo.
 */
const modules = import.meta.glob<string>("../assets/dinero/*/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CARPETA: Record<TipoDinero, string> = {
  moneda: "monedas",
  billete: "billetes",
};

const porCarpetaYFichero = new Map<string, string>();
for (const [ruta, url] of Object.entries(modules)) {
  const partes = ruta.split("/");
  porCarpetaYFichero.set(`${partes[partes.length - 2]}/${partes[partes.length - 1]}`, url);
}

/** Devuelve la URL de la imagen, o "" si el asset no llegara a empaquetarse. */
export function moneyImageUrl(item: MoneyItem): string {
  return porCarpetaYFichero.get(`${CARPETA[item.tipo]}/${item.fichero}`) ?? "";
}
