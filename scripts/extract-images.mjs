// Extracts the base64 photos embedded in the Pencil exports, names them after the
// product/moment layer they belong to, and writes compressed WebP files to
// public/images. Run with: node scripts/extract-images.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportsDir = path.join(root, "exports");
const outDir = path.join(root, "public", "images");

const SOURCES = [
  "02 · Inicio del menú · Café Central-export.html",
  "02B · Explore Landing — Consumption Moments-export.html",
  "02B · Explore Results — Para desayunar-export.html",
  "03 · Detalle del producto · Cappuccino-export.html",
  "04 · Mi pedido · Café Central-export.html",
];

/** Layer name prefix -> output kind. */
const KINDS = {
  Producto: "products",
  "Ítem": "products",
  Hero: "hero",
  Momento: "moments",
};

/** Normalized layer names that should map to a shorter, stable slug. */
const SLUG_ALIASES = {
  "medialunas-de-manteca": "medialunas",
  "croissant-de-manteca": "croissant",
  "tostado-de-jamon-y-queso": "tostado-jamon-queso",
};

const WIDTHS = { products: 600, hero: 900, moments: 900 };
const QUALITY = 75;
const CONTEXT_WINDOW = 4000;

function slugify(name) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return SLUG_ALIASES[base] ?? base;
}

/** Finds the closest preceding layer named "<Kind> · <Name>". */
function findOwner(html, index) {
  const before = html.slice(Math.max(0, index - CONTEXT_WINDOW), index);
  const names = [...before.matchAll(/data-pencil-name="([^"]+)"/g)].map((m) => m[1]);
  for (const layer of names.reverse()) {
    const [prefix, ...rest] = layer.split(" · ");
    if (KINDS[prefix] && rest.length > 0) {
      return { kind: KINDS[prefix], slug: slugify(rest.join(" ")) };
    }
  }
  return null;
}

async function collectImages() {
  /** key -> { kind, slug, buffer } keeping the largest (highest quality) source. */
  const images = new Map();
  for (const file of SOURCES) {
    const html = await readFile(path.join(exportsDir, file), "utf8");
    for (const match of html.matchAll(/data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/=]+)/g)) {
      const owner = findOwner(html, match.index);
      if (!owner) {
        console.warn(`skip: unnamed image in ${file}`);
        continue;
      }
      const buffer = Buffer.from(match[1], "base64");
      const key = `${owner.kind}/${owner.slug}`;
      const current = images.get(key);
      if (!current || current.buffer.length < buffer.length) {
        images.set(key, { ...owner, buffer });
      }
    }
  }
  return [...images.values()];
}

function outputPath({ kind, slug }) {
  if (kind === "hero") return path.join(outDir, "products", `${slug}-hero.webp`);
  return path.join(outDir, kind, `${slug}.webp`);
}

async function main() {
  const images = await collectImages();
  for (const image of images) {
    const target = outputPath(image);
    await mkdir(path.dirname(target), { recursive: true });
    const data = await sharp(image.buffer)
      .resize({ width: WIDTHS[image.kind], withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    await writeFile(target, data);
    const relative = path.relative(root, target).split(path.sep).join("/");
    console.log(`${relative} ${Math.round(data.length / 1024)}KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
