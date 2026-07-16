// lib/server/photoStore.ts
//
// SERVER-ONLY. Takes a companion's portrait and produces the only two images the
// product is ever allowed to serve: the real one, and one that has been
// destroyed at the source.
//
// WHY THIS EXISTS
//
// A pass buys the right to see a companion's face. So the locked card has to
// withhold that face from someone who has not paid — and CSS blur does not
// withhold anything, because the sharp bytes are in the network tab either way.
//
// The previous answer was `blurredPhoto()`, which appended `?blur=400` to an
// Unsplash URL and asked Unsplash to do the destroying. That worked for exactly
// as long as every portrait was Unsplash stock of a stranger. It cannot work for
// a real companion, because:
//
//   * their photo does not live on images.unsplash.com, so the parameters do
//     nothing and the function had to fail closed and serve no photo at all;
//   * next.config.ts only permits images.unsplash.com, so next/image answered
//     400 and the card rendered a broken image even when unlocked;
//   * nothing stored the photo anyway — the applicant's upload was hashed and
//     thrown away, and an admin had to find a URL and paste it by hand.
//
// Three symptoms, one cause: nobody owned the image. Now we do. We blur it
// ourselves with sharp, at ingest, once, and store both results. The blurred
// variant is a genuinely different file — there is no sharpening it back, and no
// host we depend on to keep a promise.

import { put } from '@vercel/blob';
import sharp from 'sharp';
import { envValue } from '@/lib/env';

/**
 * The locked portrait, tuned to withhold identity while still promising a
 * person: warm tones, a silhouette, a café behind them.
 *
 * `w=64, blur=1000` (the old parameters) was certainly unrecognisable and also a
 * grey slab, which is a terrible thing to ask someone to pay to see behind.
 * 220px with a heavy Gaussian is the balance: at this radius no facial geometry
 * survives — there is nothing left to sharpen back — but shape and colour do.
 */
const LOCKED_WIDTH = 220;
const LOCKED_SIGMA = 18; // Gaussian sigma at 220px. Comparable to Unsplash blur=400.
const LOCKED_QUALITY = 45;

/** The stored original. Cards request w=640; anything beyond 1200 is waste. */
const FULL_WIDTH = 1200;
const FULL_QUALITY = 82;

export interface StoredPhoto {
  /** The real portrait. NEVER sent to a viewer without an active pass. */
  url: string;
  /** The destroyed one. Safe to serve to anybody. */
  blurUrl: string;
}

/** True when a blob store is wired up (BLOB_READ_WRITE_TOKEN). */
export function photoStoreConfigured(): boolean {
  return !!envValue('BLOB_READ_WRITE_TOKEN');
}

/**
 * Normalise, blur, and store both variants.
 *
 * `key` is a stable, caller-chosen prefix (a companion id, an application id).
 * Both blobs are written under it with `addRandomSuffix`, so re-ingesting a
 * photo never silently overwrites the previous one — a companion who changes
 * their picture must not have the old URL start resolving to the new face while
 * caches still hold the old one.
 *
 * EXIF is stripped by sharp's default pipeline (we never pass `withMetadata`),
 * which matters: a phone photo carries GPS, and a companion's home coordinates
 * are exactly what this product must not publish.
 */
/**
 * The two variants, as bytes. Pure: no network, no storage, no config.
 *
 * Separated from storePhoto so the thing that actually protects a companion's
 * face — the blur — can be tested against real image bytes without a blob token.
 * An untested blur is a promise, not a paywall.
 */
export async function renderVariants(
  input: Buffer | Uint8Array,
): Promise<{ full: Buffer; blurred: Buffer }> {
  const src = Buffer.isBuffer(input) ? input : Buffer.from(input);

  // rotate() applies the EXIF orientation and then drops it, so a portrait shot
  // on a phone is not served on its side. Everything else about the metadata
  // goes with it — a phone photo carries GPS, and a companion's home
  // coordinates are exactly what this product must not publish.
  const full = await sharp(src)
    .rotate()
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: FULL_QUALITY, mozjpeg: true })
    .toBuffer();

  // The blur is applied AFTER the downscale, so the small image is what gets
  // destroyed — there is no high-frequency detail hiding underneath it.
  const blurred = await sharp(src)
    .rotate()
    .resize({ width: LOCKED_WIDTH, withoutEnlargement: true })
    .blur(LOCKED_SIGMA)
    .jpeg({ quality: LOCKED_QUALITY, mozjpeg: true })
    .toBuffer();

  return { full, blurred };
}

export async function storePhoto(input: Buffer | Uint8Array, key: string): Promise<StoredPhoto> {
  if (!photoStoreConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set — cannot store a photo.');
  }

  const { full, blurred } = await renderVariants(input);

  const [a, b] = await Promise.all([
    put(`companions/${key}.jpg`, full, { access: 'public', contentType: 'image/jpeg' }),
    put(`companions/${key}-locked.jpg`, blurred, { access: 'public', contentType: 'image/jpeg' }),
  ]);

  return { url: a.url, blurUrl: b.url };
}

/**
 * Fetch a photo from a URL and store both variants.
 *
 * This is the admin path: an operator pastes a link to the picture a companion
 * sent them, and it is ingested onto our own storage rather than hotlinked. A
 * hotlinked portrait is a face we cannot blur and a URL somebody else can
 * repoint.
 *
 * Guards, because the URL comes from a form and is fetched by our server:
 *   * https only — no file://, no http.
 *   * A size cap enforced on the BODY, not on Content-Length, which a hostile
 *     server can simply lie about.
 *   * sharp will reject anything that is not really an image.
 *
 * It does not resolve DNS or block private ranges, so this is not a defence
 * against SSRF by a hostile admin — the caller is already authenticated as an
 * operator with database write access, so that is not the boundary being
 * defended here.
 */
const MAX_FETCH_BYTES = 12 * 1024 * 1024;

export async function storePhotoFromUrl(rawUrl: string, key: string): Promise<StoredPhoto> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('That is not a valid URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('The photo URL must be https.');
  }

  const res = await fetch(parsed.toString(), { redirect: 'follow' });
  if (!res.ok) throw new Error(`Could not fetch that photo (${res.status}).`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_FETCH_BYTES) {
    throw new Error('That photo is too large (12 MB max).');
  }
  if (buf.byteLength === 0) throw new Error('That URL returned an empty file.');

  return storePhoto(buf, key);
}
