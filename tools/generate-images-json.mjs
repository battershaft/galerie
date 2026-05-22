import fs from "node:fs";
import path from "node:path";

const IMAGES_DIR = "assets/images";
const THUMBS_DIR = "assets/thumbs"; // optional
const OUT_FILE = "data/images.json";

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
}

function hasThumb(fileName) {
  return fs.existsSync(path.join(THUMBS_DIR, fileName));
}

function baseTitle(fileName) {
  // Title from filename without extension; keep it simple & predictable.
  return path.parse(fileName).name;
}

function naturalSort(a, b) {
  return a.localeCompare(b, "de", { numeric: true, sensitivity: "base" });
}

function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Missing folder: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = listFiles(IMAGES_DIR)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    .sort(naturalSort);

  const images = files.map((f) => {
    const item = {
      src: `${IMAGES_DIR}/${f}`,
      title: baseTitle(f),
      tags: [],
    };
    if (hasThumb(f)) {
      item.thumb = `${THUMBS_DIR}/${f}`;
    }
    return item;
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ images }, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUT_FILE} with ${images.length} images.`);
}

main();
