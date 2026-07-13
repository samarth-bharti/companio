import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sessionMock, prismaMock, companionIdMock } = vi.hoisted(() => ({
  sessionMock: vi.fn<() => Promise<string | null>>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaMock: {} as any,
  companionIdMock: vi.fn<() => Promise<string | null>>(),
}));
vi.mock('@/lib/server/session', () => ({ getSessionUserId: sessionMock }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/server/companion', () => ({ getCompanionIdForUser: companionIdMock }));

import { GET as inboxGet } from '@/app/api/companion/messages/route';
import { POST as replyPost } from '@/app/api/companion/messages/[memberId]/route';

const params = { params: Promise.resolve({ memberId: 'member-1' }) };

function jsonReq(body: unknown) {
  return new Request('http://test/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue('u1');
  companionIdMock.mockResolvedValue('meghna');
  prismaMock.message = { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn(), create: vi.fn() };
  prismaMock.companion = { findFirst: vi.fn().mockResolvedValue({ id: 'meghna' }) };
});

describe('companion inbox', () => {
  it('is 401 without a session', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await inboxGet()).status).toBe(401);
  });

  it('is empty, not an error, for a user who is not a companion', async () => {
    companionIdMock.mockResolvedValue(null);
    const res = await inboxGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('folds a flat message list into one entry per member, newest first', async () => {
    prismaMock.message.findMany.mockResolvedValue([
      { userId: 'm1', from: 'me', text: 'hi', ts: BigInt(1), user: { firstName: 'Asha' } },
      { userId: 'm2', from: 'me', text: 'hello', ts: BigInt(5), user: { firstName: 'Bala' } },
      { userId: 'm1', from: 'me', text: 'you free?', ts: BigInt(9), user: { firstName: 'Asha' } },
    ]);
    const body = await (await inboxGet()).json();
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({ userId: 'm1', lastText: 'you free?', unread: 2 });
    expect(body[1]).toMatchObject({ userId: 'm2', unread: 1 });
  });

  it('unread resets to zero once the companion has replied', async () => {
    prismaMock.message.findMany.mockResolvedValue([
      { userId: 'm1', from: 'me', text: 'hi', ts: BigInt(1), user: { firstName: 'Asha' } },
      { userId: 'm1', from: 'them', text: 'hello!', ts: BigInt(2), user: { firstName: 'Asha' } },
    ]);
    const body = await (await inboxGet()).json();
    expect(body[0]).toMatchObject({ unread: 0, lastFrom: 'me', lastText: 'hello!' });
  });
});

describe('companion reply', () => {
  it('is 403 for a user who is not a companion', async () => {
    companionIdMock.mockResolvedValue(null);
    expect((await replyPost(jsonReq({ text: 'hi' }), params)).status).toBe(403);
  });

  it('stores the reply as from "them" — the companion, in the member’s thread', async () => {
    prismaMock.message.findFirst.mockResolvedValue({ id: 'm1' });
    prismaMock.message.create.mockResolvedValue({ id: 'r1', from: 'them', text: 'Yes!', kind: 'text', reactions: [], ts: BigInt(1) });
    await replyPost(jsonReq({ text: 'Yes!' }), params);
    expect(prismaMock.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ from: 'them', companionId: 'meghna', userId: 'member-1' }) }),
    );
  });

  // The contact filter existed only on the member's composer, which is backwards:
  // the companion is the party with an incentive to take the booking off-platform.
  it('blocks a phone number in the companion’s reply', async () => {
    prismaMock.message.findFirst.mockResolvedValue({ id: 'm1' });
    const res = await replyPost(jsonReq({ text: 'call me on 9876543210' }), params);
    expect(res.status).toBe(422);
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('blocks an email address too', async () => {
    prismaMock.message.findFirst.mockResolvedValue({ id: 'm1' });
    const res = await replyPost(jsonReq({ text: 'reach me at a@b.com' }), params);
    expect(res.status).toBe(422);
  });

  // Otherwise an approved companion could cold-message every member id they guess.
  it('refuses to open a thread the member never started', async () => {
    prismaMock.message.findFirst.mockResolvedValue(null);
    const res = await replyPost(jsonReq({ text: 'hello there' }), params);
    expect(res.status).toBe(404);
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('a suspended companion cannot keep talking to members', async () => {
    prismaMock.companion.findFirst.mockResolvedValue(null); // filtered by suspended/banned
    const res = await replyPost(jsonReq({ text: 'hello there' }), params);
    expect(res.status).toBe(403);
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });
});
