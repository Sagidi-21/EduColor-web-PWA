import v1 from "./variant_1.png";
import v2 from "./variant_2.png";
import v3 from "./variant_3.png";
import v4 from "./variant_4.png";
import v5 from "./variant_5.png";
import v6 from "./variant_6.png";
import v7 from "./variant_7.png";
import v8 from "./variant_8.png";
import v9 from "./variant_9.png";
import v10 from "./variant_10.png";
import v11 from "./variant_11.png";
import v12 from "./variant_12.png";
import v13 from "./variant_13.png";
import v14 from "./variant_14.png";
import v15 from "./variant_15.png";
import v16 from "./variant_16.png";
import v17 from "./variant_17.png";
import v18 from "./variant_18.png";
import v19 from "./variant_19.png";
import v20 from "./variant_20.png";
import v21 from "./variant_21.png";

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
