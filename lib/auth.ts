// lib/auth.ts
//
// Auth.js (next-auth v4) configuration. Companio is passwordless. There are
// exactly two ways to become a signed-in user, and both end at a real server
// session:
//
//   • Google OAuth  — enabled once GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET exist.
//   • Email code    — a six-digit code, minted and checked server-side by
//                     lib/server/otp.ts. Always available where there is a
//                     database and a session secret.
//
// There is no password provider and there never was one that worked. There is
// no phone provider yet: sending an SMS in India needs TRAI DLT registration,
// which needs a registered business. Email needs neither.
//
// We use the JWT session strategy rather than the Prisma adapter so we own the
// User row outright. Every successful sign-in maps to one, and the rest of the
// app keys off `session.user.id`.

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { envValue } from '@/lib/env';
import { normaliseEmail, verifySignInCode } from '@/lib/server/otp';

/**
 * Find-or-create our own User row for an external identity, returning its id.
 * Lazy-imports Prisma so nothing is constructed in no-database mode; returns
 * null when no DB is configured (sign-in then fails gracefully).
 */
/**
 * A credentials provider receives its fields as form-encoded strings, so a
 * JavaScript `undefined` arrives as the four-letter word "undefined" — which is
 * truthy, and sailed straight past a `|| 'Friend'` fallback. Signing in from
 * /login (which has no name field) created an account literally called
 * "undefined", and the dashboard greeted them with "Good afternoon, undefined".
 *
 * Trust no string a form can forge into existence.
 */
export function credentialString(v?: string | null): string | undefined {
  const s = v?.trim();
  if (!s || s === 'undefined' || s === 'null') return undefined;
  return s;
}

async function upsertUser(opts: {
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
}): Promise<{ id: string; firstName: string } | null> {
  if (!envValue('DATABASE_URL')) return null;
  if (!opts.email) return null;
  const email = normaliseEmail(opts.email);

  // Prefer an explicit firstName (the register wizard collects one) over the
  // leading token of an OAuth display name. Never invent one from the local
  // part of the address — "no.reply@" should not become a user called "No".
  const firstName =
    credentialString(opts.firstName) ||
    credentialString(opts.name)?.split(/\s+/)[0] ||
    'Friend';

  const { prisma } = await import('@/lib/prisma');
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, firstName },
    select: { id: true, firstName: true },
  });
}

function buildProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = [];

  // ── Google OAuth (auto-enabled once its env vars are present) ──
  // envValue() treats `[[fill me in]]` as absent: registering a provider with a
  // placeholder client id gets you a Google error page instead of a sign-in
  // button that honestly says "not configured".
  const googleId = envValue('GOOGLE_CLIENT_ID');
  const googleSecret = envValue('GOOGLE_CLIENT_SECRET');
  if (googleId && googleSecret) {
    providers.push(GoogleProvider({ clientId: googleId, clientSecret: googleSecret }));
  }

  // ── Email code ──
  // The code was already delivered by POST /api/auth/otp. authorize() only
  // checks it. A wrong code returns null, which next-auth surfaces to the client
  // as a failed sign-in — it never mints a session.
  providers.push(
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
        // Carried through registration so the new row gets the name the user
        // typed. Ignored for an existing account: upsert's `update` is empty,
        // so this can never overwrite someone else's profile.
        firstName: { label: 'First name', type: 'text' },
      },
      async authorize(credentials) {
        if (!envValue('DATABASE_URL')) return null;
        const email = credentials?.email?.trim();
        const code = credentials?.code?.trim();
        if (!email || !code) return null;

        const result = await verifySignInCode(email, code);
        if (!result.ok) return null;

        const user = await upsertUser({ email, firstName: credentials?.firstName });
        return user ? { id: user.id, email: normaliseEmail(email), name: user.firstName } : null;
      },
    }),
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: buildProviders(),
  pages: { signIn: '/login' },
  callbacks: {
    // Stamp our own User.id onto the token. The credentials provider already
    // returns our id; OAuth sign-ins are upserted to a User row here.
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'google') {
        const row = await upsertUser({ email: user.email, name: user.name });
        if (row) token.uid = row.id;
      } else if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
};
