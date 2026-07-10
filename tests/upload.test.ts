import { describe, it, expect, vi, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
const { sessionMock, prismaMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  prismaMock: {} as any,
}));

vi.mock('@/lib/server/session', () => ({ getSessionUserId: sessionMock }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/env', () => ({ hasDatabase: () => true }));
vi.mock('@/lib/server/rateLimit', () => ({
  rateLimit: async () => ({ ok: true, remaining: 9, retryAfter: 0 }),
  clientKey: () => 'k',
}));

import { POST as upload } from '@/app/api/application/upload/route';

/** A byte buffer that passes validateFileIntegrity: right magic bytes, >1 KB. */
function fakeImage(kind: 'jpeg' | 'png' | 'pdf', fill: number): Uint8Array {
  const headers: Record<string, number[]> = {
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    pdf: [0x25, 0x50, 0x44, 0x46],
  };
  const head = headers[kind];
  const buf = new Uint8Array(2048).fill(fill);
  buf.set(head, 0);
  return buf;
}

function req(opts: {
  photo?: Uint8Array;
  id?: Uint8Array;
  idDocType?: string;
  idDocNumber?: string;
  ocrMatched?: string;
}): Request {
  const fd = new FormData();
  if (opts.photo) fd.append('photo', new Blob([opts.photo as BufferSource]), 'selfie.jpg');
  if (opts.id) fd.append('id', new Blob([opts.id as BufferSource]), 'id.jpg');
  if (opts.idDocType) fd.append('idDocType', opts.idDocType);
  if (opts.idDocNumber) fd.append('idDocNumber', opts.idDocNumber);
  if (opts.ocrMatched) fd.append('ocrMatched', opts.ocrMatched);
  return new Request('http://localhost/api/application/upload', { method: 'POST', body: fd });
}

// 234123412346 — 12 digits, first digit 2-9, and a valid Verhoeff check digit.
const VALID_AADHAAR = '234123412346';

const PHOTO = fakeImage('jpeg', 0x11);
const ID = fakeImage('png', 0x22);

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue('u1');
  prismaMock.companionApplication = {
    findFirst: vi.fn().mockResolvedValue(null), // no duplicate
    update: vi.fn().mockResolvedValue({}),
  };
});

describe('POST /api/application/upload', () => {
  it('401s with no session, before touching the body', async () => {
    sessionMock.mockResolvedValue(null);
    const res = await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    expect(res.status).toBe(401);
    expect(prismaMock.companionApplication.update).not.toHaveBeenCalled();
  });

  it('rejects an Aadhaar number that fails the Verhoeff check digit', async () => {
    const res = await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: '234123412345' }));
    expect(res.status).toBe(400);
    expect(prismaMock.companionApplication.update).not.toHaveBeenCalled();
  });

  it('accepts a well-formed submission', async () => {
    const res = await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, idDocMasked: 'XXXX XXXX 2346' });
  });

  // The core promise of this route: it never asserts an identity was verified.
  it('NEVER marks a document verified — a human has not looked yet', async () => {
    await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    const data = prismaMock.companionApplication.update.mock.calls[0][0].data;
    expect(data.idVerifyStatus).toBe('pending');
    expect(data.photoVerifyStatus).toBe('pending');
    expect(data.verifiedAt).toBeNull();
  });

  it('does not let a forged client ocrMatched=true promote the status', async () => {
    await upload(req({
      photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR, ocrMatched: 'true',
    }));
    const data = prismaMock.companionApplication.update.mock.calls[0][0].data;
    // Stored as a hint, but the status is unmoved.
    expect(data.ocrMatched).toBe(true);
    expect(data.idVerifyStatus).toBe('pending');
  });

  it('rejects the same file submitted as both the selfie and the ID', async () => {
    const same = fakeImage('jpeg', 0x33);
    const res = await upload(req({ photo: same, id: same, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    expect(res.status).toBe(400);
    expect(prismaMock.companionApplication.update).not.toHaveBeenCalled();
  });

  it('rejects a PDF as the selfie (it is a scan, not a face)', async () => {
    const res = await upload(req({
      photo: fakeImage('pdf', 0x44), id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR,
    }));
    expect(res.status).toBe(400);
  });

  it('accepts a PDF as the ID document', async () => {
    const res = await upload(req({
      photo: PHOTO, id: fakeImage('pdf', 0x55), idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR,
    }));
    expect(res.status).toBe(200);
  });

  it('rejects a file that is not an image or PDF at all', async () => {
    const junk = new Uint8Array(2048).fill(0x99); // no magic bytes
    const res = await upload(req({ photo: junk, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    expect(res.status).toBe(400);
  });

  it('409s when either fingerprint belongs to another applicant', async () => {
    prismaMock.companionApplication.findFirst.mockResolvedValue({ id: 'other' });
    const res = await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'document_already_used' });
  });

  it('checks BOTH the id and the photo fingerprint for reuse', async () => {
    await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    const where = prismaMock.companionApplication.findFirst.mock.calls[0][0].where;
    expect(where.NOT).toEqual({ userId: 'u1' });
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0]).toHaveProperty('idHash');
    expect(where.OR[1]).toHaveProperty('photoHash');
  });

  it('stores only a masked number, never the full Aadhaar', async () => {
    await upload(req({ photo: PHOTO, id: ID, idDocType: 'aadhaar', idDocNumber: VALID_AADHAAR }));
    const data = prismaMock.companionApplication.update.mock.calls[0][0].data;
    expect(data.idDocMasked).toBe('XXXX XXXX 2346');
    expect(JSON.stringify(data)).not.toContain(VALID_AADHAAR);
  });
});
