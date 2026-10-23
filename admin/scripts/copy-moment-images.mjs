// One-off: copies the consumption-moment covers of the customer app (web/public/images/moments)
// into public/images/moments, so the 08 screens and the customer "Explore" screen show the same
// picture. The 08A/08B/08E exports embed the same four photos (checked visually: breakfast
// table, coffee with a croissant, dinner for two, iced coffee with orange juice), so nothing is
// extracted from them.
// Run from admin/ with: node scripts/copy-moment-images.mjs
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webImages = path.resolve(root, "..", "web", "public", "images", "moments");
const outDir = path.join(root, "public", "images", "moments");

/** Covers the admin catalogue (`CONSUMPTION_MOMENTS` in `src/mocks/service-day/catalog.ts`) uses. */
const PHOTOS = ["para-desayunar.webp", "para-merendar.webp", "para-cenar.webp", "para-tomar.webp"];

await mkdir(outDir, { recursive: true });
for (const file of PHOTOS) {
  await copyFile(path.join(webImages, file), path.join(outDir, file));
  console.log(`copied ${file}`);
}
