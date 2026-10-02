import type { MoneyItem, TipoDinero } from "../../../core/activities/monedasBilletes";

/**
 * Resuelve la URL de las monedas y de los billetes de `src/assets/dinero/`.
 *
 * El motor declara el fichero (`20cent.png`) y aquí se busca dentro de su
 * carpeta, porque el core no debe saber de rutas. Es el mismo reparto que
 * `elKilo` con `kiloImages.ts`.
 *
 * La clave del mapa es `carpeta/fichero.png`: con las dos carpetas —`monedas` y
 * `billetes`— el nombre del fichero no basta, ya que `1euro.png` podría
 * aparecer en las dos.
 */
const modules = import.meta.glob<string>("../../../assets/dinero/*/*.png", {
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
