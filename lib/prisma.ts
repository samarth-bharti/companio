// lib/prisma.ts
//
// PrismaClient singleton. In dev, Next.js hot-reload re-imports modules many
// times; without a global cache each reload would open a new DB connection pool
// and eventually exhaust Postgres. Caching on globalThis keeps one client.
//
// Server-only — never import this from a Client Component. It is used by the
// API route handlers under app/api/**.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
