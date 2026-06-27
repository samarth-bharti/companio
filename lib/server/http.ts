// lib/server/http.ts — tiny response helpers shared by API route handlers.

import { NextResponse } from 'next/server';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const unauthorized = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });
export const badRequest = (issues: unknown) =>
  NextResponse.json({ error: 'invalid_request', issues }, { status: 400 });

/** Parse a JSON body, returning null on malformed input (never throws). */
export async function readJsonBody(req: Request): Promise<unknown> {
  return req.json().catch(() => null);
}

/**
 * Run a route body, turning thrown errors into clean responses:
 *   - Prisma "record not found" (P2025) → 404
 *   - anything else → 500 (logged, no internals leaked)
 * Keeps every handler free of repetitive try/catch.
 */
export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === 'P2025') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (code === 'P2002') return NextResponse.json({ error: 'conflict' }, { status: 409 });
    if (code === 'P2003') return NextResponse.json({ error: 'invalid_reference' }, { status: 400 });
    console.error('[api error]', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

/**
 * Parse ?limit and ?offset from a list-endpoint request URL.
 *   limit  → clamped to [1, 100], default 50
 *   offset → non-negative integer, default 0
 * Returns Prisma-ready { take, skip }.
 */
export function parsePagination(req: Request): { take: number; skip: number } {
  const url = new URL(req.url);
  const rawLimit = parseInt(url.searchParams.get('limit') ?? '', 10);
  const rawOffset = parseInt(url.searchParams.get('offset') ?? '', 10);
  const take = isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
  const skip = isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);
  return { take, skip };
}
