import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { renderVariants } from '@/lib/server/photoStore';

// The blur IS the paywall. A pass buys the right to see a companion's face, so
// the locked variant has to genuinely destroy it — not be a CSS filter over the
// sharp bytes, and not be a query parameter we hope somebody else's CDN honours.
//
// These run the real sharp pipeline over real image bytes. Nothing is mocked,
// because a mocked blur proves nothing about whether a face survived.

/**
 * A synthetic "portrait": a fine checkerboard.
 *
 * A real face is high-frequency detail everywhere — that is precisely what a
 * blur has to remove and what a downscale-then-upscale attack would try to
 * recover. A checkerboard is the densest possible version of that, so it is a
 * harsher test than a photograph. (A single large rectangle is not: it averages
 * out to near-zero edge energy across the canvas and would pass trivially.)
 */
async function portrait(width = 1000, height = 1400): Promise<Buffer> {
  const cell = 4;
  const px = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const on = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
      const i = (y * width + x) * 3;
      px[i] = on ? 245 : 15;
      px[i + 1] = on ? 240 : 20;
      px[i + 2] = on ? 235 : 60;
    }
  }
  return sharp(px, { raw: { width, height, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
}

/**
 * Edge energy: mean absolute difference between neighbouring pixels. High for a
 * crisp image, near-zero once the detail is gone. This is the closest cheap
 * proxy for "is there still a recognisable face in here".
 */
async function edgeEnergy(buf: Buffer): Promise<number> {
  const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let n = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 1; x < info.width; x++) {
      sum += Math.abs(data[y * info.width + x] - data[y * info.width + x - 1]);
      n++;
    }
  }
  return sum / n;
}

describe('renderVariants — the locked photo is actually destroyed', () => {
  it('produces a locked variant with almost no edge detail left', async () => {
    const src = await portrait();
    const { blurred } = await renderVariants(src);

    const before = await edgeEnergy(src);
    const after = await edgeEnergy(blurred);

    // The source is dense detail. The locked variant must be a smear: an order
    // of magnitude less edge energy, and near-flat in absolute terms.
    expect(before).toBeGreaterThan(40);
    expect(after).toBeLessThan(before / 10);
    expect(after).toBeLessThan(5);
  }, 20_000);

  it('downscales the locked variant to 220px, so there is nothing to sharpen back', async () => {
    const { blurred } = await renderVariants(await portrait());
    const meta = await sharp(blurred).metadata();
    expect(meta.width).toBe(220);
  }, 20_000);

  /**
   * The comment in photoStore.ts claims "there is nothing to sharpen back".
   * Worth proving rather than asserting: an attacker with the locked JPEG will
   * try exactly this — upscale it to the original dimensions and sharpen hard.
   */
  it('does not give the detail back when upscaled and sharpened', async () => {
    const src = await portrait();
    const { blurred } = await renderVariants(src);

    const attacked = await sharp(blurred)
      .resize({ width: 1000, height: 1400, fit: 'fill', kernel: 'lanczos3' })
      .sharpen({ sigma: 4 })
      .jpeg({ quality: 100 })
      .toBuffer();

    // Sharpening amplifies whatever is left, so this is allowed to rise a
    // little. What it must not do is approach the real photo.
    expect(await edgeEnergy(attacked)).toBeLessThan((await edgeEnergy(src)) / 5);
  }, 20_000);

  it('keeps the full variant sharp and within 1200px', async () => {
    const src = await portrait(2400, 3000);
    const { full } = await renderVariants(src);
    const meta = await sharp(full).metadata();
    expect(meta.width).toBe(1200);
    // Still a real photo — the detail survives here, which is what a pass buys.
    expect(await edgeEnergy(full)).toBeGreaterThan(20);
  }, 20_000);

  it('never enlarges a small portrait into a blurry mess', async () => {
    const { full } = await renderVariants(await portrait(300, 400));
    expect((await sharp(full).metadata()).width).toBe(300);
  }, 20_000);

  it('strips EXIF, including any GPS the phone recorded', async () => {
    // A companion's home coordinates are exactly what must not be published.
    const withExif = await sharp(await portrait())
      .withMetadata({ exif: { IFD0: { Copyright: 'companio-test' } } })
      .jpeg()
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const { full, blurred } = await renderVariants(withExif);
    expect((await sharp(full).metadata()).exif).toBeUndefined();
    expect((await sharp(blurred).metadata()).exif).toBeUndefined();
  }, 20_000);

  it('normalises to jpeg, so a PNG portrait cannot smuggle anything through', async () => {
    const png = await sharp({
      create: { width: 600, height: 800, channels: 3, background: { r: 10, g: 200, b: 10 } },
    }).png().toBuffer();
    const { full, blurred } = await renderVariants(png);
    expect((await sharp(full).metadata()).format).toBe('jpeg');
    expect((await sharp(blurred).metadata()).format).toBe('jpeg');
  }, 20_000);

  it('rejects bytes that are not an image at all', async () => {
    await expect(renderVariants(Buffer.from('this is not a photo'))).rejects.toThrow();
  }, 20_000);
});
