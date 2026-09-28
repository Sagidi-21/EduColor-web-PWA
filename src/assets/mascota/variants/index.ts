import v1 from "./variant_1.webp";
import v2 from "./variant_2.webp";
import v3 from "./variant_3.webp";
import v4 from "./variant_4.webp";
import v5 from "./variant_5.webp";
import v6 from "./variant_6.webp";
import v7 from "./variant_7.webp";
import v8 from "./variant_8.webp";
import v9 from "./variant_9.webp";
import v10 from "./variant_10.webp";
import v11 from "./variant_11.webp";
import v12 from "./variant_12.webp";
import v13 from "./variant_13.webp";
import v14 from "./variant_14.webp";
import v15 from "./variant_15.webp";
import v16 from "./variant_16.webp";
import v17 from "./variant_17.webp";
import v18 from "./variant_18.webp";
import v19 from "./variant_19.webp";
import v20 from "./variant_20.webp";
import v21 from "./variant_21.webp";

export const mascotVariants: string[] = [
  v1,
  v2,
  v3,
  v4,
  v5,
  v6,
  v7,
  v8,
  v9,
  v10,
  v11,
  v12,
  v13,
  v14,
  v15,
  v16,
  v17,
  v18,
  v19,
  v20,
  v21,
];

export function getRandomMascotVariant(): string {
  const randomIndex = Math.floor(Math.random() * mascotVariants.length);
  return mascotVariants[randomIndex];
}
