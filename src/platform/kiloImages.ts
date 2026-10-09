import type { KiloCategory, KiloItem } from "../core/activities/elKilo";

const modules = import.meta.glob<string>("../assets/*kilo/*.png", {
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

export function kiloImageUrl(item: KiloItem): string {
  return byFolderAndFile.get(`${FOLDER[item.category]}/${item.file}`) ?? "";
}

export const REFERENCE_URL: string = byFolderAndFile.get("kilo/pesa de 1 kilo.png") ?? "";
