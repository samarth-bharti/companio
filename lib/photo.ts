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
export function blurredPhoto(url: string): string {
  if (!url.includes('images.unsplash.com')) return url;
  const [base] = url.split('?');
  return `${base}?w=64&q=30&blur=1000`;
}
