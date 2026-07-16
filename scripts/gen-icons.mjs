// scripts/gen-icons.mjs
//
// Regenerates every brand asset from code, so they are deterministic,
// reviewable, and — the part that kept going wrong — actually the mark the site
// renders. Run with:  node scripts/gen-icons.mjs
//
// WHAT THE ICON IS
//
// The Seal (components/ui/Seal.tsx): a circle filled with
//   conic-gradient(from 210deg, #7A4FE0, #4F7AE0, #FFB23E, #7A4FE0)
// carrying a white filled heart. That is the logo in the nav, so it is the logo
// in the tab.
//
// WHAT IT USED TO BE, AND WHY THAT WAS WRONG
//
// This script drew a white "C" on a 135° LINEAR gradient. Nobody had ever seen
// that mark — the site has never shown a "C", and its gradient is conic.
// Meanwhile app/favicon.ico was still the 25,931-byte icon create-next-app
// ships, so every tab, bookmark and history entry showed the Next.js logo on a
// product that is not Next.js.
//
// WHY THE ICON IS NOT next/og
//
// Satori (which powers next/og) has no conic-gradient. Approximating the brand's
// own gradient with a linear one is how you get a logo that is nearly right,
// which is worse than one that is obviously wrong. sharp is already a dependency
// (lib/server/photoStore.ts) and a conic sweep is a few lines of arithmetic, so
// the gradient below is the exact one from globals.css.
//
// The OG card lives in scripts/gen-og.mjs and still uses next/og — a text layout
// on a linear gradient is exactly what satori is good at. It is a SEPARATE
// PROCESS because loading sharp and @vercel/og together throws
// "colourspace: parameter space not set" out of libvips. Two scripts, two
// renderers, no shared native state.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const APP = join(ROOT, 'app');

// ── The Seal ────────────────────────────────────────────────────────────────
// --grad-seal, verbatim from app/globals.css:
//   conic-gradient(from 210deg, #7A4FE0, #4F7AE0, #FFB23E, #7A4FE0)
const FROM_DEG = 210;
const STOPS = [
  { at: 0, rgb: [0x7a, 0x4f, 0xe0] },
  { at: 1 / 3, rgb: [0x4f, 0x7a, 0xe0] },
  { at: 2 / 3, rgb: [0xff, 0xb2, 0x3e] },
  { at: 1, rgb: [0x7a, 0x4f, 0xe0] },
];

/** Colour at position `t` (0..1) around the sweep. */
function sample(t) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (t >= a.at && t <= b.at) {
      const k = (t - a.at) / (b.at - a.at);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * k),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * k),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * k),
      ];
    }
  }
  return STOPS[STOPS.length - 1].rgb;
}

/**
 * The gradient field as raw RGBA.
 *
 * Supersampled 4×: without it a 16px favicon has a visibly jagged rim, and 16px
 * is exactly the size where people notice. `maskable` fills the square
 * edge-to-edge instead of drawing a circle — Android crops adaptive icons to its
 * own shape, and a circle inside that crop reads as a mistake.
 */
function field(size, { maskable = false } = {}) {
  const ss = 4;
  const n = size * ss;
  const c = (n - 1) / 2;
  const r = n / 2;
  const px = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, covered = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const dx = x * ss + sx - c;
          const dy = y * ss + sy - c;
          if (!maskable && Math.hypot(dx, dy) > r) continue;
          // CSS angles run clockwise from north; screen y grows downward.
          const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
          const t = ((((deg - FROM_DEG) % 360) + 360) % 360) / 360;
          const [cr, cg, cb] = sample(t);
          R += cr; G += cg; B += cb; covered++;
        }
      }
      const i = (y * size + x) * 4;
      if (covered === 0) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
      // Average colour over COVERED samples only, so a partially covered rim
      // pixel keeps full-strength colour and only its alpha falls off.
      px[i] = Math.round(R / covered);
      px[i + 1] = Math.round(G / covered);
      px[i + 2] = Math.round(B / covered);
      px[i + 3] = Math.round((covered / (ss * ss)) * 255);
    }
  }
  return sharp(px, { raw: { width: size, height: size, channels: 4 } });
}

/** Lucide's `heart`, filled — the same icon Seal.tsx renders. */
const HEART_PATH =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

function heartSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">` +
      `<path d="${HEART_PATH}" fill="#FFFFFF"/></svg>`,
  );
}

/**
 * The full mark: gradient field + centred white heart.
 *
 * The nav draws the heart at 0.38 of the seal. An icon is seen at 16px in a tab,
 * not 32px on a landing page, so the heart is scaled up until it survives that:
 * at 0.38 of 16px it is a smudge. Maskable icons stay smaller, inside the ~60%
 * safe zone, or a launcher's crop eats it.
 */
async function mark(size, { maskable = false } = {}) {
  const heart = Math.round(size * (maskable ? 0.42 : 0.54));
  const h = await sharp(heartSvg(heart)).png().toBuffer();
  return field(size, { maskable })
    .composite([{ input: h, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * A real .ico: 16/32/48, each stored as a PNG inside the container.
 *
 * Every browser that matters has accepted PNG-in-ICO since IE11, so we never
 * touch BMP/DIB packing. sharp has no .ico writer; the container is a 6-byte
 * header plus a 16-byte entry per image, which is easier to write than to take a
 * dependency for.
 */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  const blobs = [];
  let offset = 6 + pngs.length * 16;

  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 encodes 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);     // palette entries
    e.writeUInt8(0, 3);     // reserved
    e.writeUInt16LE(1, 4);  // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    blobs.push(data);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...blobs]);
}

async function main() {
  // The tab icon. 48 is included because the Windows taskbar and some bookmark
  // bars reach for it, and upscaling 32 looks soft.
  const pngs = [];
  for (const size of [16, 32, 48]) pngs.push({ size, data: await mark(size) });
  // Next emits this from the file convention, content-hashed, as
  // <link rel="icon" sizes="48x48">. An app/icon.png alongside it is NOT
  // emitted — Next prefers favicon.ico when both exist — so there is no PNG
  // tab icon here on purpose. The three PNG-in-ICO sizes cover every tab,
  // bookmark bar and taskbar that asks.
  await writeFile(join(APP, 'favicon.ico'), ico(pngs));

  await writeFile(join(PUBLIC, 'apple-icon.png'), await mark(180));
  // Maskable: full-bleed, heart inside the safe zone.
  await writeFile(join(PUBLIC, 'icon-192.png'), await mark(192, { maskable: true }));
  await writeFile(join(PUBLIC, 'icon-512.png'), await mark(512, { maskable: true }));
  // "any": the round seal, for launchers that apply no mask.
  await writeFile(join(PUBLIC, 'icon-any-512.png'), await mark(512));

  console.log('Wrote app/favicon.ico (16/32/48), apple-icon.png, icon-192/512.png, icon-any-512.png');
  console.log('The OG card is scripts/gen-og.mjs — a separate process on purpose.');
}

await main();
