// app/api/application/upload/route.ts
//
// POST /api/application/upload — multipart/form-data
//
// Accepts: photo (File), id (File), idDocType, idDocNumber, ocrMatched?
// Guards:  session required, DB required, rate limited.
//
// WHAT THIS PROVES, precisely:
//   • the ID NUMBER is well-formed (Aadhaar Verhoeff / PAN structure)
//   • both FILES are really images (magic bytes, not the forgeable MIME header)
//   • the selfie is not simply the ID photo submitted twice
//   • neither file has been used by a different applicant before
//
// WHAT IT DOES NOT PROVE: that this person owns this identity. Only a KYC vendor
// querying UIDAI / the Income Tax database can do that. So NOTHING here is ever
// marked `verified` — that status is reserved for a real check. Everything lands
// as `pending` and waits for a human. The manual admin approve is not a backstop
// to these checks; these checks are a filter in front of the human.
//
// Stays dormant (401 / 503) when no session or no DATABASE_URL.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { hasDatabase } from '@/lib/env';
import {
  validateFileIntegrity,
  validateIdNumber,
  maskIdNumber,
  hashBuffer,
  type IdDocType,
} from '@/lib/server/documentValidation'; // server file — has hashBuffer + node:crypto
import { storePhoto, photoStoreConfigured } from '@/lib/server/photoStore';

export const dynamic = 'force-dynamic';

// Vercel Hobby/Pro default function timeout is 15 s. A companion photo upload
// requires: FormData parse + magic-byte check + sharp render (WASM = slow on
// first cold start) + two Blob PUT calls across the wire. We need more headroom.
// Max is 60 s on Hobby, 300 s on Pro. 60 s is safe for both.
export const maxDuration = 60;



export async function POST(req: Request) {
  return guard(async () => {
    // ── 1. Auth + DB guard ────────────────────────────────────────────────────
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    if (!hasDatabase()) return json({ error: 'db_not_configured' }, 503);

    // Uploads are expensive (10 MB × 2, hashing) and a prime abuse target for
    // brute-forcing which documents already exist in the system.
    const rl = await rateLimit({ key: clientKey(req, 'doc-upload'), limit: 10, windowMs: 600_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    // ── 2. Parse FormData ─────────────────────────────────────────────────────
    let formData: FormData;
    try { formData = await req.formData(); }
    catch { return badRequest({ _errors: ['multipart body required'] }); }

    const photoFile   = formData.get('photo')        as File   | null;
    const idFile      = formData.get('id')           as File   | null;
    const idDocType   = formData.get('idDocType')    as string | null;
    const idDocNumber = formData.get('idDocNumber')  as string | null;
    const ocrRaw      = formData.get('ocrMatched')   as string | null;

    if (!photoFile || !idFile)      return badRequest({ _errors: ['photo and id files required'] });
    if (!idDocType || !idDocNumber) return badRequest({ _errors: ['idDocType and idDocNumber required'] });

    // ── 3. Validate ID type ───────────────────────────────────────────────────
    if (idDocType !== 'aadhaar' && idDocType !== 'pan') {
      return badRequest({ _errors: ['idDocType must be aadhaar or pan'] });
    }
    const docType = idDocType as IdDocType;

    if (!validateIdNumber(docType, idDocNumber)) {
      return badRequest({ _errors: ['id number failed format/checksum validation'] });
    }

    // ── 4. File integrity (magic-byte check) ──────────────────────────────────
    const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
    const idBytes    = new Uint8Array(await idFile.arrayBuffer());

    const photoCheck = validateFileIntegrity(photoBytes);
    if (!photoCheck.valid) return badRequest({ _errors: [`photo: ${photoCheck.reason}`] });
    // A PDF is a legitimate scan of an ID. It is never a selfie — accepting one
    // here means the admin reviews a document where they expect a face.
    if (photoCheck.type === 'pdf') {
      return badRequest({ _errors: ['photo: must be a photo of you, not a PDF'] });
    }

    const idCheck = validateFileIntegrity(idBytes);
    if (!idCheck.valid) return badRequest({ _errors: [`id file: ${idCheck.reason}`] });

    // ── 5. Hash both files ────────────────────────────────────────────────────
    const photoHash = hashBuffer(photoBytes);
    const idHash    = hashBuffer(idBytes);

    // The single cheapest fraud check available: uploading the same file twice
    // means there is no selfie, only an ID. Byte-identical is all we can catch
    // for free — a re-encode defeats it — but it costs one comparison.
    if (photoHash === idHash) {
      return badRequest({ _errors: ['photo and id must be two different images'] });
    }

    // ── 6. Duplicate-document check ───────────────────────────────────────────
    const { prisma } = await import('@/lib/prisma');
    // Both fingerprints, not just the ID: one person's selfie appearing under
    // several names is exactly the pattern a ring of fake profiles produces.
    const duplicate = await prisma.companionApplication.findFirst({
      where: {
        NOT: { userId },
        OR: [{ idHash }, { photoHash }],
      },
      select: { id: true },
    });
    if (duplicate) {
      return json({ error: 'document_already_used' }, 409);
    }

    // ── 7. Persist ────────────────────────────────────────────────────────────
    //
    // `ocrMatched` is computed by tesseract.js IN THE APPLICANT'S BROWSER
    // (components/companion/WizardStepVerify.tsx) and posted here. It is a
    // convenience hint, not evidence: anyone can send `ocrMatched=true` with a
    // photo of their cat. We store it so the admin can see what the applicant's
    // own device reported, and the admin UI labels it as self-reported.
    //
    // Nothing is marked `verified`. That status means "an authority confirmed
    // this identity", and no authority has. The application waits for a human,
    // who stamps `manual` on approval.
    const ocrMatched = ocrRaw === 'true' ? true : ocrRaw === 'false' ? false : null;
    const idDocMasked = maskIdNumber(docType, idDocNumber);

    // Store the PORTRAIT — and only the portrait.
    //
    // This route used to hash both files and keep neither. Hashing the ID and
    // discarding it is right and stays: an Aadhaar image is a DPDPA liability
    // with no reason to exist once its number has been checked. Doing the same
    // to the portrait was not right, it was just the same code path — a
    // companion's photo is published by design, and throwing it away meant an
    // approved profile had no face, so it went live hidden and waited for an
    // operator to find a picture and paste a link. That is the whole reason the
    // catalogue could not be populated.
    //
    // storePhoto blurs it with sharp here, once, and writes both variants. The
    // paywall then serves a file we destroyed rather than asking someone else's
    // CDN to destroy it on request.
    //
    // A failure here is NOT fatal to the application: the ID checks above have
    // already passed and re-running them would mean re-uploading a document. The
    // application lands photo-less and the admin can attach one, which is
    // exactly the old behaviour — so this degrades to what we had rather than
    // losing the applicant.
    let photoUrl: string | null = null;
    let photoBlurUrl: string | null = null;
    if (photoStoreConfigured()) {
      try {
        const stored = await storePhoto(photoBytes, `app-${userId}`);
        photoUrl = stored.url;
        photoBlurUrl = stored.blurUrl;
      } catch (err) {
        console.warn('[application/upload] photo store failed; application saved without a portrait', err);
      }
    }

    await prisma.companionApplication.update({
      where: { userId },
      data: {
        idDocType:         docType,
        idDocMasked,
        idHash,
        photoHash,
        photoUrl,
        photoBlurUrl,
        idVerifyStatus:    'pending',
        photoVerifyStatus: 'pending',
        ocrMatched,
        verifiedAt: null,
        idUploaded: true,
      },
    });

    return json({ ok: true, idDocMasked, photoStored: !!photoUrl });
  });
}
