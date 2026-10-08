import fs from "fs";
import path from "path";

const ICONS_DIR = path.join(process.cwd(), "public", "icons");

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const BG_START = "#5b4bdb";
const BG_END = "#3d2fd4";
const WHITE = "#ffffff";
const ACCENT = "#ffd54f";

function generateSVG(size, isMaskable = false) {
  const radius = size * 0.125;
  const centerX = size / 2;
  const centerY = size / 2;
  const fontSize = size * 0.42;
  const accentSize = size * 0.06;
  const safeRadius = size * 0.2; // 40% diámetro = 20% radio

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  // Definiciones
  svg += `<defs>`;
  svg += `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`;
  svg += `<stop offset="0%" style="stop-color:${BG_START};stop-opacity:1" />`;
  svg += `<stop offset="100%" style="stop-color:${BG_END};stop-opacity:1" />`;
  svg += `</linearGradient>`;

  if (isMaskable) {
    svg += `<clipPath id="maskable-safe">`;
    svg += `<circle cx="${centerX}" cy="${centerY}" r="${safeRadius}" />`;
    svg += `</clipPath>`;
  }
  svg += `</defs>`;

  // Fondo rounded rect
  svg += `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)" ${isMaskable ? 'clip-path="url(#maskable-safe)"' : ""} />`;

  // Texto "EC"
  svg += `<text x="${centerX}" y="${centerY + size * 0.02}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${WHITE}" text-anchor="middle" dominant-baseline="middle">EC</text>`;

  // Acento amarillo
  svg += `<circle cx="${size * 0.75}" cy="${size * 0.25}" r="${accentSize}" fill="${ACCENT}" ${isMaskable ? 'clip-path="url(#maskable-safe)"' : ""} />`;

  svg += `</svg>`;
  return svg;
}

const icons = [
  { name: "icon-192.svg", size: 192, maskable: false },
  { name: "icon-512.svg", size: 512, maskable: false },
  { name: "icon-512-maskable.svg", size: 512, maskable: true },
];

icons.forEach(({ name, size, maskable }) => {
  const svg = generateSVG(size, maskable);
  fs.writeFileSync(path.join(ICONS_DIR, name), svg);
  console.log(`✅ Generado: ${name} (${size}x${size}${maskable ? ", maskable" : ""})`);
});

console.log("\n📁 Iconos en:", ICONS_DIR);
