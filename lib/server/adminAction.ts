// lib/server/adminAction.ts
//
// Every admin mutation used to look like this:
//
//     const adminId = await getAdminUserId();
//     if (!adminId) return;          // silent
//     if (!parsed.success) return;   // silent
//
// The form posted, the page re-rendered identically, and the operator had no
// way to tell "validation rejected it" from "my session expired" from "it
// worked". Meanwhile a raw Prisma FK error from a delete escaped as an
// unhandled server-action exception and hit the error boundary.
//
// `adminAction` wraps a mutation so it ALWAYS resolves to a message the UI can
// show: the gate check, the error mapping, and the audit-safe catch are done
// once, here. Pair it with <ActionForm> on the page.

import { getAdminUserId } from '@/lib/server/admin';

export type ActionState = { ok: boolean; message: string } | null;

export const succeeded = (message: string): ActionState => ({ ok: true, message });
export const failed = (message: string): ActionState => ({ ok: false, message });

/** Turn a Prisma error code into something an operator can act on. */
function describeError(e: unknown): string {
  const code = (e as { code?: string } | null)?.code;
  switch (code) {
    case 'P2025':
      return 'That record no longer exists — it may have been deleted already.';
    case 'P2002':
      return 'That value is already taken. Try a different id or code.';
    case 'P2003':
      return 'Other records still reference this row, so it cannot be deleted. Ban or suspend it instead.';
    default:
      console.error('[admin action]', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('timeout') || msg.includes('connection')) {
         return 'Database is busy (too many connections). Please try again in a few seconds.';
      }
      return 'Something went wrong. The change was not saved.';
  }
}

/**
 * Run an admin mutation. Re-checks the admin gate server-side (never trust the
 * page render), maps thrown errors to readable text, and guarantees a result.
 */
export async function adminAction(
  fn: (adminId: string) => Promise<ActionState>,
): Promise<ActionState> {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return failed('You are not signed in as an admin. Your session may have expired.');
  }
  try {
    return await fn(adminId);
  } catch (e) {
    return failed(describeError(e));
  }
}

/** Read a trimmed string field from a submitted form. */
export function field(f: FormData, k: string): string {
  return String(f.get(k) ?? '').trim();
}

/**
 * Flatten a zod error into one sentence naming the offending field.
 * `path` is PropertyKey[] in zod 4, so stringify each segment.
 */
export function describeZod(error: { issues: readonly { path: PropertyKey[]; message: string }[] }): string {
  const first = error.issues[0];
  if (!first) return 'Those values are not valid.';
  const name = first.path.map(String).join('.') || 'input';
  return `${name}: ${first.message}`;
}
