// lib/server/documentValidation.ts
//
// SERVER document checks. Re-exports the client-safe validators from
// lib/idFormat.ts and adds the node:crypto hashing used for duplicate detection.
//
// What this DOES: proves a submitted ID number is well-formed (real format, not
// a random/typo'd number), that an uploaded file is genuinely the image/PDF it
// claims to be, and fingerprints files so the same document can't be reused by
// two applicants. What this does NOT do: prove the person owns the identity —
// only a paid KYC vendor hitting the UIDAI/govt database can. It raises the
// floor against lazy fraud and wrong uploads; it is not identity proof. Pair it
// with the manual admin-approve backstop.

import { createHash } from 'node:crypto';

export * from '@/lib/idFormat';

// ── Hashing — duplicate detection ──────────────────────────────────────────────
// SHA-256 of the file bytes. Two applicants uploading the same ID image produce
// the same hash, so the apply route can reject a reused document — and we can
// store a fingerprint without keeping the raw file.

export function hashBuffer(buf: Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex');
}
