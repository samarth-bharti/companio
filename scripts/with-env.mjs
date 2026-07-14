// scripts/with-env.mjs
//
// Run a command with .env.local loaded into the environment.
//
// Next.js reads .env.local automatically; the Prisma CLI does not — it only looks
// at .env. So `prisma migrate deploy` could not see DATABASE_URL / DIRECT_URL and
// failed with "Environment variable not found: DIRECT_URL", even though the app
// running beside it was connected to the database perfectly well.
//
// Values are never printed. Usage:
//   node scripts/with-env.mjs npx prisma migrate deploy

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return 0;
  }
  let count = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip one layer of surrounding quotes, as dotenv does.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Real environment wins over the file, matching dotenv's precedence.
    if (process.env[key] === undefined) {
      process.env[key] = value;
      count += 1;
    }
  }
  return count;
}

const loaded = loadEnvFile('.env.local');
console.log(`[with-env] loaded ${loaded} variable(s) from .env.local`);

const [, , ...cmd] = process.argv;
if (cmd.length === 0) {
  console.error('[with-env] usage: node scripts/with-env.mjs <command> [args...]');
  process.exit(2);
}

const res = spawnSync(cmd[0], cmd.slice(1), {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);
