# Companio — Feature Inventory & Audit Loop

Every feature the product has, numbered. Each is audited on five axes:

- **W** wired — the click reaches real code, not a stub
- **R** response — success, empty, error and loading states all exist
- **P** persists — survives a refresh (DB, not just React state)
- **A** auth — correct behaviour signed out / signed in / wrong role
- **U** ui — looks finished; no raw text, no broken layout, no dead affordance

Status: `[ ]` not audited · `[~]` audited, issues open · `[x]` audited, passing · `[!]` broken, needs fix

Derived from the real tree (37 pages, 40 API routes, ~160 components) — nothing here is aspirational.

---

## 1. Shell, navigation, global chrome

1. `[ ]` Top nav — links, active state, scroll behaviour (`components/layout/Nav.tsx`)
2. `[ ]` Nav user menu — signed-out vs signed-in, avatar, sign-out (`NavUser.tsx`)
3. `[ ]` Top-up / credits menu in nav (`TopUpMenu.tsx`)
4. `[ ]` Back bar — appears on sub-pages, actually goes back (`BackBar.tsx`)
5. `[ ]` Flow top bar — step progress in wizards (`FlowTopBar.tsx`)
6. `[ ]` Footer — every link resolves, no 404s (`Footer.tsx`)
7. `[ ]` Info page shell — legal/marketing layout (`InfoPage.tsx`)
8. `[ ]` Root layout — providers mount in right order (`app/layout.tsx`)
9. `[ ]` 404 page — styled, has a way home (`not-found.tsx`)
10. `[ ]` Error boundary — recoverable, shows retry (`error.tsx`)
11. `[ ]` Global error boundary — catches layout crashes (`global-error.tsx`)
12. `[ ]` Loading states — route-level suspense, no blank flashes
13. `[ ]` Page transitions (`motion/PageTransition.tsx`)
14. `[ ]` Motion toggle — user can kill animation (`MotionToggle.tsx`)
15. `[ ]` `prefers-reduced-motion` honoured everywhere (never branch markup on it)
16. `[ ]` Scroll progress pill (`ScrollProgressPill.tsx`)
17. `[ ]` Smooth scroll / Lenis provider (`LenisProvider.tsx`)
18. `[ ]` Mobile responsiveness — every page at 375px
19. `[ ]` Keyboard navigation — tab order, focus rings, escape closes modals
20. `[ ]` Skip-to-content / screen-reader landmarks

## 2. Home page

21. `[ ]` Hero — phone journey animation (`PhoneJourneyHero.tsx`)
22. `[ ]` Hero video — `hero.mp4`, skipped on reduced-motion / data-saver
23. `[ ]` Hero copy + CTA click-through (`phone/HeroCopy.tsx`)
24. `[ ]` Phone browse / profile / confirmed sub-scenes
25. `[ ]` Intro sequence — first-visit only, skippable (`intro/IntroSequence.tsx`)
26. `[ ]` Chapters scroll narrative (`home/Chapters.tsx`)
27. `[ ]` Activity chapter — desktop + mobile variants
28. `[ ]` Bento section + Spline tile (`BentoSection.tsx`, `SplineBentoTile.tsx`)
29. `[ ]` How-it-works section (`home/HowItWorks.tsx`)
30. `[ ]` Process section (`ProcessSection.tsx`)
31. `[ ]` People section (`PeopleSection.tsx`)
32. `[ ]` Moments grid (`MomentsGrid.tsx`)
33. `[ ]` Belonging band (`BelongingBand.tsx`)
34. `[ ]` Safety band + safety section
35. `[ ]` Money split explainer (`MoneySplit.tsx`)
36. `[ ]` Stats section + stat showcase — **verify every number is true or clearly illustrative**
37. `[ ]` Trust carousel (`TrustCarousel.tsx`)
38. `[ ]` Final CTA section (`FinalCtaSection.tsx`)
39. `[ ]` Cursor stickers / sparkle cluster — no perf hit
40. `[ ]` Spotlight text, count-up, marquee, tilt, magnetic button, roll link

## 3. Auth

41. `[ ]` Login page — renders only methods that exist (`app/login`)
42. `[ ]` Capability probe — `/api/auth/capability` drives the UI (`useCapability.ts`)
43. `[ ]` Google sign-in — full round trip **(BLOCKED: redirect_uri not registered)**
44. `[ ]` Email OTP — send code (`/api/auth/otp`)
45. `[ ]` Email OTP — verify code, mint session (credentials provider)
46. `[ ]` OTP code input UX — paste, autofocus, 6 digits (`CodeInput.tsx`)
47. `[ ]` Dev code card — shows code when no inbox (`DevCodeCard.tsx`)
48. `[ ]` OTP expiry (10 min), single-use, newest-code-only
49. `[ ]` OTP throttle — per-IP and per-email
50. `[ ]` OTP wrong-guess counter → lockout
51. `[ ]` Account enumeration — response identical for known/unknown email
52. `[ ]` Register wizard — role step (`StepRole.tsx`)
53. `[ ]` Register wizard — about you (`StepAboutYou.tsx`)
54. `[ ]` Register wizard — verify (`StepVerify.tsx`)
55. `[ ]` Register wizard — done (`StepDone.tsx`)
56. `[ ]` Field validation + inline status (`FieldStatus.tsx`)
57. `[ ]` Age confirmation gate — 18+ (`ConfirmAge.tsx`, `lib/age.ts`)
58. `[ ]` Account gate — blocks gated UI when signed out (`AccountGate.tsx`)
59. `[ ]` Session persistence across refresh
60. `[ ]` Sign out — clears session and local state
61. `[ ]` Safe redirect after login — no open redirect (`safeRedirect.ts`)
62. `[ ]` Auth provider mounts session context (`AuthProvider.tsx`)

## 4. Explore / discovery

63. `[ ]` Explore page loads catalogue from DB (`/api/companions`)
64. `[ ]` Companion card — photo, name, rating, rate (`CompanionCard.tsx`)
65. `[ ]` Companion grid — layout, empty state, skeletons
66. `[ ]` Blur-lock card for locked profiles (`BlurLockCard.tsx`)
67. `[ ]` Free preview — one companion per city readable (`redact.ts`)
68. `[ ]` Redaction — locked fields never leave the server
69. `[ ]` Filters — activity, language, price, age (`ExploreFilters.tsx`)
70. `[ ]` Filter state in URL / shareable (`useExploreFilters.ts`)
71. `[ ]` City selector (`CitySelector.tsx`, `lib/data/cities.ts`)
72. `[ ]` Area filter (`lib/data/areas.ts`)
73. `[ ]` Map view — tiles load, markers, popups (`MapView.tsx`)
74. `[ ]` Map tile fallback when no MapTiler key (`lib/map/tiles.ts`)
75. `[ ]` Compare tray — add/remove/compare (`CompareTray.tsx`)
76. `[ ]` Activity ticker (`ActivityTicker.tsx`)
77. `[ ]` Welcome overlay — first visit, dismissible, persists (`WelcomeOverlay.tsx`, `/api/user/welcomed`)
78. `[ ]` Sort / match score ordering (`lib/matching.ts`)
79. `[ ]` Empty state — no results for filter combo
80. `[ ]` Explore header + result count (`ExploreHeader.tsx`)

## 5. Companion profile

81. `[ ]` Profile page loads by id (`/api/companions/[id]`)
82. `[ ]` Portrait / photo (`CompanionProfilePortrait.tsx`)
83. `[ ]` Booking rail — sticky, CTA (`CompanionProfileBookingRail.tsx`)
84. `[ ]` Reviews list (`CompanionProfileReviews.tsx`)
85. `[ ]` Rating badge (`RatingBadge.tsx`)
86. `[ ]` Suggestions / similar companions (`CompanionProfileSuggestions.tsx`)
87. `[ ]` Suspended/banned companion → 404, not a broken page (`visibility.ts`)
88. `[ ]` Locked profile → unlock prompt, not the real data
89. `[ ]` Favourite / save toggle (`/api/favorites/toggle`)
90. `[ ]` Share profile link

## 6. Unlock & payments

91. `[ ]` Unlock sheet opens from locked card (`UnlockSheet.tsx`)
92. `[ ]` Unlock benefits copy (`UnlockBenefits.tsx`)
93. `[ ]` Payment method tiles (`PaymentMethodTiles.tsx`)
94. `[ ]` ₹199 unlock — free test checkout path (`/api/test-checkout`)
95. `[ ]` Test checkout refuses when Razorpay keys exist
96. `[ ]` Test checkout refuses kinds other than `unlock`
97. `[ ]` Razorpay create-order (`/api/razorpay/create-order`)
98. `[ ]` Razorpay checkout modal opens (`razorpayClient.ts`)
99. `[ ]` Razorpay verify — signature check (`/api/razorpay/verify`)
100. `[ ]` Razorpay webhook — `payment.captured` settles (`/api/razorpay/webhook`)
101. `[ ]` Webhook signature verification
102. `[ ]` Idempotency — same payment settled twice does not double-grant
103. `[ ]` `settlePurchase()` grants the benefit (`payments.ts`)
104. `[ ]` Already-unlocked → no second charge
105. `[ ]` Signed-out user hitting pay → `auth_required`, not a free grant
106. `[ ]` RBI gate — booking/credits/plus disabled without flag (`pricing.ts`)
107. `[ ]` GST line on receipt when `GST_ACTIVE` (`payments.ts`)
108. `[ ]` Unlock state persists + reflects in UI (`/api/user/unlocked`)
109. `[ ]` Payment failure / dismissed → honest message, no benefit
110. `[ ]` Pricing page — plans, accordion (`app/pricing`, `WhatsIncludedAccordion.tsx`)

## 7. Wallet & credits

111. `[ ]` Wallet card (`WalletCard.tsx`)
112. `[ ]` Wallet balance read (`/api/wallet`)
113. `[ ]` Add credits (`/api/wallet/add-credits`)
114. `[ ]` Decrement on spend (`/api/wallet/decrement`)
115. `[ ]` Wallet cannot go negative / race-safe (`tx.ts`)
116. `[ ]` Subscription state (`/api/subscription`)
117. `[ ]` Credits gated behind RBI flag where applicable

## 8. Booking flow

118. `[ ]` Book page entry (`app/book`)
119. `[ ]` Step: activity (`BookingStepActivity.tsx`)
120. `[ ]` Step: date (`BookingStepDate.tsx`)
121. `[ ]` Step: time — **clock/time picker** (`BookingStepTime.tsx`)
122. `[ ]` Step: place (`BookingStepPlace.tsx`)
123. `[ ]` Step: review + price breakdown (`BookingStepReview.tsx`)
124. `[ ]` Safety acknowledgement modal (`SafetyAckModal.tsx`)
125. `[ ]` Booking confirmed screen (`BookingConfirmed.tsx`)
126. `[ ]` Confetti / celebration (`journey/Confetti.tsx`)
127. `[ ]` Create booking (`POST /api/bookings`)
128. `[ ]` Read booking (`/api/bookings/[id]`)
129. `[ ]` Cancel booking + refund rules
130. `[ ]` First 2 meetings free — enforced server-side
131. `[ ]` Double-booking / slot conflict rejected (`server/booking.ts`)
132. `[ ]` Past date/time rejected
133. `[ ]` Booking persists and appears in both dashboards
134. `[ ]` Wizard back/forward preserves state
135. `[ ]` Abandon mid-wizard → no orphan booking row

## 9. Member dashboard

136. `[ ]` Dashboard shell + tabs (`DashboardClient.tsx`)
137. `[ ]` Overview panel (`OverviewPanel.tsx`)
138. `[ ]` Next meetup card + countdown (`NextMeetupCard.tsx`)
139. `[ ]` Bookings panel — upcoming/past (`BookingsPanel.tsx`)
140. `[ ]` Booking card actions (`BookingCard.tsx`)
141. `[ ]` Messages panel — thread list (`MessagesPanel.tsx`)
142. `[ ]` Chat panel — send/receive (`ChatPanel.tsx`, `/api/messages`)
143. `[ ]` Message bubble states — sent/read (`MessageBubble.tsx`)
144. `[ ]` Emoji + sticker picker (`EmojiStickerPicker.tsx`)
145. `[ ]` Message reactions (`/api/messages/[companionId]/react`)
146. `[ ]` Contact-detail scrubbing in chat (`lib/chat/contact.ts`)
147. `[ ]` Saved / favourites panel (`SavedPanel.tsx`, `/api/favorites`)
148. `[ ]` Notifications panel (`NotificationsPanel.tsx`, `/api/notifications`)
149. `[ ]` Mark notification read (`/api/notifications/read`)
150. `[ ]` Unread badge count, live update
151. `[ ]` Notification fires on: booking created, accepted, declined, cancelled, message received, review request, payout
152. `[ ]` Email notification mirrors in-app one (`notify.ts`)
153. `[ ]` Review modal — rate after meetup (`ReviewModal.tsx`)
154. `[ ]` Rebook nudge (`RebookNudge.tsx`)
155. `[ ]` Stamp shelf / passport gamification (`StampShelf.tsx`)
156. `[ ]` Spin banner → spin wheel (`SpinBanner.tsx`, `/api/spin`)
157. `[ ]` Spin wheel — one spin per period, server-decided (`server/spin.ts`)

## 10. Companion side

158. `[ ]` Become-a-companion landing (`app/become-a-companion`)
159. `[ ]` Earnings calculator (`EarningsCalculator.tsx`)
160. `[ ]` Apply wizard — about (`WizardStepAbout.tsx`)
161. `[ ]` Apply wizard — services (`WizardStepServices.tsx`)
162. `[ ]` Apply wizard — verify (`WizardStepVerify.tsx`)
163. `[ ]` Apply wizard — preview (`WizardStepPreview.tsx`)
164. `[ ]` Apply success (`WizardSuccess.tsx`)
165. `[ ]` ID upload + validation (`VerifyIdInput.tsx`, `documentValidation.ts`)
166. `[ ]` Selfie capture (`VerifySelfie.tsx`)
167. `[ ]` File upload endpoint + size/type limits (`/api/application/upload`)
168. `[ ]` Submit application (`/api/application`)
169. `[ ]` Verification timeline / status (`VerificationTimeline.tsx`)
170. `[ ]` Companion dashboard header + stats (`CompanionDashHeader/Stats.tsx`)
171. `[ ]` Companion bookings — accept/decline (`/api/companion/bookings/[id]/decline`)
172. `[ ]` Companion availability editor (`CompanionDashAvailability.tsx`)
173. `[ ]` Companion earnings (`/api/companion/earnings`)
174. `[ ]` Companion payout details (`CompanionDashPayout.tsx`)
175. `[ ]` Companion profile editor (`/api/companion/profile`)
176. `[ ]` Companion messages (`/api/companion/messages`)
177. `[ ]` Role gate — member cannot open companion dashboard

## 11. Safety, trust, reporting

178. `[ ]` SOS button — live during meetup (`SosButton.tsx`, `lib/safety/sos.ts`)
179. `[ ]` Report button + reasons (`ReportButton.tsx`, `/api/reports`)
180. `[ ]` Safety journey page (`SafetyJourney.tsx`, `app/safety`)
181. `[ ]` Trust page + KYC claims — **copy must match reality**
182. `[ ]` Verify page (`app/verify`)
183. `[ ]` Block / suspend effects visible to user

## 12. Admin panel

184. `[ ]` Admin gate — non-admin redirected (`server/admin.ts`)
185. `[ ]` Admin bootstrap via `ADMIN_EMAILS` on first visit
186. `[ ]` Admin overview (`app/admin`)
187. `[ ]` Users — list, search, suspend, ban, promote (`admin/users`)
188. `[ ]` Companions — approve, suspend, edit (`admin/companions`)
189. `[ ]` Applications — review queue, approve/reject (`admin/applications`)
190. `[ ]` Bookings — view, cancel, refund (`admin/bookings`)
191. `[ ]` Payouts (`admin/payouts`)
192. `[ ]` Discounts / promo codes (`admin/discounts`)
193. `[ ]` Surge pricing (`admin/surge`)
194. `[ ]` Reports queue — act on user reports (`admin/reports`)
195. `[ ]` Audit log — every admin action recorded (`admin/audit`, `logAdminAction`)
196. `[ ]` Admin action form — optimistic + error states (`ActionForm.tsx`)
197. `[ ]` Admin UI polish — tables, empty states, confirmations
198. `[ ]` Admin can reach every entity in the product (coverage check)

## 13. Legal, privacy, data rights

199. `[ ]` Privacy policy (`app/privacy`)
200. `[ ]` Terms (`app/terms`)
201. `[ ]` Cookies page + consent banner (`ConsentBanner.tsx`, `lib/consent.ts`)
202. `[ ]` Refunds policy (`app/refunds`)
203. `[ ]` Data export (`/api/user/export`)
204. `[ ]` Account deletion / erasure (`/api/user/delete`, `erase.ts`)
205. `[ ]` Grievance officer details real (DPDPA) (`lib/company.ts`)
206. `[ ]` Contact form → DB + email (`/api/contact`)

## 14. Content pages

207. `[ ]` About (`app/about`)
208. `[ ]` How it works (`app/how-it-works`, `HowItWorksJourney.tsx`)
209. `[ ]` Blog (`app/blog`)
210. `[ ]` Careers (`app/careers`)
211. `[ ]` Press (`app/press`)
212. `[ ]` Quiz — questions, result, persistence (`QuizClient.tsx`)
213. `[ ]` Spin page (`app/spin`)
214. `[ ]` Styleguide — dev-only, not exposed in prod (`app/styleguide`)

## 15. Platform / cross-cutting

215. `[ ]` Health endpoint (`/api/health`)
216. `[ ]` Cron endpoint + `CRON_SECRET` (`/api/cron`)
217. `[ ]` Rate limiting — Upstash vs in-memory fallback (`rateLimit.ts`)
218. `[ ]` SEO — title, description, canonical, OG per page (`lib/seo.ts`)
219. `[ ]` `NEXT_PUBLIC_SITE_URL` correct **(BROKEN: `your-app.vercel.app`)**
220. `[ ]` Sitemap + robots
221. `[ ]` Analytics — GA, PostHog, consent-gated (`analytics.ts`)
222. `[ ]` Web vitals reporting (`WebVitals.tsx`)
223. `[ ]` Sentry — client, server, edge
224. `[ ]` CSP — currently Report-Only, `unsafe-inline`
225. `[ ]` Env placeholder discipline (`lib/env.ts`)
226. `[ ]` No fake/demo data leaking into production paths
227. `[ ]` Image optimisation + `hero.mp4` weight (2.48 MB)
228. `[ ]` Currency formatting everywhere (`lib/money.ts`)
229. `[ ]` Date/time formatting + timezone (IST)
230. `[ ]` Error messages — never leak internals

---

## Audit log

_Appended as each item is checked. Date, item, finding, fix._

### 2026-07-14 — round 1

**Fixed**

- **#1, #2 (Nav / NavUser), #63 (Explore)** — every public page fired `/api/user` and
  `/api/notifications` for signed-out visitors, producing three 401s in the console of
  the landing page. `Nav` is in the root layout, so this ran everywhere; in production
  each one becomes a Sentry event on every anonymous hit. Added `lib/useViewerReady.ts`
  (viewer slices are only readable when the data client is `local`, or the visitor has a
  session) and an `enabled` flag on `useData`. Gated `Nav`, `NavUser`, `ExploreClient`.
  Deliberately **not** `AccountGate` — it redirects on `!loading && !user`, so skipping
  the read would bounce a signed-in user out of their own dashboard while the session was
  still resolving. Verified: home console went 3 errors → 0. `tsc` clean, 368 tests pass.

**Verified working (driven in a real browser, real Neon DB)**

- **#41–#48** — email OTP sign-in end to end. Code renders on screen in test mode with an
  honest explanation, 6-digit input, verify mints a real session, redirects to
  `/explore?welcome=1`, nav switches to wallet + bell + account menu.
- **#63** — explore loads the catalogue from the database (22 companions).
- **#184, #185, #186** — admin gate, `ADMIN_EMAILS` bootstrap promotion on first visit,
  and the admin overview rendering live figures (revenue ₹199, 2 users, 22 companions,
  2 bookings, 0 reports).

### 2026-07-14 — round 2

**Fixed**

- **#205** — the footer of every page read `Grievance Officer: Grievance Officer`: the
  placeholder name in `lib/company.ts` fell back to the string `'Grievance Officer'`, and
  all four call sites already print the role as a label. `COMPANY_DISPLAY.grievanceOfficer.name`
  is now `null` when unfilled, and a single `GRIEVANCE_OFFICER_LABEL` export handles the
  omission so footer/terms/privacy/contact cannot each invent their own. Renders
  "Grievance Officer · grievance@trycompanio.com". **Still outstanding:** DPDPA requires a
  real, named, reachable officer — the name itself must be supplied.
- **#218 (admin)** — all ten admin pages inherited the marketing `<title>`. Added a title
  template in `app/admin/layout.tsx` plus a `metadata.title` per page: now
  "Users · Companio Admin". Also added `robots: noindex, nofollow` — `/admin` redirected
  non-admins, but a redirect is not a robots directive, so the URLs were crawlable.
- **#197 (admin UI)** — the ten tabs were identical links with no active state. Extracted
  `components/admin/AdminTabs.tsx`: pill styling, `aria-current="page"` on the current tab,
  sticky header, horizontal scroll instead of wrapping on a phone. Verified in-browser:
  title, active tab and robots tag all correct.

### 2026-07-14 — round 3

**Fixed**

- **#19/#20 (a11y)** — the root layout renders a "Skip to content" link targeting
  `#main-content`, but 17 pages had no `<main>` at all: `/dashboard`, all ten `/admin`
  pages, `/book`, `/pricing`, `/spin`, `/how-it-works`, `/companion/[id]`, `/quiz`. The
  first thing a keyboard user tabs to jumped nowhere, and those pages exposed no main
  landmark to a screen reader. All now carry `<main id="main-content">` (admin via its
  layout). Every page in the app is covered — verified by sweep + in-browser.

**Verified working (driven in a real browser, real Neon DB)**

- **#66, #67, #88** — the paywall. Signed in but unpaid: exactly one free-preview profile
  is clickable, the other seven are blur-locked with the real data redacted server-side.
- **#91, #92, #93, #94, #103, #104, #108** — the ₹199 unlock, end to end. Sheet opens with
  an honest test-mode banner; pay button correctly refuses until a method is chosen and
  says so ("Select a payment method to continue"); paying calls `/api/test-checkout`,
  which settles through the same `settlePurchase()` the real webhook uses. All 8 profiles
  unlock, and it **survives a refresh** — `/api/user/unlocked` returns `true` from the DB.

**Open — polish, found while auditing**

- **#66 (flash of paywall)** — on reload, a paying member sees the blurred "Unlock to book"
  state for one round trip before the session resolves and the real data arrives. Lock
  state starts at `false` and there is no "not yet known" state, so the UI renders the
  paywall as its default. A paying customer should never be shown the paywall, even for
  200ms. Needs a tri-state (`unknown | locked | unlocked`) with a skeleton for `unknown`.

### 2026-07-14 — round 4

**Fixed — the notification system was wired to a table nothing wrote to**

- **#148–#152** — booking a meetup and paying ₹199 produced **no notification of any kind**.
  `notifyBookingCreated()` and `notifyPurchaseSettled()` both opened with
  `if (!envValue('RESEND_API_KEY')) return;` — they were email-only, and email is dormant
  on every deployment today. The only code in the entire app creating a `Notification` row
  was the companion decline route, so the bell and the notifications panel read from a
  table nobody populated.

  Restructured `lib/server/notify.ts` around two unequal channels: `pushNotification()`
  writes the in-app row **always and first**; email is the optional extra that happens when
  a key exists. Also wired `notifyPurchaseSettled()` into `/api/test-checkout` — that route
  exists to be a faithful stand-in for a payment, and a payment nobody is told about is not
  faithful. Verified end to end: booking a meetup now produces "Meetup confirmed — You're
  meeting Aarav Mehta on Saturday, 18 July at Powai Lake promenade for City Walk", and the
  nav bell reads "Notifications, 1 unread".

- **#111–#114 (wrong balance shown)** — `OverviewPanel` read the wallet with a hard-coded
  fallback of `{ credits: 2, used: 0 }`, and `useData` returns its fallback until the real
  read lands. So a member who had already spent both included meetings was shown
  "2 meetings remaining, worth ₹998" on every dashboard load before it silently corrected
  to 0. A guessed balance is indistinguishable from a real one to the person reading it.
  Fallback is now `null` with a skeleton until the truth arrives. Verified: goes straight
  to "0 remaining, worth ₹0"; ₹998 never renders.

**Verified working (driven in a real browser, real Neon DB)**

- **#57 (age gate)** — first booking demands a date of birth, 18+, asked once, persisted.
- **#118–#128, #131** — the booking wizard end to end: activity → date → time → place →
  review. Dates are real (today = 14 Jul), Continue is correctly disabled until each step is
  answered, the review shows "₹0 today · uses 1 of your 2 included meetings", the safety
  acknowledgement modal blocks confirmation until the checkbox is ticked, and confirmation
  produces a booking row with `usedCredit: true`, `pricePaid: 0` and a meetup code.
- **#115** — credits decrement atomically in the same transaction as the booking
  (`credits: 0, used: 2` after two bookings — the API is right; only the UI was lying).
- **#138** — the Next Meetup card shows the real upcoming booking.

### 2026-07-14 — round 5

**Verified working (driven in a real browser, real Neon DB)**

- **#141–#146** — messaging. Conversations are derived from real bookings (Aarav, Meghna);
  the thread has a proper empty state; a message sends, persists and renders. **Contact
  scrubbing works**: a message containing "9876543210" was refused with "Numbers and emails
  are hidden until you've met", and never reached the API. A clean message went through.
- **#148, #149, #150** — the notifications panel shows "1 UNREAD", a relative timestamp and
  the real body; "Mark all read" flips `read: true` in the database, clears the panel, and
  updates the **nav bell live in another component** without a reload — the `dataEvents`
  cross-component refresh is sound. Tab state is reflected in the URL (`?tab=notifications`).

### 2026-07-14 — round 6 (admin)

**Verified working (driven in a real browser, real Neon DB)**

- **#186–#198** — all ten admin pages render real content with no errors (overview, users,
  companions, applications, bookings, discounts, reports, payouts, surge, audit).
- **#188, #198 (admin really controls the product)** — the companions page exposes Create,
  Save changes, Mark verified, Make premium, Suspend, Ban, Delete and Link account.
  Suspending a companion dropped the **public** catalogue from 22 to 21 immediately, the
  control flipped to Unsuspend, and unsuspending restored it to 22.
- **#195** — the suspend was recorded in the admin audit log.

### 2026-07-14 — round 7

**Fixed — the product was breaking its own published refund policy**

- **#129 (cancel forfeited the credit)** — `/refunds` states: *"If you cancel more than 24
  hours before a meetup, the credit returns to your wallet instantly. Inside 24 hours, the
  meetup counts as used."* `POST /api/bookings/[id]` did not implement it — it flipped
  `status` to `cancelled` and nothing else. A member who cancelled a week early silently
  forfeited one of the two meetings they had paid ₹199 for. The companion-decline path
  already returned credits correctly; the member-cancel path never did.
  Now returns the credit inside a `$transaction` (status + `credits +1` + `used -1` +
  a `refund` ledger row, all or nothing), gated on the **real** meetup start. Verified live:
  cancelling a booking ~26h out returned `{ creditReturned: true }` and the wallet went
  `credits 0 → 1, used 2 → 1`.

- **#121, #138 (the countdown was wrong)** — `FlipPill` was handed `booking.dateISO` and did
  `new Date("2026-07-15")`, which JavaScript parses as **UTC midnight** = 05:30 IST. So the
  countdown ignored the time slot entirely and every meetup counted down to half past five
  in the morning, up to ~14 hours short. Worse, a meetup booked for **today** had a target
  already in the past, so the countdown returned null and vanished on the one day it matters.
  Added `lib/meetupTime.ts` (date + slot → a real instant in IST; unknown slots fall back to
  midday, never midnight) with 7 unit tests. Verified live: a Wed-evening meetup now reads
  "1 day 1 hour" (17:00 tomorrow) instead of "14 hours". Also fixed the screen-reader string,
  which announced "in 1 days, 1 hours".

- **#156 (spin advertised a prize that could not be won)** — `/api/spin` returns
  `nothingToWin: true` once the unlock is bought, because the only prize is a discount on
  that unlock. `SpinWheel` honoured it; `SpinBanner` did not — it read only `canSpin`, so a
  paid member was invited on every dashboard load to "try your luck for a discount" on
  something they already owned. Note the first attempt at this fix was wrong: routing it to
  the existing `unknown` state still rendered a generic "Spin the wheel for a discount"
  banner. Added a real `hidden` state that renders nothing.

**Verified working (driven in a real browser, real Neon DB)**

- **#203 (data export)** — `/api/user/export` returns a complete DPDPA-grade export: profile,
  wallet **with its full credit ledger**, bookings, messages, notifications, and purchases
  including invoice number and GST field.
- **#177 (role gate)** — `/api/companion/dashboard` and `/api/companion/earnings` both answer
  `403 not_a_companion` to a member account.
- **#89, #147 (favourites)** — toggle on and off, persisted both ways.
- **#129 (cancel)** — cancelling flips the status and fires a "Booking cancelled" notification.
- **#178 (SOS)** — every upcoming booking card carries an SOS / live-location control.

### 2026-07-14 — round 8

**Fixed — a privacy misstatement on the screen where people hand over a government ID**

- **#165, #167 (verify step lied about what it stores)** — `WizardStepVerify` showed
  "Demo mode — nothing is uploaded or stored" **unconditionally**. That is true in `local`
  mode and false in `http` mode, which is what production runs: `ApplyWizard.handleSubmit`
  posts both files to `/api/application/upload`, and the server persists a one-way hash of
  each, the masked ID number, and the OCR hint. So an applicant handing over an Aadhaar or
  PAN was told it was not being stored while a fingerprint of it was. The badge is now gated
  on the same flag that decides whether the upload happens, and in http mode reads
  "We never store your ID image — only a one-way fingerprint and the last digits", which is
  what the endpoint actually does. Verified in the live wizard.

  (The upload endpoint itself is good work and was not the problem: magic-byte file
  validation, Aadhaar Verhoeff / PAN structure checks, duplicate-document detection across
  applicants, no raw image retention, and nothing is ever auto-marked `verified`.)

- **#220, #224 (robots)** — `/admin` was not disallowed. It redirects non-admins and now
  sends `noindex`, but neither stops a crawler requesting the URL. Added `/admin`, `/login`,
  `/register`, `/styleguide` to `robots.txt`.

- **#218, #219 (the site published a domain nobody owns)** — `SITE_URL` was
  `NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'`. With the placeholder
  `https://your-app.vercel.app` set in Vercel, the deployment published a **sitemap, canonical
  tags and og:url for a domain we do not own**; with the variable simply unset it would have
  advertised `localhost:3000`. `lib/seo.ts` now ignores obvious placeholder origins and falls
  back to the domain Vercel injects (`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`, then
  `NEXT_PUBLIC_VERCEL_URL`), so a correct canonical origin needs no configuration at all.
  6 unit tests. **This means the live deploy self-corrects even before the env var is fixed.**

**Verified working (driven in a real browser, real Neon DB)**

- **#179, #194 (reporting, member → admin)** — the report modal on a companion profile
  submits, confirms ("Our trust team reviews every report within 24 hours"), and the report
  appears in the admin reports queue with its detail text.
- **#158–#164 (companion application)** — the apply wizard recognises the signed-in user,
  validates each step, offers activity selection and a rate slider with local market
  guidance, and runs client-side OCR against the ID number.

### 2026-07-14 — round 9

**Fixed — reviews were collected and then thrown in a drawer**

- **#84, #85, #153 (reviews never reached the companion)** — `Companion` has carried
  `rating`, `reviewCount` and `reviewsList` since the schema was written and **nothing ever
  wrote to them**. A member was asked to rate a meetup, thanked, and the answer was stored on
  `Booking.review` and read by nobody: every companion sat at rating 0 with an empty review
  list forever, however many five-star meetups they had. (This is why every Explore card
  showed `rating: 0`.) `lib/data/companions.ts` even records the intent — *"Real reviews will
  come from Booking.review rows and carry the reviewer's actual first name"* — it was simply
  never wired.

  Added `lib/server/reviews.ts`: on review submission the companion's aggregate is
  **recomputed from the booking rows**, never incremented — so an edited or removed review
  heals the average instead of skewing it permanently. Bare star ratings count towards the
  average; only reviews with text are listed. Verified live: the profile went from
  "New / rating 0" to **"REVIEWS 5.0 (1 review)"** with the reviewer's real first name.

- **#84 (dangling separator)** — the review byline rendered `{name} · {city}`, and city is
  optional on a real account, so a reviewer who never set one displayed as "Friend · ".

**Verified working (driven in a real browser, real Neon DB)**

- **#190 (admin bookings)** — Mark complete, Refund, and Cancel + refund credit are all
  present; "Mark complete" moved a booking to `completed` and it appeared under Past in the
  member's dashboard.
- **#153 (review gating)** — "Rate your meetup" appears **only** on completed bookings, never
  on cancelled ones; the submit button stays disabled until a star is chosen.

### 2026-07-14 — round 10 (companion side)

**Verified working (driven in a real browser, real Neon DB)**

- **#170–#177** — the companion dashboard. Linked an account to a companion from admin, and
  the role gate flipped immediately (`/api/companion/*` went 403 → 200). The dashboard renders
  performance stats, earnings (owed / paid out / lifetime), messages, upcoming meetups,
  availability, an activity picker, a rate slider, the bio editor and payout (UPI) details —
  zero console errors, correct empty states throughout.
- **#172, #175 (companion edits reach the public site)** — changing availability and saving
  the profile propagated to `/api/companions/[id]`: rate, activities and availability all
  updated on the public record. "Changes saved" toast confirms it (2.5s, easy to miss).
- **#187 (admin link/unlink)** — `Link account` promotes an account to a companion and
  `Unlink` demotes it back to member; verified the role gate flips both ways.

**Noted — admin UX gap, not a bug**

- `Link account` takes a **raw user cuid** typed into a text box. An operator has no way to
  look one up from that screen, so in practice this control is unusable without going to the
  database. It wants a search-by-email picker.

### 2026-07-14 — round 11

**Fixed**

- **#205 (follow-up to my own fix)** — replacing the grievance name with a label left a
  dangling comma in the prose on /privacy and /contact: *"contact our Grievance Officer, at
  grievance@trycompanio.com"*. The comma belongs to the name, not the sentence. Added
  `GRIEVANCE_OFFICER_PHRASE` for mid-sentence use. Now reads "…our Grievance Officer at
  grievance@trycompanio.com", and will read "…our Grievance Officer, Asha Rao, at …" the
  moment a real name is filled in.

**Verified working (driven in a real browser, real Neon DB)**

- **#212 (quiz)** — all seven steps, including multi-select, the empathy-echo interstitials
  and the labour-illusion screen, ending in "We found 8 companions in Indore, Friend. Top
  match Meghna Joshi ★ 5.0 (1)". The star rating there is the review submitted earlier in
  this audit, which confirms the new aggregation propagates into matching results too.
- **#206 (contact form)** — validated server-side; a payload missing `topic` is rejected with
  a field-level error rather than silently accepted.
- **#179, #194 (report validation)** — same: a malformed report is rejected with a typed
  field error.
- **#224 (security headers)** — HSTS (2 years, preload), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and
  a `Permissions-Policy` that closes camera and microphone. CSP remains **Report-Only** with
  `unsafe-inline`/`unsafe-eval` — enforcing it needs a deliberate pass over framer-motion's
  inline styles and Razorpay's checkout script, so it stays a pre-launch item rather than a
  blind flip.
- **#19** — the quiz's duplicated question text is not a bug: one is the visible `<h2>`, the
  other an `sr-only` `<legend>` for the fieldset. Correct practice.

### 2026-07-14 — round 12 (discount codes: built, on request)

**Built — /admin/discounts could mint codes that nothing on the site would accept**

- **#192 (discount redemption)** — the admin panel could create codes (percentage or fixed,
  with expiry and max-uses) and **no member could ever use one**: no field asked for a code,
  no route validated one, no purchase recorded one. A launch promotion ran into a void.
  (The *spin* discount was fine — `create-order` already applied it to the real charge.)

  Added, with the schema change authorised by the owner:
  - `prisma/migrations/…_purchase_discount_code` — one additive nullable column,
    `purchases.discountCode`. Applied to Neon via `migrate deploy` (never `migrate dev`,
    which can offer to reset a database with drift).
  - `lib/server/discounts.ts` — the pricing arithmetic is **pure and exported**, so what a
    customer is charged is directly testable. Percentage clamped to 0–100, fixed never goes
    negative, rounding favours the customer rather than shaving paise.
  - `POST /api/discounts/validate` — preview only, rate-limited (a code field is an oracle
    for guessing codes otherwise). It reserves nothing and is **not trusted**: create-order
    looks the code up again and recomputes the amount from the database.
  - `create-order` applies the code **after** a spin win so the two stack, and **refuses the
    order** if the code is bad rather than silently charging full price to someone who
    believes they have a discount.
  - `settlePurchase` increments `usedCount` — *there*, after money has moved, inside the
    transaction and behind the idempotency anchor. Incrementing at order time would let a
    limited code be exhausted by people who opened the sheet and walked away.
  - `UnlockSheet` — a code field, an applied-state chip with the new price, and a Remove.

  **A 100% code is refused, not clamped.** Razorpay cannot charge below ₹1; quietly billing
  ₹1 for a "100% off" code is the kind of small lie this codebase keeps being cleaned of.

  **Verified end to end where it can be:** an admin-created code (`AUDIT10`, 10%) applied in
  the real sheet as a signed-in unpaid member — "Code AUDIT10 applied", pay button went
  ₹199 → **₹179.10**; Remove restored ₹199; a bogus code showed "That code isn't valid" and
  **left the price at ₹199**. Case-insensitive (`audit10` = `AUDIT10`).
  **Not verifiable:** the actual charge. `/api/razorpay/create-order` answers 503 without
  Razorpay keys, so the gateway leg of this is covered by unit tests only (13 of them) and
  must be smoke-tested the day real keys land.

**Fixed — admin**

- **#187** — `Link account` demanded a raw user cuid typed into a box, with no way to look one
  up. It now accepts an **email** (or still an id), and says "No account found for X" instead
  of letting Prisma throw an unexplained P2025. Verified by linking via email.

**Open — needs something only the owner can provide**

- **#205** — the Grievance Officer's real name and phone (DPDPA).
- **#219** — `NEXT_PUBLIC_SITE_URL` in Vercel is literally `https://your-app.vercel.app`,
  so `og:url` and canonical point at a domain we do not own. One env change + redeploy.
- **#43** — Google sign-in blocked in production: the redirect URI
  `https://companio-bice.vercel.app/api/auth/callback/google` is not registered on the
  OAuth client. Google Cloud Console, not this repo.

### 2026-07-14 — round 13 (data rights: the settings screen that did not exist)

**Fixed — the privacy policy described a screen nobody had built**

- **#204** — the privacy policy says, of your rights under the DPDP Act: *"You can export or
  delete your account data anytime from settings."* The contact page repeats it: *"You can
  also delete your account and all its data yourself, from your dashboard, at any time."*
  **There was no settings screen.** `/api/user/export` and `/api/user/delete` both existed,
  both worked, and **nothing in the app called either one** — a legally binding document
  promising a control that shipped with no way to reach it.

  Added a sixth dashboard tab, **Account** (`components/dashboard/AccountPanel.tsx`):
  download a copy of your data, and delete your account behind a typed `DELETE`
  confirmation. In local demo mode it is honest about the difference — the data is in your
  browser, so the export is built from localStorage and the delete clears it.

**Fixed — erasure destroyed records that were not the member's to erase**

Two foreign keys cascaded when they should have severed. Migration
`20260714140000_survive_erasure` relaxes both (no row changes, nothing dropped):

- **#204a — `purchases.userId`, CASCADE → SET NULL.** Deleting a member deleted their
  payments. The privacy policy promises the opposite ("payment and tax records, typically
  kept for up to 8 years"), and the company's own revenue figure quietly shrank every time
  someone left. The payment now survives the person: `userId` goes null, the money stays on
  the books.
- **#204b — `companion_payouts.bookingId`, CASCADE → SET NULL.** Deleting a member deleted
  their bookings, and the cascade deleted the **companion's unpaid wage** for a meetup that
  had actually happened. Someone else's privacy right was erasing a third party's money.
  The payout row carries its own `companionId` and `amountPaise`, so it now stands alone,
  and the admin payouts page says "Booking deleted (member erased their account)" rather
  than crashing on a null.

- **#204c** — a companion who erased their login left their **profile live on the
  marketplace**: photo, bio and name still published, still bookable, with no account behind
  it. `eraseUser` now suspends the profile (it cannot delete it — other members' bookings
  point at it). Payout details are kept, because we may still owe them money.

- **#204d** — `lib/server/erase.ts` claims it is shared by the admin panel and the erasure
  endpoint "so the two can't drift". The endpoint had its own copy of the transaction and
  they **had** drifted. One implementation now.

- **#203** — the export claimed to return "all data owned by the signed-in user" and omitted
  spin results, reports the member filed, and the companion profile their login owns. All
  three added. Reports filed *against* them stay out on purpose: handing over a copy would
  reveal who reported them.

**Verified against the real Neon database, in a real browser.** Signed in as a throwaway
account, bought the ₹199 unlock through the test checkout, then deleted the account from the
new Account tab. Result: signed out to the home page, `user` row **gone**, and the purchase
row **still there with `userId: null`** — the row that the old cascade would have destroyed.
Export returned 200 with `Content-Disposition: attachment` and all the new sections present.
Test data removed afterwards.

`tsc` clean · 397 tests pass (3 new erasure tests).

### 2026-07-14 — round 14 (the refund tap, and the inbox nobody could open)

**Fixed — the contact form wrote to a table no screen could read**

- **#212** — `/api/contact` faithfully saved every message into `contact_messages` and then
  tried to email a copy. The email is gated on `RESEND_API_KEY`, which is unset, and **no
  admin page read the table**. So a safety concern, a privacy request or a refund ask typed
  into the contact form was persisted, correctly, into a void — nobody would ever see it.
  Added `/admin/messages` (a new **Inbox** tab): oldest-unhandled first, refund/safety/privacy
  flagged in red, a "Mark handled" action, and — because it matters — each row says whether
  the copy actually left Resend or whether *this screen is the only place the message exists*.

**Fixed — the refund policy promised a button that did not exist**

- **#213** — the refund policy: *"Full refund within 7 days of unlocking, no questions asked.
  **One tap from your dashboard.**"* There was no tap, no route, nothing. Same failure as the
  settings screen in round 13: a policy describing a control nobody built.

  Added `POST /api/user/refund` + a card in the dashboard's Account tab. It does **not** move
  money and does not pretend to — a Razorpay refund needs the live secret key, and a route
  that claimed to have refunded you while doing nothing would be lying at the exact moment it
  matters most. Instead it decides eligibility **server-side from the purchase row** (a paid
  unlock, inside the 7-day window; never anything the client says), and files the request into
  the new admin inbox with the purchase id and the Razorpay payment id to refund against.
  Tapping twice does not create a second request. The refund policy was reworded to say what
  now actually happens — request in one tap, refunded to the original method within 5 working
  days — instead of implying an instant self-service reversal.

**Fixed — the money split could ship a number the payout contradicts**

- **#25** — `components/home/MoneySplit.tsx`, the section whose entire subject is *not lying
  about money*, hard-coded an **85 / 15** split — headline, animated bar, both counters and
  the screen-reader label. The server takes **30%** (`COMMISSION_STD_BPS`), so the companion
  gets 70%, not 85%. **It is dead code** — the component is imported nowhere, so no member
  ever saw it — which is the only reason this is not a shipped lie. The constants now live in
  `lib/money.ts` (the module that exists *because* the UI and the server drifted on money
  once before), `lib/server/pricing.ts` re-exports them, and every number in the section is
  derived from them. It can no longer print a split the payout does not honour.

**Noted — dead home components**

  Nine components under `components/home/` are imported nowhere: `BelongingBand`, `Chapters`,
  `CursorStickers`, `HowItWorks`, `MoneySplit`, `ProcessSection`, `SafetyBand`,
  `SparkleCluster`, `SplineBentoTile`. Left in place (they may be wanted), but they are where
  stale claims hide — MoneySplit is exactly that. Worth a deliberate keep-or-delete pass.

**Verified in a real browser against the real Neon database.** Signed in as a fresh member:
with no purchase, the refund card is **correctly absent**; after buying the ₹199 unlock the
server offered `{eligible: true, amountPaise: 19900, daysLeft: 7}` and the card read "Full
refund of ₹199 — 7 days left". Tapped it → "Refund requested…". Signed in as the admin →
the request was in the Inbox, tagged **Refund request**, carrying the purchase id and the
Razorpay payment id, marked "not emailed (no email service configured)". Marked it handled →
"Nothing waiting." A non-admin hitting `/admin/messages` is bounced to the home page. Test
data removed afterwards.

`tsc` clean · 397 tests pass.

### 2026-07-14 — round 15 (the content pages, and the consent you could not withdraw)

**Fixed — the last page still advertising a background check we do not run**

- **#209** — `/blog` described our verification as "ID matching, selfie checks, and
  **background screening**". There is no background screening: the application collects
  `backgroundConsent` so that we *could* run one, and none is run. Terms, privacy, trust,
  safety and the passport component had all already been made honest about this in earlier
  rounds — the blog was the one page left still selling it, and a safety claim is the worst
  possible place to leave one lying around. It now describes what actually happens: a
  government ID checked against the number the applicant typed, a photo confirmed to be a
  different image from the document, and a person who reviews every application by hand.

**Fixed — the "how we make money" section listed three revenue streams that do not exist**

- **#207** — `/about` said Companio earns from "a small commission on each booking, optional
  Companio Plus membership, and credit packs". Companio sells **one thing**: the ₹199 unlock.
  Bookings are not charged for (`MARKETPLACE_PAYMENTS_ENABLED` is deliberately unset), Plus
  is not on sale, credit packs are not on sale — and the commission, when it arrives, is 30%,
  which is not "small". Getting this wrong on the page whose subject is being honest is not a
  small thing. Rewritten to the truth, with a promise to state the commission before charging it.

**Fixed — two contact addresses that could not receive mail**

- **#210, #211** — `/press` and `/careers` both told you to write to `@companio.example`,
  annotated "(Demo site, this address is illustrative.)" — sitting under a footer carrying a
  real company name, a real LLPIN and a real registered address. A press page that cannot be
  contacted is not a press page. Both now link to the contact form, which since round 14 goes
  to a mailbox that actually exists. `InfoSection.body` widened from `string[]` to
  `React.ReactNode[]`, because telling someone to "use the contact form" without giving them
  the link tells them nothing.

**Fixed — consent could be given and never taken back**

- **#221** — the cookie policy: analytics are "aggregate-only … and **you can opt out in
  settings**". The consent banner could take a *yes* and there was nowhere in the entire
  product to change it to a *no*. Under the DPDP Act, withdrawing consent must be as easy as
  giving it. Added an **Analytics** switch to the Account tab, reading and writing the same
  store the banner uses, so the two can never disagree.

  The deeper bug: the gtag Consent Mode update lived **in the banner**, and only fired on
  `granted`. That was survivable while the banner was the only caller — but the moment a
  second one existed, withdrawing consent would write `denied` to localStorage while gtag
  carried on with `analytics_storage: granted`. **An opt-out that never reaches the tag is not
  an opt-out.** The Consent Mode push now lives inside `setConsent()`, so every path — banner,
  switch, anything added later — tells Google the same thing the app believes.

**Verified in a real browser.** The switch picked up the `granted` state left by the banner,
flipped to "Analytics off", and persisted `denied`. `/press`, `/careers`, `/about` and `/blog`
all render; the press and careers pages now carry a working `/contact` link. No page anywhere
in `app/` still claims a background check or points at an `@companio.example` address.

`tsc` clean · 397 tests pass.

### 2026-07-14 — round 16 (weight and the CSP flip)

**Measured, not guessed.** Loaded every reachable page in a real browser and read
`performance.getEntriesByType('resource')`:

- **Home: 1,318 KB total, of which `hero.mp4` is 1,299 KB — 98.5% of everything the page
  transfers.** Nothing else on the page breaks 40 KB, and scrolling to the bottom adds only
  4 KB, so the Lottie animations are genuinely lazy.
- `/how-it-works`: 281 KB total, the largest single asset a 63 KB (gzipped) Lottie. Healthy.

  The hero video is **already gated properly** — it is skipped entirely for
  `prefers-reduced-motion`, for `saveData`, and for 2G/3G connections, and it is deferred past
  first paint so it never competes with the LCP text. What it is, is simply a 1.3 MB file.
  Re-encoding it is an owner action (no `ffmpeg` in this environment); a comment claiming it
  weighed "2.5 MB" was stale and now states the real figure.

**Fixed — 7.79 MB of PNG to paint a thumbnail**

- **#40** — three of the twelve cursor stickers shipped at their original export resolution:
  `books.png` at **4226×2817 (2.6 MB)**, `camera.png` at **3159×2865 (3.8 MB)**, `cake.png` at
  **1300×975 (1.6 MB)** — while the other nine were already 256×256 and ~35 KB each. They are
  drawn at roughly 120 px. Resized to match their siblings via `scripts/resize-stickers.mjs`
  (sharp, `fit: contain`, transparency preserved, idempotent): **8.3 MB → 436 KB, 7.79 MB
  saved.** All three verified visually afterwards — the artwork is intact, not a blank square.

  Worth being precise: `CursorStickers` is one of the orphaned components, so these bytes were
  **never actually served to anyone**. This is dead weight removed from the repo and the deploy,
  not a live page made faster. It also means the component is now safe to mount, which it was
  emphatically not before.

**CSP — the deliberate pass, finally done**

- **#218** — checked the Report-Only policy in a browser against every page that exists:
  `/`, `/explore`, `/explore?view=map`, `/spin`, `/quiz`, `/pricing`, `/dashboard`,
  `/how-it-works`, `/admin`. **Zero violations.** The policy is also more complete than the
  earlier note implied — `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and
  `frame-ancestors 'none'` are all present and correct.

  **It is still not flipped, and deliberately so.** Razorpay Checkout is the one flow that
  cannot be exercised here (no live keys), and a CSP that blocks the payment sheet is worse
  than no CSP at all. Checkout needs three origins this policy did not list —
  `cdn.razorpay.com` (assets), `lumberjack.razorpay.com` (beacons), and `api.razorpay.com` in
  `frame-src`, not just `checkout.razorpay.com`. Added, so the eventual flip does not take the
  payment sheet down with it. **These came from Razorpay's published requirements, not from
  watching a real payment succeed** — that distinction is written into `proxy.ts` along with
  the exact steps to flip, and the caveat that `script-src` still carries `'unsafe-inline'`
  and `'unsafe-eval'`, so enforcing buys the origin allowlist (`connect-src` being the one
  that matters: it stops exfiltration to an unknown host) but is not yet XSS-proof. Nonces are
  the follow-on.

`tsc` clean · 397 tests pass.

### 2026-07-14 — round 17 (the milestone nobody earned, and the welcome nobody saw)

**Fixed — the welcome moment never played in production**

- **#33** — `WelcomeOverlay` read `getUser()` and `getWelcomed()` straight from
  `lib/journeyState`, which reads **localStorage**. In http mode — which is every real
  deployment — the member lives in Postgres and localStorage is empty, so `getUser()` was
  always `null`, the overlay never left its `idle` phase, and **the celebration simply did
  not exist for a single real user.** Both sign-in paths (`LoginForm`, `StepDone`) redirect to
  `?welcome=1` to trigger it, and *nothing anywhere reads that parameter* — it has been
  written and ignored this whole time.

  Now goes through `dataClient`, like every other piece of state in the app, so it works in
  both modes. The member's name is captured from the same read that decides whether to play,
  rather than a second localStorage lookup that would have returned "friend" for everyone.

  **Verified:** signed up a brand-new account against the real database → **"Welcome, Friend"**
  played on `/explore?welcome=1`; `companio_welcomed` in localStorage stayed `null` (the flag
  went to the server, correctly) and `/api/user/welcomed` returned `true`; revisiting `/explore`
  did **not** replay it.

**Fixed — a milestone shelf whose first milestone was awarded for existing**

- **#34** — `StampShelf` granted a **"Verified member"** stamp with `earned: true` —
  hard-coded, to everybody, including a signed-out guest previewing the dashboard. Nothing was
  verified; members are not ID-checked (companions are). This is the same fake-trust-signal
  pattern this codebase has spent several rounds deleting from `PassportStack`, `TrustCarousel`
  and `StatShowcase` — it just survived inside the gamification.

  Replaced with **"Age confirmed"**, which is a real thing a member does, which the server
  actually enforces (`lib/server/age.ts` refuses bookings without a date of birth), and which
  can genuinely be unearned. Verified: an account that has never given a date of birth now
  shows it as an *unearned* future slot, where it previously showed a granted stamp.

**Fixed — "★ 0 (0)" in the one screen built for comparing**

- **#31** — the compare modal formatted its star row by hand, so a companion nobody has
  reviewed yet rendered as **"★ 0 (0)"** — in the exact place a member weighs two companions
  against each other, where zero stars reads as *rated badly*, not *new*. The card behind the
  modal already used `RatingBadge` and got it right; this was the last hand-rolled star row in
  the app. Verified in the browser: the unreviewed companion now reads **"New"**, the reviewed
  one still reads "★ 5.0 (1)".

**Audited, no bug:** the compare tray itself (add, remove, count, clear, modal open/close, and
the fact that it is correctly gated behind an unlocked account) all behave. Two console errors
seen during the sweep were from my own probe requests, not the app — the pages are clean.

`tsc` clean · 397 tests pass.

### 2026-07-14 — round 18 (the booking flow, driven end to end)

**The core path works.** Signed up a fresh account against the real database and completed a
booking: age gate → activity → date → time → place → review → safety acknowledgement →
confirmed. The booking row landed in Neon (`meghna`, `upcoming`, Café Chat, Meghdoot Garden),
the wallet debited **2 → 1** (`used: 1`), a meetup code was issued, and **both** notifications
fired — "Meetup confirmed" and "Payment received". The 18+ gate is **real, not cosmetic**:
posting an under-18 date of birth straight at `/api/user`, bypassing the UI entirely, returns
**403 `under_age`** and stores nothing.

Four bugs on the way through.

**Fixed — the cookie banner covered the booking wizard's Continue button**

- **#221a** — `document.elementFromPoint()` at the centre of the wizard's **Continue** button
  returned *the consent banner's paragraph*. The banner is a floating fixed card; the wizard's
  button sits at the end of the document, so **no scroll position moved it clear**. A
  first-time visitor — who by definition has not answered the banner yet — clicked Continue and
  nothing happened, because they were clicking the banner. This is the primary action of the
  money path, blocked for every brand-new visitor.

  The banner now reserves its own height as `body` padding while it is up (measured live via
  `ResizeObserver`, so it survives wrapping and rotation). Verified: the Continue button is now
  the top element at every scroll position, including the bottom, where it used to be trapped.

**Fixed — "You've used both included meetings", to someone who never had any**

- **#59** — the review step branched on `hasCredits` alone, so **zero credits because you have
  never unlocked** rendered identically to **zero credits because you spent them both**. A
  brand-new member — never unlocked, never booked — was told on the last screen before booking
  that they had *used* the very thing they had not yet bought, above a dead button reading
  "No meetings left". A member one payment away from converting was shown a dead end.

  It now distinguishes the two, and the dead button became a live **"Unlock for ₹199"** that
  opens the unlock sheet **seeded with the companion they were trying to book**
  (`/explore?unlock=<id>`).

**Fixed — a query parameter that nothing read (again)**

- While wiring that, my first attempt scoped the companion lookup to the *currently selected
  city*. Explore defaults to Mumbai for an account with no city set, and the companion being
  booked was in Indore — so the sheet silently never opened. It now looks the companion up in
  the whole catalogue and **switches the city to where they actually are**, so the sheet's
  "and 7 others in Indore" is true too. Verified: `/explore?unlock=meghna` switches to Indore
  and opens the sheet on Meghna.

**Fixed — "not known yet" rendered as "no"**

- **#60** — both the wallet and the unlocked flag start as `null` on the review step, and until
  they land `hasCredits` is false. So for the first moments of the screen, a member **with two
  meetings in their wallet** was shown "You've used both included meetings" and a disabled
  button. It corrects itself when the fetch returns; on a slow connection that is a long time
  to be told you cannot do the thing you are about to do, and the natural response is to leave.
  `OverviewPanel` already learned this exact lesson about this exact wallet. The screen now says
  "Checking your included meetings…" until it actually knows.

`tsc` clean · 397 tests pass · test account and its booking removed from Neon.

### 2026-07-14 — round 19 (the session that outlived the account, and the wage that wasn't)

**Fixed — a deleted account stayed "signed in" for thirty days**

- **#44** — the JWT is self-contained and lives for a month. Delete the User row — the member
  erases their account, or an admin removes them — and the token stays cryptographically valid
  the entire time. `useSession()` kept reporting **authenticated**, so the app carried on
  making calls, and every one came back **401**, because the server resolves the caller against
  a row that is not there. The member is left in a broken, half-logged-in app instead of simply
  being signed out. Found it by accident: after deleting my own test account, `/api/auth/session`
  still cheerfully returned `audit-book@example.com`, and three 401s fired on page load.

  The session callback now resolves the id against the database and returns no session when the
  account is gone. Two details that matter:
  - It returns **`{}`, not `null`** — an empty object is what `/api/auth/session` natively
    returns when signed out, and the next-auth client maps it to `unauthenticated`. Returning a
    literal `null` makes that client throw `CLIENT_FETCH_ERROR` on every page. (Tried it; saw it.)
  - **Suspended and banned users deliberately keep their session.** That is not an oversight —
    `lib/server/session.ts` blocks them from every ordinary route, but they remain legally
    entitled to export and erase their data, and those routes need a session to identify them
    by. Only deletion, where there is no account left to be signed in to, kills it.

  Verified both directions: the stale token now resolves to signed-out with **zero console
  errors** (was three 401s), and a fresh sign-in still lands on the dashboard with a real id and
  a 200 from `/api/user`.

**Fixed — the recruitment page promised companions money it does not pay**

- **#150** — "Transparent earnings — Set your own rate. **Payments are released to you directly
  after each completed session via Razorpay.**" Two things wrong with that, on the page asking
  real people to do real work:
  1. **Nothing is released automatically.** A payout is *recorded* when a paid booking settles;
     an admin then transfers it by hand to the UPI id on the companion's dashboard.
  2. **Paid bookings are not open** (`MARKETPLACE_PAYMENTS_ENABLED` is deliberately unset), so
     the only meetups that can happen today are the two included in a member's unlock — and a
     credit-funded booking creates **no payout row at all**. A companion who signs up today
     earns **nothing**. Now says so.

- **#151** — the earnings calculator multiplied rate × meetups × weeks and stopped, advertising
  the **gross** fee while the platform takes 30% of it. At the default six meetups a week it
  promised **₹12,874/month** against **₹9,012** actually paid — a figure a third larger than
  what would reach their bank. It now applies the real commission constant from `lib/money.ts`,
  shows the arithmetic, and is labelled "estimated monthly payout, after our cut". Verified in
  the browser: **₹9,012**.

`tsc` clean · 397 tests pass · test account removed from Neon.

### 2026-07-14 — round 20 (the companion application, and a race I put there myself)

**Fixed — a signed-in member could be bounced to /register**

- **#152** — I gated `AccountGate`'s `/api/user` read behind the session (a signed-out visitor
  was firing a request that could only ever come back 401). That exposed a real bug in
  `useData`'s `enabled` parameter, which I had added earlier in this audit: **the disabled
  branch sets `loading` to false, and nothing sets it back to true when `enabled` flips.**

  So for exactly one render after the session resolved, a component saw *"not loading, and no
  data"* and concluded there was no data. `AccountGate` did precisely that and **redirected a
  signed-in member to /register** — valid session, `/api/user` returning 200, and the gate
  bouncing them anyway. Watched it happen three times before I understood it.

  Fixed at the source: `useData` now sets `loading` when an enabled read starts and nothing real
  has been read yet — and deliberately *not* on refreshes of an already-loaded slice, or every
  focus event would flash a skeleton over a value we already have. `AccountGate` additionally
  decides from the **session** rather than the slice: authenticated means an account exists
  (`lib/auth.ts` only issues a session for a row that is really there), so "user not here yet"
  is always *wait*, never *sign up*.

  Nothing else combined `enabled` with `loading`, so this was latent until now — but it was
  waiting for whoever did it next. Verified: `/become-a-companion/apply` now holds a signed-in
  member and shows the age step, and a signed-out visitor redirects with **zero console errors**
  (was one 401).

**Fixed — an invented statistic that shaped what a real person charges**

- **#153** — the rate slider told every applicant, in every city: *"Most companions in
  {city} charge ₹449-549."* A hard-coded range, identical everywhere, presented as a fact about
  their local peers — the same fake-statistic pattern already stripped from the home page, except
  this one was steering **how much money a real person decided to ask for**. It now reads the
  actual spread from the companions in that city, collapses to a single figure when they all
  charge the same, and **says nothing at all** when there are fewer than three of them, because
  then there is no "most" to speak of.

- **#154** — the slider set a rate and never mentioned that the platform keeps 30% of it. It now
  says what reaches them: *"You keep 70% — ₹349 per meetup, once paid bookings open."* Verified
  in the browser at the default ₹499.

`tsc` clean · 397 tests pass · test account removed from Neon.

### 2026-07-14 — round 21 (the guest dashboard fired 14 requests it was never allowed to make)

**Regression sweep first.** The `useData` change in round 20 touches every data-reading
component in the app, so before going further I re-checked it: all ten public routes return
200, the home page and explore render, and the dashboard hydrates. No regression — but the
sweep turned up something that had been there all along.

**Fixed — 14 × 401 on the guest dashboard**

- **#61** — the dashboard explicitly supports guest preview ("Previewing as a guest. Sign in to
  save your progress"), and every panel behind it read its slice unconditionally. A signed-out
  visitor therefore fired **fourteen requests to protected endpoints** — `/api/user`,
  `/api/wallet`, `/api/bookings`, `/api/subscription`, `/api/user/unlocked`, `/api/spin` — each
  one guaranteed to answer 401, each one a red error in their console. In production that is
  fourteen Sentry events per guest who so much as looks at the dashboard.

  `Nav`, `NavUser` and `ExploreClient` were gated behind `useViewerReady()` in an earlier round.
  The dashboard was simply missed. All six panels, `SpinBanner`, `MessagesPanel` and the refund
  check in `AccountPanel` (which I wrote myself two rounds ago, and gated on `serverBacked`
  while forgetting `signedIn`) now ask nothing when there is nobody to ask about.

  **Verified both directions, because gating reads is exactly the change that breaks the
  signed-in case:**
  - Guest, all six tabs mounted: **14 errors → 0**.
  - Signed-in member with a real wallet: greeting "Good evening, Friend", wallet chip **2**,
    included meetings shown, "Profiles unlocked" milestone earned, no guest banner, **0 console
    errors**. Nothing lost.

`tsc` clean · 397 tests pass · test account removed from Neon.

### 2026-07-14 — round 22 (the companion dashboard: paid, and told nothing)

Linked a real account to a seeded companion profile through the admin panel (by **email** —
the round-12 fix, exercised for real) and drove the companion dashboard as an actual companion.
The live page is honest: "Welcome back, Aarav", 0 upcoming, 0 completed, **"No reviews yet"**,
₹0 across all three earnings cards. No invented figures anywhere. Saving a UPI id persists.

**Fixed — a companion is paid and nobody tells them**

- **#160** — the payout panel says, in as many words: *"We transfer them to this UPI id and the
  amount moves to Paid out. **We'll email you when it goes.**"* `markPayoutPaid` sent nothing.
  No email, no notification. The money left, the row flipped to `paid`, and the person whose
  wages they were was told **precisely nothing** — they would have found out by noticing.

  A promise about someone's pay is the last one to leave unkept, so it is now kept, in the same
  action that records the transfer: the companion gets a notification — *"₹X is on its way to
  your UPI id (reference …)"* — resolved through `User.companionId` to the account that owns the
  profile.

**Fixed — "after each completed meetup, your earnings appear under Owed to you"**

- **#161** — they do not. Paid bookings are still closed, so the only meetups that can happen
  are the two included in a member's unlock, and a credit-funded booking **creates no payout row
  at all**. A companion following that sentence would have completed a meetup, looked at "Owed
  to you", found **₹0**, and concluded they had been cheated. It now says what is true: those
  meetups do not earn them anything yet, and here is what will happen when paid bookings open.

**Fixed — a preview that said "Loading" forever**

- **#162** — a visitor who is not a companion resolves to the `preview` state, but the earnings
  cards rendered the *same* skeleton for `loading` and `preview` — so the three cards sat at
  "₹—" with a screen reader announcing **"Loading"** indefinitely, for someone who will never
  have figures there. The two states now read differently.

- **#163** — the preview banner still said *"The figures below are illustrative."* The invented
  preview numbers (₹1,996 owed, ₹7,485 paid out, a 4.9 rating from 41 reviews) were deleted in
  an earlier round precisely because money is not decoration — so the banner was left describing
  numbers that no longer exist. It now says what the page actually is.

**Cleanup note:** this audit linked a test account to a real catalogue profile and wrote a UPI
id onto it. Both were undone — `aarav` is back to `payoutUpi: null`, `account: null`.

`tsc` clean · 397 tests pass.

### 2026-07-14 — round 23 (the last of it: messaging, reviews, reports, admin)

Seeded a real fixture — a member with a completed meetup, and a companion account linked to the
companion she met — and drove every remaining surface end to end against the real database.

**Everything works. No new bugs.**

- **Reviews (#71–#74).** Rated the completed meetup 5★ with text. It saved to the booking, and
  it **reached the companion's public profile**: `/companion/kabir` went from "New" to
  **"5.0 (1 review)"** with the reviewer shown as "Rhea · Indore" and the text rendered. This is
  the `recomputeCompanionReviews` fix from an earlier round, confirmed working end to end.
- **The review guard is real.** My first attempt was refused with **403 `review_not_eligible`** —
  the fixture booking had no payment and no credit spend, and the route requires one. That is the
  guard doing its job, not a bug: reviews are only accepted on meetups that were actually paid for.
- **Messaging both ways (#75–#79).** Member → companion delivered ("Rhea", 1 unread, in the
  companion's inbox); companion → member replied and persisted. Empty threads read honestly
  ("No messages yet. Say hello") — the fake companion greeting was removed in an earlier round
  and has stayed removed.
- **The contact-details guard is enforced SERVER-side (#80).** The composer blocks a phone number
  in the UI — but a client-side guard is decoration. Posting `"Call me on 9876543210"` straight at
  `/api/companion/messages/:id`, bypassing the UI entirely, returns **422
  `contact_details_blocked`**. The safety promise holds where it has to.
- **Report + admin queue (#81, #188).** Filed a report from a companion profile → landed in
  `/admin/reports` as `open` → "Start review" moved it to `reviewing` and persisted.
- **All 11 admin pages** render clean: overview, users, companions, applications, bookings,
  discounts, reports, inbox, payouts, surge, audit.

**Database left exactly as found.** The audit wrote real data onto real catalogue rows — a 5★
review that put Kabir on "5.0 (1 review)" publicly, two reports, a message thread, a UPI id on a
companion profile, and several accounts. All of it removed; Kabir is back to `rating: 0,
reviewCount: 0, payoutUpi: null, account: null`. Meghna's "5.0 (1)" is **pre-existing data, not
mine** — it was there before this audit began. Final state: two real users (the owner and the
admin), zero audit accounts, zero orphaned purchases.

**Final verification**

- `tsc --noEmit` — **clean**
- `vitest run` — **397 tests, 31 files, all passing**
- `eslint` — **0 errors** (53 pre-existing warnings, unchanged)
- `next build` — **compiles successfully, 32 static pages generated, exit 0**
