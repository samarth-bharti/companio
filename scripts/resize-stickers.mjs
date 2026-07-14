// scripts/resize-stickers.mjs
//
// Three of the twelve cursor stickers shipped as their original camera-resolution
// exports — books.png at 4226×2817 (2.6 MB), camera.png at 3159×2865 (3.8 MB),
// cake.png at 1300×975 (1.6 MB) — while the other nine were already 256×256 and
// ~35 KB each. They are drawn at about 120 px on screen. That is 8 MB of PNG to
// paint a thumbnail.
//
// Resizes anything oversized in public/stickers to the 256×256 the rest already
// use, preserving aspect ratio and transparency. Idempotent: files already at or
// under the target are left alone.
//
//   node scripts/resize-stickers.mjs

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'public/stickers';
const TARGET = 256;

const files = (await readdir(DIR)).filter((f) => f.endsWith('.png'));
let saved = 0;

for (const file of files) {
  const full = path.join(DIR, file);
  const before = (await stat(full)).size;
  const meta = await sharp(full).metadata();

  if (meta.width <= TARGET && meta.height <= TARGET) {
    console.log(`skip   ${file.padEnd(14)} ${meta.width}×${meta.height} already small`);
    continue;
  }

  // `contain` on a transparent canvas, so a wide sticker keeps its shape and
  // still drops into the same square box the other nine occupy.
  const out = await sharp(full)
    .resize(TARGET, TARGET, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await sharp(out).toFile(full);

  const after = (await stat(full)).size;
  saved += before - after;
  console.log(
    `resize ${file.padEnd(14)} ${meta.width}×${meta.height} → ${TARGET}×${TARGET}   ` +
      `${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024).toFixed(0)} KB`,
  );
}

console.log(`\nsaved ${(saved / 1024 / 1024).toFixed(2)} MB`);
