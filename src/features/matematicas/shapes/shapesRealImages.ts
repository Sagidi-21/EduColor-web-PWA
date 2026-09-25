const modules = import.meta.glob("../../../assets/shapes-real/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
}) as Record<string, { default: string }>;

const byFolder: Record<string, string[]> = {};
for (const [path, mod] of Object.entries(modules)) {
  const parts = path.split("/");
  const folder = parts[parts.length - 2];
  if (!byFolder[folder]) byFolder[folder] = [];
  byFolder[folder].push(mod.default);
}

export const SHAPES_REAL_IMAGES: Record<string, string[]> = byFolder;
