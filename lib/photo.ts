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
 * Hosts that will destroy an image for us, given the right query parameters.
 *
 * This is an ALLOWLIST, and it is the whole security model of the locked card.
 * Anything not named here cannot be blurred at the source, so it is not served
 * at all (see below).
 */
const BLURRING_HOSTS = ['images.unsplash.com'] as const;

/**
 * Two things have to be true at once, and the old parameters only managed one.
 *
 * `w=64&blur=1000` reduced the portrait to a 64px smear and then blurred that
 * into a single flat colour. It was certainly unrecognisable — and it was also
 * a grey slab, which is a terrible thing to ask someone to pay to see behind. A
 * locked card has to withhold the person's identity while still promising that a
 * person is there: warm skin tones, a silhouette, a café behind them. That is the
 * difference between a paywall and a broken image.
 *
 * 220px wide with a heavy Gaussian is the balance: at that radius no facial
 * geometry survives (there is nothing to sharpen back), but the shape, the
 * colour and the setting do.
 */
const LOCKED = { w: 220, q: 45, blur: 400 } as const;

/**
 * A face, blurred at the source — or nothing at all.
 *
 * The locked card used to CSS-blur the full-resolution photo, which hides a face
 * from a person and from nobody else: the sharp image sits right there in the
 * network tab. This asks the host for an image that is already destroyed.
 *
 * IT RETURNS NULL WHEN IT CANNOT DO THAT, AND THAT MATTERS MORE THAN IT LOOKS.
 *
 * This used to end with `if (!isUnsplash) return url` — the original, sharp, full
 * resolution photo, handed to anyone who had not paid. That was survivable only
 * while every portrait in the catalogue was an Unsplash stock photo of a stranger
 * who was not a customer. Both halves of that are now false: the stock catalogue
 * is gone, and real companions upload real faces to hosts that are not Unsplash —
 * so the fallback would have quietly served every real companion's face to the
 * public, and left the pass selling access to something already visible.
 *
 * So it fails CLOSED. A photo we cannot destroy is a photo we do not send;
 * callers render a placeholder instead. A locked card that shows a silhouette is
 * a worse advert than one that shows a blurred café. A locked card that shows a
 * real person's actual face is a privacy breach and a product that has nothing
 * left to sell.
 *
 * TO ADD A HOST: it must support server-side blurring via URL parameters (and
 * ignore-unknown-params does NOT count — verify the returned bytes are actually
 * blurred). The durable fix is a pre-blurred derivative generated at upload time,
 * or an image proxy that blurs on the way out; either one lets this allowlist go
 * away. Until then, do not widen it to make the grid look nicer.
 */
export function blurredPhoto(url: string): string | null {
  if (!url) return null;
  if (!BLURRING_HOSTS.some((h) => url.includes(h))) return null;
  const [base] = url.split('?');
  return `${base}?w=${LOCKED.w}&q=${LOCKED.q}&blur=${LOCKED.blur}`;
}
