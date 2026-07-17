// .claude/hooks/git-identity-guard.mjs
//
// PreToolUse guard on Bash. Refuses any git command that writes history
// (commit, push, tag, merge, cherry-pick, revert, am) unless the identity that
// would be recorded is exactly:
//
//     samarth-bharti <samarthsgsits23@gmail.com>
//
// WHY: this repo is public and the author trailer is permanent — a commit made
// under an office identity cannot be corrected without rewriting history, which
// is banned. The only safe moment to catch a wrong identity is before the commit
// exists. So the check runs there, not after.
//
// It also refuses the three ways the configured identity can be bypassed on a
// single command: `git -c user.email=…`, `git commit --author=…`, and inline
// GIT_AUTHOR_* / GIT_COMMITTER_* environment assignments.

import { execFileSync } from 'node:child_process';

const NAME = 'samarth-bharti';
const EMAIL = 'samarthsgsits23@gmail.com';

/** Commands that write an author or committer line into history, or publish one. */
const WRITES_HISTORY = /\bgit\b[^\n;|&]*\b(commit|push|tag|merge|cherry-pick|revert|am)\b/;

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function gitConfig(key) {
  try {
    return execFileSync('git', ['config', '--get', key], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const raw = await new Promise((resolve) => {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (buf += d));
  process.stdin.on('end', () => resolve(buf));
});

let cmd = '';
try {
  cmd = JSON.parse(raw)?.tool_input?.command ?? '';
} catch {
  process.exit(0); // Unparseable payload is not this hook's problem.
}

if (!WRITES_HISTORY.test(cmd)) process.exit(0);

// 1. Identity overridden on the command line itself.
const override =
  /-c\s*user\.(name|email)=/.test(cmd) ||
  /--author[= ]/.test(cmd) ||
  /GIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)=/.test(cmd);

if (override) {
  const keepsName = cmd.includes(`user.name=${NAME}`) || cmd.includes(`GIT_AUTHOR_NAME=${NAME}`);
  const keepsEmail =
    cmd.includes(`user.email=${EMAIL}`) || cmd.includes(`GIT_AUTHOR_EMAIL=${EMAIL}`);
  if (!(keepsName && keepsEmail)) {
    deny(
      `This command overrides the git identity inline. Companio history is authored by ` +
        `${NAME} <${EMAIL}> only — never an office id. Drop the -c/--author/GIT_* override and re-run.`,
    );
  }
}

// 2. The configured identity that git would actually use.
const name = gitConfig('user.name');
const email = gitConfig('user.email');

if (name !== NAME || email !== EMAIL) {
  deny(
    `Git identity is "${name || '(unset)'}" <${email || '(unset)'}>, but Companio commits must be ` +
      `${NAME} <${EMAIL}>. A wrong author line is permanent — history here is append-only. Fix it first:\n` +
      `  git config --local user.name "${NAME}"\n` +
      `  git config --local user.email "${EMAIL}"`,
  );
}

process.exit(0);
