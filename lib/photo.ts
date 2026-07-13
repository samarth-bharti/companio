// lib/photo.ts
//
// The blurred variant of a locked companion's portrait.
//
// Shared by the server (which decides what a locked viewer is allowed to fetch)
// and the locked card (which renders it). One implementation, so the card cannot
// ask for a sharper image than the paywall intends to serve — and, because it
// rebuilds the query from scratch, applying it twice is the same as applying it
// once.

/**
 * A face, blurred at the source.
 *
 * The locked card used to CSS-blur the full-resolution photo, which hides a face
 * from a person and from nobody else: the sharp image is right there in the
 * network tab. This asks Unsplash for an image that is already destroyed.
 *
 * GO-LIVE: owned photography will not live on images.unsplash.com and these
 * query parameters will silently do nothing. Real photos need a pre-blurred
 * derivative (or an image proxy) before a locked profile can be trusted with a
 * face. Until then this is only as strong as the host.
 */
/**
 * Two things have to be true at once, and the old parameters only managed one.
 *
 * `w=64&blur=1000` reduced the portrait to a 64px smear and then blurred that
 * into a single flat colour. It was certainly unrecognisable — and it was also
 * a grey slab, which is a terrible thing to ask someone to pay ₹199 to see
 * behind. A locked card has to withhold the person's identity while still
 * promising that a person is there: warm skin tones, a silhouette, a café behind
 * them. That is the difference between a paywall and a broken image.
 *
 * 220px wide with a heavy Gaussian is the balance: at that radius no facial
 * geometry survives (there is nothing to sharpen back), but the shape, the
 * colour and the setting do.
 */
const LOCKED = { w: 220, q: 45, blur: 400 } as const;

export function blurredPhoto(url: string): string {
  if (!url.includes('images.unsplash.com')) return url;
  const [base] = url.split('?');
  return `${base}?w=${LOCKED.w}&q=${LOCKED.q}&blur=${LOCKED.blur}`;
}
