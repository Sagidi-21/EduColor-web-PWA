/**
 * objectImages.ts
 * ---------------
 * Carga dinámicamente todas las imágenes de src/assets/objects/.
 * Añadir una carpeta nueva o más imágenes dentro de una existente
 * funciona automáticamente — sin tocar este fichero.
 */

// Vite resuelve el glob en build-time y genera las URLs optimizadas.
const modules = import.meta.glob("../assets/objects/**/*.{jpg,jpeg,png,svg,webp}", {
  eager: true,
}) as Record<string, { default: string }>;

export interface ImageCategory {
  name: string; // 'coches', 'globos', etc.
  images: string[]; // URLs resueltas por Vite
}

// Agrupa las imágenes por carpeta (categoría)
function buildCategories(): ImageCategory[] {
  const map: Record<string, string[]> = {};

  for (const [path, mod] of Object.entries(modules)) {
    // path: '../../assets/objects/coches/coche_01.jpeg'
    const parts = path.split("/");
    const category = parts[parts.length - 2]; // 'coches'
    const url = mod.default;
    if (!map[category]) map[category] = [];
    map[category].push(url);
  }

  return Object.entries(map)
    .map(([name, images]) => ({ name, images: images.sort() }))
    .filter((cat) => cat.images.length > 0);
}

export const IMAGE_CATEGORIES: ImageCategory[] = buildCategories();

/** Devuelve una imagen concreta de la categoría usando el RNG dado. */
export function pickImage(category: ImageCategory, rng: () => number): string {
  return category.images[Math.floor(rng() * category.images.length)];
}

/** Devuelve una categoría aleatoria. */
export function pickCategory(rng: () => number): ImageCategory {
  return IMAGE_CATEGORIES[Math.floor(rng() * IMAGE_CATEGORIES.length)];
}
