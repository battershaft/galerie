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

function looksLikeImage(name) {
  const ext = path.extname(name).toLowerCase();
  if (!exts.has(ext)) return false;
  // avoid accidentally indexing common repo/social images if present
  const lower = name.toLowerCase();
  if (lower === "favicon.ico") return false;
  return true;
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
  // Prefer assets/images ONLY if it contains at least one supported image.
  // Otherwise fall back to repo root (common when users upload images into root via Web UI).
  let useDir = ROOT_FALLBACK_DIR;
  if (fs.existsSync(IMAGES_DIR)) {
    const inAssets = listFiles(IMAGES_DIR).filter((f) => looksLikeImage(f));
    if (inAssets.length > 0) useDir = IMAGES_DIR;
  }

  const files = listFiles(useDir)
    .filter((f) => looksLikeImage(f))
    .sort(naturalSort);

  console.log(`Using directory: ${useDir}`);
  console.log(`Found ${files.length} image files.`);
  if (useDir === ".") {
    // Helpful debug if root fallback is used
    console.log("Root files (first 50):", listFiles(".").slice(0, 50));
  }

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
