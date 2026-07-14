// scripts/migrate-on-deploy.mjs
//
// Apply pending migrations as part of a REAL deploy, and only then.
//
// The build script used to call `prisma migrate deploy` directly. That did the
// job on Vercel and broke everywhere else, in two ways worth spelling out:
//
//   1. CI has no database, on purpose — the workflow says so ("no database
//      required"). `migrate deploy` reads DIRECT_URL out of the schema, found
//      nothing, and killed the build with P1012. Every pull request went red on a
//      check that had nothing to do with the change in it.
//
//   2. Vercel builds EVERY deployment, previews included, with the same
//      environment. So a preview of any branch would run that branch's migrations
//      against the production database — a schema change getting reviewed on a
//      pull request would already have been applied to live data before anyone
//      approved it. That is the kind of thing you find out about afterwards.
//
// So: run migrations when this is a production deploy that actually has a
// database, and skip, loudly but without failing, when it is not.

import { execFileSync } from 'node:child_process';

const hasDatabase = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);

// Set by Vercel to 'production' | 'preview' | 'development'. Absent locally and
// in CI, which is exactly when we do not want to touch a database.
const vercelEnv = process.env.VERCEL_ENV;

// An explicit escape hatch for a self-hosted or non-Vercel deploy that genuinely
// wants migrations applied at build time.
const forced = process.env.RUN_MIGRATIONS === 'true';

function skip(reason) {
  console.log(`[migrate-on-deploy] skipped — ${reason}`);
  process.exit(0);
}

if (!hasDatabase) {
  skip('no DATABASE_URL/DIRECT_URL in this environment (CI, or a local build)');
}

if (!forced && vercelEnv && vercelEnv !== 'production') {
  // The important one. A preview deployment shares production credentials, and
  // migrating from a preview would apply an unreviewed schema change to live data.
  skip(`this is a Vercel "${vercelEnv}" deployment, not production`);
}

if (!forced && !vercelEnv) {
  skip('not a Vercel deployment (set RUN_MIGRATIONS=true to force)');
}

console.log('[migrate-on-deploy] applying pending migrations…');
execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
