// app/api/auth/[...nextauth]/route.ts
//
// Auth.js (next-auth v4) catch-all handler. The provider config lives in
// lib/auth.ts — currently a Credentials STUB pending the provider choice
// (Google OAuth vs phone-OTP). This file does not change when you pick one.

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
