// app/api/application/upload/route.ts
//
// POST /api/application/upload — multipart/form-data
//
// Accepts: photo (File), id (File), idDocType, idDocNumber, ocrMatched?
// Guards:  session required, DB required.
// Does:    file-integrity check, ID-format validation, duplicate-hash rejection,
//          masked-number storage, application row update.
//
// Stays dormant (401 / 503) when no session or no DATABASE_URL — same pattern
// as every other protected route in this codebase.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, guard } from '@/lib/server/http';
import { hasDatabase } from '@/lib/env';
import {
  validateFileIntegrity,
  validateIdNumber,
  maskIdNumber,
  hashBuffer,
  type IdDocType,
} from '@/lib/server/documentValidation'; // server file — has hashBuffer + node:crypto

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    // ── 1. Auth + DB guard ────────────────────────────────────────────────────
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    if (!hasDatabase()) return json({ error: 'db_not_configured' }, 503);

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

    const idCheck = validateFileIntegrity(idBytes);
    if (!idCheck.valid) return badRequest({ _errors: [`id file: ${idCheck.reason}`] });

    // ── 5. Hash both files ────────────────────────────────────────────────────
    const photoHash = hashBuffer(photoBytes);
    const idHash    = hashBuffer(idBytes);

    // ── 6. Duplicate-document check ───────────────────────────────────────────
    const { prisma } = await import('@/lib/prisma');
    const duplicate = await prisma.companionApplication.findFirst({
      where: { idHash, NOT: { userId } },
      select: { id: true },
    });
    if (duplicate) {
      return json({ error: 'document_already_used' }, 409);
    }

    // ── 7. Persist to the user's application row ──────────────────────────────
    const ocrMatched = ocrRaw === 'true' ? true : ocrRaw === 'false' ? false : null;
    const idDocMasked = maskIdNumber(docType, idDocNumber);
    const now = new Date();

    await prisma.companionApplication.update({
      where: { userId },
      data: {
        idDocType:        docType,
        idDocMasked,
        idHash,
        photoHash,
        idVerifyStatus:   'verified',
        photoVerifyStatus: 'verified',
        ocrMatched,
        verifiedAt: now,
        idUploaded: true,
      },
    });

    return json({ ok: true, idDocMasked });
  });
}
