// lib/safety/sos.ts
//
// Client-safe SOS + live-location helpers. Zero paid services: uses the browser
// Geolocation API for coordinates and a Google Maps link + the Web Share API
// (with WhatsApp / SMS fallbacks) to alert a trusted contact. Works fully
// offline-of-our-backend — the life-safety path never depends on our server.
//
// SSR-safe: every function guards `navigator` / `window` access.

import { readJSON, writeJSON } from '@/lib/storage';

const KEY_TRUSTED = 'companio_trusted_contact';

export interface TrustedContact {
  name: string;
  /** Digits only, with country code, e.g. 919876543210 — no +, spaces or dashes. */
  phone: string;
}

export function getTrustedContact(): TrustedContact | null {
  return readJSON<TrustedContact | null>(KEY_TRUSTED, null);
}

export function setTrustedContact(c: TrustedContact): void {
  writeJSON(KEY_TRUSTED, c);
}

/** Strip a user-typed phone to wa.me/sms-safe digits (keeps leading country code). */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export interface Coords {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Resolve the device's current position once. Rejects with a human-readable
 * reason on denial / timeout so the UI can show something useful.
 */
export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Turn it on to share your location.'
            : 'Could not get your location. Move to open sky and try again.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  });
}

export function mapsLink(c: Coords): string {
  return `https://www.google.com/maps?q=${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
}

export function sosMessage(mapsUrl: string, companionName?: string): string {
  const who = companionName ? ` (meeting ${companionName} via Companio)` : ' (via Companio)';
  return `🆘 I need help${who}. This is my live location right now: ${mapsUrl}`;
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function smsLink(phone: string, text: string): string {
  // `?&body=` is the cross-platform-safest SMS body form (iOS + Android).
  return `sms:${normalizePhone(phone)}?&body=${encodeURIComponent(text)}`;
}

/**
 * Try the native share sheet (best on mobile — lets the user pick any contact).
 * Returns true if the share UI opened, false if unsupported / dismissed so the
 * caller can fall back to WhatsApp / SMS links.
 */
export async function shareSos(text: string, url: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    await navigator.share({ title: 'Companio SOS', text, url });
    return true;
  } catch {
    return false; // user cancelled or share failed
  }
}
