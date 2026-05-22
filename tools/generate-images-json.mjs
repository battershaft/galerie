import fs from "node:fs";
import path from "node:path";

const IMAGES_DIR = "assets/images"; // preferred
const THUMBS_DIR = "assets/thumbs"; // optional

// Fallback: if images were uploaded into repo root, use that.
// (We still only pick image extensions.)
const ROOT_FALLBACK_DIR = ".";
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
  // Allow either assets/images (preferred) OR repo root fallback.
  // This keeps the workflow working even if images were uploaded into the root.
  const useDir = fs.existsSync(IMAGES_DIR) ? IMAGES_DIR : ROOT_FALLBACK_DIR;

  const files = listFiles(useDir)
    .filter((f) => exts.has(path.extname(f).toLowerCase()))
    // avoid accidentally indexing repo files like README images? still only image extensions.
    .sort(naturalSort);

  const images = files.map((f) => {
    const src = useDir === "." ? f : `${useDir}/${f}`;
    const item = {
      src,
      title: baseTitle(f),
      tags: [],
    };
    if (useDir !== "." && hasThumb(f)) {
      item.thumb = `${THUMBS_DIR}/${f}`;
    }
    return item;
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ images }, null, 2) + "\n", "utf8");

  console.log(`Wrote ${OUT_FILE} with ${images.length} images.`);
}

main();
