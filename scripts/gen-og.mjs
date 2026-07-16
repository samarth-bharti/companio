// scripts/gen-og.mjs
//
// Regenerates the 1200×630 social card in public/og.png. Run with:
//   node scripts/gen-og.mjs
//
// SEPARATE FROM gen-icons.mjs ON PURPOSE.
//
// The icons are rendered with sharp (the brand mark is a conic gradient, which
// satori cannot draw). This card is rendered with next/og, which is the right
// tool for a text layout on a linear gradient. Loading both in one process
// throws "colourspace: parameter space not set" out of libvips, so they stay in
// separate processes rather than one of them being written with the wrong tool.

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

const res = new ImageResponse(ogCard(), { width: 1200, height: 630 });
await writeFile(join(PUBLIC, 'og.png'), Buffer.from(await res.arrayBuffer()));
console.log('Wrote public/og.png');
