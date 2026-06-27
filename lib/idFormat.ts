// lib/idFormat.ts
//
// CLIENT-SAFE document checks — pure functions, no Node APIs, so they run in the
// browser (live wizard feedback) AND on the server. The hashing piece that needs
// node:crypto lives in lib/server/documentValidation.ts, which re-exports all of
// this. See that file's header for the honest scope of what these checks prove.

// ── Aadhaar — 12 digits + Verhoeff check digit ─────────────────────────────────
// WHY Verhoeff: Aadhaar's last digit is a checksum the UIDAI computes from the
// other 11 via the Verhoeff algorithm — it catches single-digit typos and most
// transpositions. A randomly typed number fails it ~90% of the time, so this
// rejects made-up numbers offline, for free.

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeffValid(digits: string): boolean {
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = D[c][P[i % 8][Number(reversed[i])]];
  }
  return c === 0;
}

/** Strip spaces/dashes for validation/storage. */
export function normalizeAadhaar(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

/** Exactly 12 digits, first digit 2–9, passing Verhoeff check digit. */
export function validateAadhaar(raw: string): boolean {
  const n = normalizeAadhaar(raw);
  if (!/^[2-9]\d{11}$/.test(n)) return false;
  return verhoeffValid(n);
}

// ── PAN — Income Tax permanent account number (AAAAA9999A) ──────────────────────

const PAN_HOLDER_TYPES = new Set(['P', 'C', 'H', 'A', 'B', 'G', 'J', 'L', 'F', 'T', 'K']);

export function normalizePan(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase();
}

export function validatePan(raw: string): boolean {
  const n = normalizePan(raw);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(n)) return false;
  return PAN_HOLDER_TYPES.has(n[3]);
}

// ── Type-dispatched validators ──────────────────────────────────────────────────

export type IdDocType = 'aadhaar' | 'pan';

export function validateIdNumber(type: IdDocType, raw: string): boolean {
  return type === 'aadhaar' ? validateAadhaar(raw) : validatePan(raw);
}

/** Privacy-safe display form — NEVER store the full Aadhaar (DPDPA liability). */
export function maskIdNumber(type: IdDocType, raw: string): string {
  if (type === 'aadhaar') {
    const n = normalizeAadhaar(raw);
    return `XXXX XXXX ${n.slice(-4)}`;
  }
  const n = normalizePan(raw);
  return `${n.slice(0, 2)}******${n.slice(-1)}`;
}

// ── File integrity — magic-byte sniffing ───────────────────────────────────────
// Checks the file's true leading bytes rather than the forgeable browser MIME /
// extension. A renamed .exe or a 3-byte junk file is never accepted as a scan.

export type DetectedFileType = 'jpeg' | 'png' | 'webp' | 'pdf' | null;

export function detectFileType(buf: Uint8Array): DetectedFileType {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'png';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'webp';
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)
    return 'pdf';
  return null;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MIN_BYTES = 1024; // 1 KB

export interface FileCheckResult {
  valid: boolean;
  type: DetectedFileType;
  reason?: string;
}

export function validateFileIntegrity(buf: Uint8Array): FileCheckResult {
  if (buf.length < MIN_BYTES) return { valid: false, type: null, reason: 'file too small' };
  if (buf.length > MAX_BYTES) return { valid: false, type: null, reason: 'file too large (max 10MB)' };
  const type = detectFileType(buf);
  if (!type) return { valid: false, type: null, reason: 'not a valid image or PDF' };
  return { valid: true, type };
}
