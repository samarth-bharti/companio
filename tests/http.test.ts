import { describe, it, expect, vi } from 'vitest';
import { guard, unauthorized, badRequest, readJsonBody } from '@/lib/server/http';

const status = async (r: Response) => r.status;

describe('guard', () => {
  it('passes through the handler result', async () => {
    const res = await guard(async () => new Response('ok', { status: 200 }));
    expect(await status(res)).toBe(200);
  });

  it('maps Prisma P2025 to 404', async () => {
    const res = await guard(async () => { throw { code: 'P2025' }; });
    expect(res.status).toBe(404);
  });

  it('maps Prisma P2002 to 409', async () => {
    const res = await guard(async () => { throw { code: 'P2002' }; });
    expect(res.status).toBe(409);
  });

  it('maps Prisma P2003 to 400', async () => {
    const res = await guard(async () => { throw { code: 'P2003' }; });
    expect(res.status).toBe(400);
  });

  it('maps an unknown error to 500 (without leaking details)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await guard(async () => { throw new Error('boom'); });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server_error' });
    spy.mockRestore();
  });
});

describe('response helpers', () => {
  it('unauthorized is 401', async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('badRequest is 400 with issues', async () => {
    const res = badRequest({ field: 'bad' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_request' });
  });
});

describe('readJsonBody', () => {
  it('parses valid JSON', async () => {
    const req = new Request('http://t', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    expect(await readJsonBody(req)).toEqual({ a: 1 });
  });

  it('returns null on malformed JSON instead of throwing', async () => {
    const req = new Request('http://t', { method: 'POST', body: '{not json' });
    expect(await readJsonBody(req)).toBeNull();
  });
});
