// lib/auth.ts
//
// Auth.js (next-auth v4) configuration.
//
// BOTH real providers are drafted here behind an env switch, so going live is a
// matter of supplying credentials — no code change:
//   • Google OAuth   — auto-enabled once GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
//                      are set.
//   • Phone OTP      — the credentials form is always registered; authorize()
//                      stays a no-op until an SMS gateway (SMS_API_KEY) is wired
//                      and verifyOtp() is implemented.
// Until either is configured, sign-in is inert (no session) and every protected
// route returns 401 — exactly today's behaviour.
//
// We use the JWT session strategy (not the Prisma adapter) so we own the User
// row — a better fit for phone-OTP onboarding. Every successful sign-in maps to
// a User row via upsertUser(), and the rest of the app keys off `session.user.id`.

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

/**
 * Find-or-create our own User row for an external identity, returning its id.
 * Lazy-imports Prisma so nothing is constructed in no-database mode; returns
 * null when no DB is configured (sign-in then fails gracefully).
 */
async function upsertUser(opts: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}): Promise<{ id: string; firstName: string } | null> {
  if (!process.env.DATABASE_URL) return null;
  const where = opts.email
    ? { email: opts.email }
    : opts.phone
      ? { phone: opts.phone }
      : null;
  if (!where) return null;
  const firstName = opts.name?.trim().split(/\s+/)[0] || 'Friend';
  const { prisma } = await import('@/lib/prisma');
  return prisma.user.upsert({
    where,
    update: {},
    create: { ...where, firstName },
    select: { id: true, firstName: true },
  });
}

/**
 * Verify a one-time code for a phone number. TODO(go-live): check `otp` against
 * the code sent to `phone` (store codes in Redis/DB with a short TTL via the SMS
 * gateway). Returns false until that is wired, so OTP sign-in stays inert.
 */
async function verifyOtp(_phone: string, _otp: string): Promise<boolean> {
  return false;
}

function buildProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = [];

  // ── Option A — Google OAuth (auto-enabled once its env vars are present) ──
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  // ── Option B — Phone OTP (form always present; inert until SMS is wired) ──
  providers.push(
    CredentialsProvider({
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!process.env.SMS_API_KEY) return null; // gateway not configured
        const phone = credentials?.phone?.trim();
        const otp = credentials?.otp?.trim();
        if (!phone || !otp) return null;
        if (!(await verifyOtp(phone, otp))) return null;
        const user = await upsertUser({ phone });
        return user ? { id: user.id, name: user.firstName } : null;
      },
    }),
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: buildProviders(),
  callbacks: {
    // Stamp our own User.id onto the token. Credentials sign-in already returns
    // our id; OAuth sign-ins are upserted to a User row here (keyed by email).
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
