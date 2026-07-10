// lib/server/visibility.ts
//
// The canonical "is this row allowed to be seen / used" filters.
//
// Companion.suspended / Companion.bannedAt and User.suspended / User.bannedAt
// are written by the admin panel. Before this file existed, NOTHING read them:
// suspending a companion left them in the explore grid, on the map, and
// bookable; banning a user let them keep booking, messaging and paying. The
// admin panel was a very convincing UI over a column nobody consulted.
//
// Every public read of companions, and every authenticated action, must go
// through one of these. Keep them here so a new endpoint can't quietly forget.

import type { Prisma } from '@prisma/client';

/**
 * Companions a member is allowed to see or book. A suspended profile is hidden
 * but recoverable; a banned one is gone for good. Admin pages deliberately do
 * NOT use this — they must see suspended rows in order to unsuspend them.
 */
export const VISIBLE_COMPANION: Prisma.CompanionWhereInput = {
  suspended: false,
  bannedAt: null,
};

/** True when this user row is allowed to act (book, message, pay, sign in). */
export function isActiveUser(u: { suspended: boolean; bannedAt: Date | null } | null): boolean {
  return !!u && !u.suspended && u.bannedAt === null;
}
