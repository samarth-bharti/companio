// lib/server/tx.ts
//
// Options for Prisma interactive transactions — `prisma.$transaction(fn, TX)`.
//
// WHY THIS EXISTS
// Prisma's default interactive-transaction timeout is 5000 ms, measured from
// when the transaction opens to when the callback resolves. That budget covers
// every round-trip inside it, not the database's own work.
//
// Our transactions are chatty by design (they go bottom-up through child tables
// so foreign keys stay satisfied), and the database is a Neon compute that may
// be in a different region from the lambda. A dozen sequential statements at a
// couple hundred milliseconds each is over budget before Postgres has done
// anything slow. This is not hypothetical: `eraseUser()` reproducibly blew the
// 5 s default at its final `user.delete()` against Neon.
//
// Two things fail when it blows:
//   • /api/user/delete — the DPDPA erasure right — throws instead of erasing.
//   • settlePurchase() — nine statements — leaves a customer charged at
//     Razorpay with the benefit ungranted. (The webhook retry repairs it, since
//     settle is idempotent, but /api/razorpay/verify hands the paying user an
//     error in the meantime.)
//
// `maxWait` is separate: how long to queue for a connection from the pool
// before giving up. The pooler can be saturated under load; failing fast there
// is right, because a request that cannot even get a connection should shed
// rather than sit on the caller.
//
// KEEP timeout BELOW THE ROUTE'S maxDuration. A serverless function killed
// mid-transaction is strictly worse than one that rolls back cleanly: Postgres
// only learns the client vanished when the connection drops. Vercel's default
// function timeout is 15 s at the time of writing, hence 12 s here — enough
// headroom for the transaction to abort and unwind first.

export const TX = {
  /** Total budget for the interactive-transaction callback. */
  timeout: 12_000,
  /** How long to wait for a pooled connection before failing. */
  maxWait: 5_000,
} as const;
