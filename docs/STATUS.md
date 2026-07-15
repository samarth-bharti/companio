# Status & next steps

_Last updated: 2026-07-15, after the UI-polish session._

The single source of truth for **where the project is and what to do next**.
Keep this current — it's the first file to read when resuming.
**Launch plan / buying / deploy steps live in [`GO-LIVE.md`](GO-LIVE.md).**
**Parked chat work lives in [`CHAT-ROADMAP.md`](CHAT-ROADMAP.md).**

## The one-line summary

**The software is real. The inventory is not.** Every feature on the site now does
what it says, and the claims it makes are ones it can keep. What stands between
this and a launch is twenty-two companions who do not exist, a Grievance Officer
with no name, and two leaked secrets.

## 2026-07-14→15: launched fixes + UI polish

- **Merged to `main`:** the full feature audit (PR #4, 51 fixes, 397 tests), the hero-video
  autoplay fix (PR #5), and the mobile bottom-bar overlap fix (PR #6, `--mobile-nav-h`).
- **One PR open — `feat/ui-polish-rhythm`** (UI-only, verified desktop + iPhone): quiz
  top-anchor + how-it-works step numbers; a shared `EmptyState` component across the
  dashboard tabs + companion messages; equal-height locked explore cards; collapsed admin
  create form; tightened companion stat tiles; Account card email; and closed the blank
  gaps under the bento/stats closing animations. Merge it to catch `main` up.
- Nothing else is coded and pending. The launch blockers below are all non-code.

## Quality gates

- `npx tsc --noEmit` → **0 errors** (re-run 2026-07-15)
- `npx vitest run` → **397 passing** (31 files) (re-run 2026-07-15)
- `npx eslint .` → **0 errors** (warnings remain) — last run 2026-07-14
- `npx next build` → **success** — last run 2026-07-14
- Public routes → **200**; `/admin` redirects without an admin session
- Walked in a real browser against the real Neon database, not just unit-tested:
  sign-in, quiz, paywall, unlock, favourites, chat (both directions), spin,
  booking, the 18+ gate, and the companion dashboard.

## What was found and fixed on 2026-07-13

The theme: **the tests were green and the product was lying.** A passing suite
proves the code does what the code says. It says nothing about whether the screen
tells the truth.

1. **The site promised Aadhaar KYC, a live selfie match, and third-party
   background checks in fourteen places — including the Terms of Service and the
   Privacy Policy.** None of it exists. `app/api/application/upload/route.ts` has
   always said so in its own header: it validates the *format* of an ID number and
   the *bytes* of an image, and deliberately marks nothing as verified, because
   only a KYC vendor querying UIDAI can prove a person owns an identity. The
   marketing copy claimed the pipeline that file explicitly says does not exist.
   → `lib/trust.ts` now holds the true claims behind a `KYC_VENDOR_ENABLED` flag,
   and **`tests/trustClaims.test.ts` fails the build if the sentence comes back.**

2. **Messaging was one-way.** A member could write to a companion; the companion
   had no inbox, no endpoint and no screen, so every message landed in a thread
   only the sender could see — under a line reading "they will see this and reply".
   → Built `/api/companion/messages` and `CompanionDashMessages`. The
   contact-sharing filter now also runs on the **companion's** words, which is
   where it always belonged: they are the party with a reason to take the booking
   off-platform.

3. **`/verify` told members to check two things that did not exist**: a "blue
   verified tick" no profile carries, and a "4-digit meetup code" that was never
   generated. A safety page that cannot be followed is worse than none — it teaches
   people to ignore it, and hands an impostor a ready excuse.
   → The meetup code is now real (`Booking.meetupCode`, CSPRNG, shown to both
   sides). The tick paragraph is gone.

4. **Chat reactions deleted your conversation.** `ChatPanel` called
   `reactToMessage()` from `lib/appState` (localStorage) and passed the result
   straight to `setThread()`, so in http mode a single tap replaced the rendered
   server thread with an empty local one. Reactions were also **unclickable with a
   mouse** — the bar rendered above the bubble inside a scrolling log and was
   clipped by it, so every click landed on the sticky header behind.

5. **The site called people "undefined".** next-auth form-encodes credentials, so
   `firstName: undefined` transmitted the literal string `"undefined"`, which is
   truthy and sailed past the `|| 'Friend'` fallback. Two accounts were stored with
   that name, **including the admin's**.

6. **The quiz promised same-gender matching and never asked the member's gender**,
   so the filter silently did nothing while the screen said "Filtering for
   same-gender companions…".

### The recurring bug class — check this first, always

A component importing `lib/appState` or `lib/journeyState` **directly** instead of
going through `dataClient`, so nothing reaches the server in http mode. Found in
favourites (twice), the wallet (twice), notifications, and chat reactions.

```bash
grep -rn "from '@/lib/appState'\|from '@/lib/journeyState'" components app | grep -v "import type"
```

Anything that is not a `import type` is a bug until proven otherwise.

## Testing it without any keys

Both are deliberately impossible in production and turn themselves off the moment
the real keys exist.

| Want to test | Set | What happens |
|---|---|---|
| **Sign-in** | nothing | With no `RESEND_API_KEY`, the code is shown **on the sign-in screen**. Production refuses to run without email at all, so no real user's code can ever be handed back. |
| **The ₹199 unlock** | `ALLOW_TEST_CHECKOUT=true` | The unlock completes for free via `POST /api/test-checkout`, granting the benefit through `settlePurchase()` — the same function the real webhook calls. **Setting `RAZORPAY_KEY_ID` kills it dead**, flag or no flag. |

## What is still not real

- **The 22 companions are Unsplash stock photos of people who do not exist.** This
  is the launch blocker. Everything else is a formality beside it.
- `lib/photo.ts` blurs a locked portrait via Unsplash query parameters and will
  **silently do nothing** on a non-Unsplash host — so a real face would leak on a
  locked profile the day real photography lands. Needs a pre-blurred derivative or
  an image proxy first.
- The Grievance Officer's name and phone are `[[placeholders]]` in `lib/company.ts`
  (DPDPA requirement; cannot be invented).
- `NEXTAUTH_SECRET` and `CRON_SECRET` leaked at `07c46b1` in a public repo.
  **Rotate them.**
- Companions are paid ₹0 for the two included meetups (`payoutPaise: 0`). An
  unanswered business question, not a bug.
- No companion is `verified`. The column is operator-owned and true of nobody, and
  the copy no longer pretends otherwise.

## Next

Chat is half-designed and deliberately not started — see
[`CHAT-ROADMAP.md`](CHAT-ROADMAP.md).
