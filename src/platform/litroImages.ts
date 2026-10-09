import type { LitroCategory, LitroItem } from "../core/activities/elLitro";

const modules = import.meta.glob<string>("../assets/*litro/*.png", {
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

export function litroImageUrl(item: LitroItem): string {
  return byFolderAndFile.get(`${FOLDER[item.category]}/${item.file}`) ?? "";
}

export const REFERENCE_ITEM: LitroItem = {
  name: "botella de litro",
  file: "botella de litro.png",
  category: "litro",
};

export function litroReferenceUrl(): string {
  return litroImageUrl(REFERENCE_ITEM);
}
