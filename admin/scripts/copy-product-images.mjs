// One-off: copies the product photos of the customer app (web/public/images/products) into
// public/images/products, so both apps show the same picture for the same product.
//
// The 07A export embeds photos too, but they are copy-paste leftovers that do not depict their
// rows ("Tostón de palta" shows a croissant, "Hamburguesa clásica" a coffee-and-toast table,
// "Cheesecake" a toast with jam, "Limonada" a croissant), so they are not extracted: products
// without a matching photo render the neutral placeholder of the admin instead.
// Run from admin/ with: node scripts/copy-product-images.mjs
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webImages = path.resolve(root, "..", "web", "public", "images", "products");
const outDir = path.join(root, "public", "images", "products");

/** Photos the admin catalogue (`src/mocks/service-day/catalog.ts`) references. */
const PHOTOS = [
  "cappuccino.webp",
  "medialunas.webp",
  "tostado-jamon-queso.webp",
  "tostadas-de-campo.webp",
  "combo-central.webp",
];

await mkdir(outDir, { recursive: true });
for (const file of PHOTOS) {
  await copyFile(path.join(webImages, file), path.join(outDir, file));
  console.log(`copied ${file}`);
}
