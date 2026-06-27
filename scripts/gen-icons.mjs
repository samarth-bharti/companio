// scripts/gen-icons.mjs
//
// Regenerates the brand PNG assets in public/ from code, so they are
// deterministic and reviewable. Run with:  node scripts/gen-icons.mjs
//
// Uses next/og (bundled with Next, no extra dependency). The committed PNGs are
// what ship; this script just lets us re-render them if the brand changes.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

// next/og only exposes a CommonJS entry; load it through the CJS resolver.
const require = createRequire(import.meta.url);
const { ImageResponse } = require('next/og');
const { createElement: h } = require('react');

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const AZURE = '#2E6BFF';
const VIOLET = '#6B46C1';

// Full-bleed gradient field with a centred "C" — content sits inside the
// maskable safe zone (~60% of the square) so any launcher mask looks intentional.
function mark(size) {
  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${AZURE} 0%, ${VIOLET} 100%)`,
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          fontSize: Math.round(size * 0.56),
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1,
          marginTop: -Math.round(size * 0.04),
        },
      },
      'C',
    ),
  );
}

// 1200×630 social card: wordmark + tagline on the brand gradient.
function ogCard() {
  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
        background: `linear-gradient(135deg, ${AZURE} 0%, ${VIOLET} 100%)`,
        color: '#FFFFFF',
        fontFamily: 'sans-serif',
      },
    },
    h('div', { style: { display: 'flex', fontSize: 96, fontWeight: 800, letterSpacing: -2 } }, 'Companio'),
    h(
      'div',
      { style: { display: 'flex', fontSize: 40, marginTop: 24, opacity: 0.95 } },
      'Trusted. Verified. Companionship.',
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          marginTop: 40,
          fontSize: 26,
          padding: '10px 24px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.18)',
        },
      },
      'Strictly platonic · ID-verified · Always safe',
    ),
  );
}

async function render(element, width, height) {
  const res = new ImageResponse(element, { width, height });
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const targets = [
    ['icon-192.png', mark(192), 192, 192],
    ['icon-512.png', mark(512), 512, 512],
    ['apple-icon.png', mark(180), 180, 180],
    ['og.png', ogCard(), 1200, 630],
  ];
  for (const [name, el, w, hgt] of targets) {
    const buf = await render(el, w, hgt);
    await writeFile(join(PUBLIC, name), buf);
    console.log(`wrote public/${name} (${buf.length} bytes, ${w}x${hgt})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
