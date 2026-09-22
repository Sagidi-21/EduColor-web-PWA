const raw = import.meta.glob("../assets/izquierda-derecha/**/*.{jpg,jpeg,png,svg,webp}", {
  eager: true,
}) as Record<string, { default: string }>;

export interface CharImage {
  name: string;
  url: string;
  perspective: "frente" | "espaldas";
}

function build(): CharImage[] {
  const out: CharImage[] = [];
  for (const [path, mod] of Object.entries(raw)) {
    const parts = path.split("/");
    const folder = parts[parts.length - 2];
    if (folder !== "frente" && folder !== "espaldas") continue;
    const name = parts[parts.length - 1].replace(/\.[^.]+$/, "");
    out.push({ name, url: mod.default, perspective: folder as "frente" | "espaldas" });
  }
  return out;
}

export const CHARACTER_IMAGES: CharImage[] = build();
