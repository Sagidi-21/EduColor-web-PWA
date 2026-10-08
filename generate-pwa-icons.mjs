import fs from "fs";
import path from "path";
import sharp from "sharp";

const LOGO_PATH = path.join(process.cwd(), "src", "assets", "welcome-logo-bg.png");
const ICONS_DIR = path.join(process.cwd(), "public", "icons");

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const sizes = [
  { name: "icon-72.png", size: 72 },
  { name: "icon-96.png", size: 96 },
  { name: "icon-128.png", size: 128 },
  { name: "icon-144.png", size: 144 },
  { name: "icon-152.png", size: 152 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
];

const maskableSizes = [
  { name: "icon-192-maskable.png", size: 192 },
  { name: "icon-512-maskable.png", size: 512 },
];

async function generateIcon(inputPath, outputPath, size, maskable = false) {
  const safeZone = Math.round(size * 0.4); // 40% safe zone for maskable
  const padding = Math.round((size - safeZone) / 2);

  let pipeline = sharp(inputPath)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png();

  if (maskable) {
    // For maskable: add padding so content fits in safe zone
    pipeline = sharp(inputPath)
      .resize(safeZone, safeZone, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 91, g: 75, b: 219, alpha: 1 }, // theme color #5b4bdb
      })
      .png();
  }

  await pipeline.toFile(outputPath);
  console.log(`✅ ${path.basename(outputPath)} (${size}x${size}${maskable ? ", maskable" : ""})`);
}

async function main() {
  console.log("🎨 Generando iconos PWA desde logo.png...\n");

  for (const { name, size } of sizes) {
    await generateIcon(LOGO_PATH, path.join(ICONS_DIR, name), size, false);
  }

  for (const { name, size } of maskableSizes) {
    await generateIcon(LOGO_PATH, path.join(ICONS_DIR, name), size, true);
  }

  console.log("\n📁 Iconos generados en:", ICONS_DIR);
}

main().catch(console.error);
