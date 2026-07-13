// scripts/encode-hero.mjs
//
//   node scripts/encode-hero.mjs            # check the committed file
//   node scripts/encode-hero.mjs --write    # re-encode public/hero.mp4 in place
//
// Re-encodes the hero background loop and REFUSES to write the result unless it
// clears a measured quality bar. "Make it smaller" is easy; "make it smaller
// without anyone noticing" needs a number, so we compute SSIM against the
// current file and abort below the threshold.
//
// Why these settings, measured on the 2026-07-10 source (1280x720, 24fps, 8s):
//
//   preset      size     SSIM(All)
//   slow crf24  1398 KB  0.98795
//   slow crf26  1098 KB  0.98548
//   veryslow24  1298 KB  0.98794   <- chosen: same SSIM as slow, 100 KB less
//   vp9 crf33    987 KB  0.96127   <- rejected: visibly worse for the size
//
// The `-an` matters more than any of that: the source carried a 139 kb/s AAC
// track, and the <video> element is `muted`. Roughly 139 KB of audio nobody
// could ever hear.

import { execFileSync, spawnSync } from 'node:child_process';
import { statSync, renameSync, copyFileSync, existsSync, unlinkSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const SOURCE = 'public/hero.mp4';
const TEMP = 'public/hero.encoding.mp4';

/** Below this, a viewer can start to see the difference. Do not lower it. */
const MIN_SSIM = 0.985;

const ARGS = [
  '-an',                    // the <video> is muted; the audio track is dead weight
  '-c:v', 'libx264',
  '-preset', 'veryslow',    // encode time is free; every visitor pays for bytes
  '-crf', '24',
  '-profile:v', 'high',
  '-pix_fmt', 'yuv420p',    // Safari refuses anything else
  '-movflags', '+faststart', // moov atom first, so playback starts before the download finishes
  '-g', '48',               // keyframe every 2s at 24fps — it is a short loop
];

const kb = (p) => Math.round(statSync(p).size / 1024);

function run(args) {
  return execFileSync(ffmpeg, ['-hide_banner', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * Structural similarity of `candidate` against `reference`, 0..1.
 * The ssim filter reports on STDERR, so both streams have to be read.
 */
function ssim(candidate, reference) {
  const r = spawnSync(
    ffmpeg,
    ['-hide_banner', '-i', candidate, '-i', reference, '-lavfi', 'ssim', '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const matches = [...out.matchAll(/All:([0-9.]+)/g)];
  if (matches.length === 0) throw new Error('could not read SSIM from ffmpeg output');
  return Number(matches[matches.length - 1][1]); // the summary line, printed last
}

const write = process.argv.includes('--write');

if (!existsSync(SOURCE)) {
  console.error(`${SOURCE} not found.`);
  process.exit(1);
}

const before = kb(SOURCE);
console.log(`source: ${before} KB`);

run(['-y', '-loglevel', 'error', '-i', SOURCE, ...ARGS, TEMP]);

const after = kb(TEMP);
const score = ssim(TEMP, SOURCE);
const saved = Math.round(((before - after) / before) * 100);

console.log(`encoded: ${after} KB (${saved}% smaller)`);
console.log(`SSIM: ${score.toFixed(5)} (floor ${MIN_SSIM})`);

if (score < MIN_SSIM) {
  unlinkSync(TEMP);
  console.error(`\nREFUSED: quality below the floor. Nothing was written.`);
  process.exit(1);
}

if (after >= before) {
  unlinkSync(TEMP);
  console.error(`\nREFUSED: the re-encode is not smaller. Nothing was written.`);
  process.exit(1);
}

if (!write) {
  unlinkSync(TEMP);
  console.log('\nDry run. Pass --write to replace public/hero.mp4.');
  process.exit(0);
}

copyFileSync(SOURCE, 'public/hero.original.mp4');
renameSync(TEMP, SOURCE);
console.log(`\nWrote ${SOURCE}. Original kept at public/hero.original.mp4 — delete it once you have looked.`);
