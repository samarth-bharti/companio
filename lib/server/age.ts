// lib/server/age.ts
//
// SERVER re-export of the shared 18+ rules. The logic itself is client-safe and
// lives in lib/age.ts so the browser and the server enforce the same rule from
// the same code — the same split as lib/idFormat.ts → documentValidation.ts.
//
// WHY THE RULE MOVED HERE AT ALL: it was enforced in exactly one place, a
// client-side check in components/auth/StepAboutYou.tsx, which disabled a button
// and then threw the date of birth away. Nothing persisted it, no API asked for
// it, and Google OAuth does not supply one — so in a live build the age gate did
// not exist.
//
// A platonic meetup marketplace putting an adult in a room with a minor is the
// single worst thing this product can do. The gate belongs on the server.

export * from '@/lib/age';
