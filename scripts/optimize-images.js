/**
 * Phase K.3 — Asset optimization script
 * Converts large PNGs in public/images/ to WebP with responsive sizes.
 * Run with: node scripts/optimize-images.js
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC_DIR = "public/images";
const OUT_DIR = "public/images/webp";

// Responsive breakpoint widths (in CSS px). sharp will downscale source images
// to each width while preserving aspect ratio.
const BREAKPOINTS = [300, 600, 900, 1200];

const QUALITY = 82;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();

  console.log(`Found ${files.length} PNG(s) in ${SRC_DIR}`);

  const results = [];
  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file);
    const name = path.parse(file).name;
    const metadata = await sharp(srcPath).metadata();
    const srcSize = (await fs.promises.stat(srcPath)).size;

    const variants = [];
    for (const w of BREAKPOINTS) {
      // Don't upscale: cap output width at source width.
      const targetWidth = Math.min(w, metadata.width || w);
      const outName = `${name}-${targetWidth}w.webp`;
      const outPath = path.join(OUT_DIR, outName);
      await sharp(srcPath)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);
      const outSize = (await fs.promises.stat(outPath)).size;
      variants.push({ width: targetWidth, file: outName, bytes: outSize });
    }

    const totalOut = variants.reduce((a, v) => a + v.bytes, 0);
    results.push({
      file,
      srcBytes: srcSize,
      srcWidth: metadata.width,
      variants,
      savingsPercent: ((1 - totalOut / srcSize) * 100).toFixed(1),
    });
  }

  console.log("\n=== Optimization results ===");
  for (const r of results) {
    console.log(
      `${r.file} (${r.srcWidth}px, ${(r.srcBytes / 1024 / 1024).toFixed(2)} MB)`
    );
    for (const v of r.variants) {
      console.log(
        `  ${v.file}: ${(v.bytes / 1024).toFixed(1)} KB (${v.width}w)`
      );
    }
    console.log(`  total WebP: ${(r.variants.reduce((a, v) => a + v.bytes, 0) / 1024 / 1024).toFixed(2)} MB  →  ${r.savingsPercent}% smaller than source`);
  }

  console.log("\nDone. WebP variants written to public/images/webp/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
