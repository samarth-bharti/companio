'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Mounts next-auth's session context for the whole app.
 *
 * Nothing in the UI could read a session before this existed — LoginForm faked
 * sign-in by writing a name to localStorage, so `getServerSession` never saw a
 * user and every protected API route answered 401. That is also what made the
 * free-unlock bypass reachable in production.
 *
 * refetchOnWindowFocus keeps a long-lived tab honest: an account that gets
 * banned or whose JWT expires is noticed when the user comes back to the tab,
 * not on their next mutation.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider refetchOnWindowFocus>{children}</SessionProvider>;
}
