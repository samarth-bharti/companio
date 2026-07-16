# Companio — The Journey Build · Master Buildable Spec

> ## ⚠️ Historical design spec (as of 2026-07-17).
>
> This is the design intent the site was built from, and it is still the best
> explanation of *why the product feels the way it does*. It is **not** a
> description of what exists now.
>
> Notably wrong: pricing (a pass at four durations, not a one-time ₹199 unlock),
> included meetings (**one**, not two), and §8.4's "social proof" toast — which
> was built, shipped invented member activity under a pulsing live-dot, and has
> been deleted.
>
> For what exists: [`STATUS.md`](STATUS.md). For why the code is shaped as it is:
> [`ARCHITECTURE.md`](ARCHITECTURE.md).

**Audience:** sonnet/haiku ui-engineer + frontend-engineer agents building in 6 stages.
**Status:** Build directly from this. Design decisions are already made — do not re-decide. If a
detail is missing, match the nearest specced pattern; do not invent a new visual language.

---

## 0. Read this first (the contract)

### 0.1 Stack reality (do not break)
- Next 16 App Router, React 19, TypeScript, Tailwind v4 (CSS-first `@theme` in `app/globals.css`).
- **framer-motion v12**, **Lenis** smooth scroll, **lottie-react**, **native `<canvas>`**.
- **NO new npm deps. NO GSAP. There is NO Radix and NO shadcn installed.** Every dialog, sheet,
  popover, wizard, focus-trap, and accordion is **hand-built** with framer-motion + plain React.
  (Available libs only: framer-motion, lenis, lottie-react, lucide-react, class-variance-authority,
  clsx, tailwind-merge, three/r3f.)
- Keep files **≤ ~150 lines**. Split orchestrator vs. presentational components.
- `cn()` from `@/lib/utils`. Icons from `lucide-react`.

### 0.2 Token cheat-sheet (locked — never hardcode hexes when a var exists)
Colors: `--color-azure #2E6BFF`, `--color-azure-deep #1B4FD6`, `--color-azure-tint #EBF1FF`,
`--color-violet #7A4FE0`, `--color-gold #FFB23E`, `--color-emerald #1FAE6B`, `--color-bg #FBFCFF`,
`--color-surface #FFFFFF`, `--color-ink #141A2E`, `--color-ink-muted #5A6378`,
`--color-ink-dark-panel #14122A`, `--color-panel-text #F4F2FF`.
Gradients: `--grad-aurora` (azure→violet→gold), `--grad-cta` (azure→azure-deep),
`--grad-hero-bg`, `--grad-dark-panel`, `--grad-violet-azure`, `--grad-seal` (conic), `--grad-foil`.
Glows: `--glow-azure`, `--glow-violet`, `--glow-gold`, `--glow-seal`.
Shadows: `--shadow-1`, `--shadow-2`, `--shadow-lift`.
Radii: `--radius-sm .5rem`, `--radius-md .875rem`, `--radius-lg 1.375rem`, `--radius-pill 999px`.
Type: `--text-display` (clamp 2.75→5rem), `--text-h1`, `--text-h2`, `--text-h3`, `--text-lead`, `--text-xs`.
Fonts: `--font-display` Fraunces (display), `--font-sans` Plus Jakarta (UI/body), `--font-serif` Lora (quotes/empathy lines).

### 0.3 Motion cheat-sheet (reference these names everywhere)
CSS easing vars: `--ease-enter cubic-bezier(0.16,1,0.30,1)` (entrances), `--ease-exit
cubic-bezier(0.7,0,0.84,0)` (exits), `--ease-stamp cubic-bezier(0.34,1.56,0.64,1)` (overshoot pops).
CSS durations: `--dur-fast 180ms`, `--dur-base 360ms`, `--dur-slow 640ms`, `--dur-hero 900ms`, `--stagger 70ms`.
From `lib/motion.ts`: `spring.soft` (170/26 — general reveals), `spring.snappy` (380/30 — hover/buttons),
`spring.stamp` (520/18/mass .9 — seals/celebrations), `stagger.default .07`, `stagger.tight .04`,
`durations.{fast .18, base .36, slow .64, hero .90}`, `calm.{fast,base,slow}` (tween ×0.6 — **use on
all transactional screens**: booking, payment, dashboard).

### 0.4 Reduced-motion contract (non-negotiable, every component)
- Framer components: gate with `useReducedMotion()` (from framer-motion).
- Non-framer (Lottie / canvas / Lenis / raw rAF): gate with `useEffectiveReducedMotion()` from
  `@/lib/motionPreference`. Pre-hydration it returns `false` (motion-on default) — never read it during SSR for layout.
- "Reduced" means: no transforms-on-scroll, no staggers, no looping/canvas, no auto-play. Show the
  **final composed state immediately**. Content and meaning must be 100% present without motion.
- Sticky-scroll scenes (phone hero, activity chapter, etc.) **collapse to a normal vertical stack**
  under reduced motion — never leave a 250vh empty sticky.

### 0.5 Accessibility contract (global, WCAG 2.2 AA)
- **Contrast rules for the locked palette** (memorise — several existing usages are borderline):
  - `ink` / `ink-muted` = safe for body text on light. `panel-text` = safe on dark panels.
  - `azure` text on white ≈ 3.9:1 → **only** for ≥18.66px-bold, large headings, icons, or borders.
    For small body links on light, use `azure-deep`.
  - `emerald` on white ≈ 2.7:1 and `gold` on white ≈ 1.7:1 → **never** as small text on light.
    Use them as fills/icons/borders/large-bold only. For small green status text on light, render with
    inline `#157A4A`. On dark panels `emerald`/`gold` small text is fine.
- Focus: rely on global `:focus-visible` (azure 2px). On dark/aurora surfaces add
  `focus-visible:outline-white`.
- Touch targets ≥ 44×44. Modals/sheets/wizards: focus-trap, ESC closes, `aria-modal`, restore focus to
  trigger on close, backdrop `aria-hidden` siblings. Dynamic numbers/toasts/quiz progress need
  `aria-live` (polite) regions.
- Bold stays AA. If a treatment can't pass, change the treatment, not the rule.

---

## 1. The Journey System (define once, use everywhere)

### 1.1 Global banned default
> The generic version we refuse to ship: a Tailwind/shadcn SaaS funnel — white cards, a blue
> primary button, a top % progress bar, a centered modal price-list paywall, rotating testimonial
> carousel, and instant blurred→clear swaps. **Nothing in this build may resemble that.** If a screen
> ends up looking like a default shadcn starter, it has failed.

### 1.2 Recurring motifs (the four through-lines that make pages feel like one journey)

1. **The Aurora Thread.** A 2px hairline painted with `--grad-aurora` that acts as the spine of the
   journey. Expressions: (a) the curved `WaveBridge` seams between landing sections are segments of it;
   (b) it draws down the labor-illusion checklist connecting checkmarks; (c) it is the connector under
   every segmented progress pill in the wizards; (d) the `ScrollProgressPill` (already aurora) is its
   ambient form. Draw-on animation = `pathLength 0→1`, `--dur-slow`, `--ease-enter`. Reduced motion: drawn statically.

2. **The Milestone Seal.** Reuse `components/ui/Seal.tsx`. It "presses" at every emotional summit —
   unlock success, booking confirmed, quiz result, dashboard milestones. Entrance is **always** the
   stamp press: `scale 0.3→1`, `rotate −12→0`, `spring.stamp`, optional tiny `Confetti` burst. This is
   the "you belong / you're welcomed" beat — never decorative filler, only earned moments.

3. **Oversized ghost numerals.** Fraunces, `letter-spacing -0.04em`, color = accent at ~7–12% alpha,
   absolutely-positioned behind content (the pattern already in `BentoSection`). Use for: activity-scene
   indices (01–05), wizard step numbers, stat figures, pricing pack tiers. Editorial rhythm device.

4. **Frosted metadata chips.** Pill, subtle 1.5px tinted border, soft bg (the city/rating chip pattern
   in `AppMockupVisual`). The system unit for city · activity · rating · language metadata everywhere.

> **Reuse, do not reinvent:** `Seal`, `Stamp`, `TicketStub`, `PassportStack` already encode a warm
> "passport / welcome-stamp" language. The journey = a person being warmly welcomed and stamped into
> belonging. Lean on these; do **not** introduce a competing icon set or motif.

### 1.3 Page-transition language
- Add `app/template.tsx` (App-Router templates re-mount per navigation) wrapping `children` in a
  `motion.div` using the **existing** `pageVariants` from `components/motion/PageTransition.tsx`
  (enter only: `opacity 0→1`, `scale .98→1`, `--dur-base`, `--ease-enter`). This gives every route a
  consistent calm enter. Reduced motion: `pageVariants` already short-circuits via duration; ensure the
  template passes `initial={false}` when `useReducedMotion()` is true.
- **Narrative seams (the two cinematic hops)** get extra continuity instead of true exit animation
  (App-Router exit animation needs router-freezing hacks — out of scope, do not attempt):
  - **Quiz result → /explore?matched=1:** the quiz result screen ends on a full-bleed `--grad-aurora`
    sweep (`AuroraWipe`, see §6.4). `/explore` opens already mid-aurora and resolves the wipe upward, so
    the seam reads continuous. Pass `?matched=1` so explore knows to show the personalised header.
  - **Unlock pay-success:** entirely in-page (no navigation) — the develop-reveal (§2.4) is the transition.
- Transactional routes (`/book*`, `/dashboard`, `/pricing` checkout) inherit Lenis-disabled +
  `calm` motion (LenisProvider already disables `/booking`,`/payment`,`/wallet`; **add `/book`,
  `/dashboard`, `/pricing` to its `DISABLED_ROUTES`**).

### 1.4 Scroll-rhythm rules
- **Dark panels = intimacy/trust beats** (`grad-dark-panel`): People (belonging), Safety (trust),
  labor-illusion, quiz-result reveal. **Light panels = discovery/action.**
- **Never two dark panels back-to-back** without a light beat between.
- Every light↔dark seam uses a **`WaveBridge`** (curved SVG, filled with the destination color).
  Subtle tonal light↔light seams use a **`ColorMorphBridge`** (scroll-driven backgroundColor tween).
- Transactional screens stay **light + calm** — no kinetic scroll scenes inside a booking/payment flow.

### 1.5 Copy voice card
**Voice:** a warm, grounded friend in your city. Confident about safety, never fearful. Second person.
India-flavoured and specific (Marine Drive, Cubbon Park, Marina Beach, Lodhi Garden, chai, filter coffee).

**DO**
1. Name belonging, not deficit: "Everything's better with someone," not "Don't be lonely."
2. Be concrete and honest: "2 meetings included — yours anytime," "Full refund in 7 days."
3. Use the lexicon: *companion, member, meetup, meet, company, walk, chai, session.*
4. Speak safety plainly and proudly: "Aadhaar-verified. ₹ held in escrow until you meet."
5. Keep it human-scaled and specific to the person/city/activity in front of the user.

**DON'T**
1. **Zero romantic/dating/sexual signaling — ever.** Banned: *date, match made, perfect match, spark,
   chemistry, soulmate, flirt, hookup, chemistry, "find love."* ("Matches" is allowed **only** in the
   compatibility sense — "14 companions matched to your activities" — never romantic.)
2. No fake scarcity/urgency/countdowns ("only 2 left!", fake timers, "expires in 5:00").
3. No guilt/shame framing ("still alone?", "nobody to go with again?").
4. No gamified XP / levels / streaks / "don't break your streak" language. Use *milestones, meetups, your shelf.*
5. No gradient-text on every heading; reserve the aurora-clip for **one** accent phrase per section max.

### 1.6 New shared components to build first (Stage-0 within Stage 1; everything else imports these)
All under `components/journey/` unless noted. Each ≤150 lines, all reduced-motion gated.

| File | Purpose | Notes |
|---|---|---|
| `WaveBridge.tsx` | Curved SVG section seam | Props: `fill` (color/var), `flip?`, `height=80`. Static path; optional `pathLength` draw on enter. |
| `ColorMorphBridge.tsx` | Scroll-driven bg tween between two light sections | Props: `from`,`to`,`heightVh=32`. `useScroll` on self + `useTransform` backgroundColor. Reduced: static mid-gradient. |
| `ClipReveal.tsx` | Word-level clip-mask heading reveal (research D) | Splits children string into words; each word in `overflow-hidden` span, inner `y 110%→0`, `--ease-enter`, stagger 30ms. `as` prop for tag. Reduced: plain. |
| `MilestoneSeal.tsx` | Seal stamp-press + label + optional confetti | Wraps `Seal`; entrance `spring.stamp`; `withConfetti?`. |
| `Confetti.tsx` | Native-canvas burst | ~24 pieces, colors azure/violet/gold, gravity, 900ms, self-destruct. Reduced: renders nothing. |
| `ParticleField.tsx` | Native-canvas slow drift (research F) | Props: `count=40`, `color=gold`, `fade?`. rAF, DPR-aware, pauses off-screen via IO. Reduced: nothing. |
| `AuroraWipe.tsx` | Full-bleed aurora sweep for narrative seams | `motion.div` translateY/clip, plays once on mount, then unmounts. |
| `SegmentedPill.tsx` | Named segmented progress (NOT a % bar) | Props: `steps:{key,label}[]`, `current`. Active segment fills, done segments get a tiny seal-dot; aurora thread connector beneath. `aria-valuetext="Step 3 of 7: Vibe"`. |
| `ActivityToast.tsx` | Muted one-per-session social-proof toast | `sessionStorage` guard; bottom, auto-dismiss 6s, `aria-live=polite`, dismissible. Honest generic copy only. |
| `FlipPill.tsx` | Flip-clock countdown digits | `rotateX` flip per digit-change; for dashboard "next meetup in". Reduced: plain text. |
| `DigitRoll.tsx` | Slot-machine vertical digit roll | For dashboard figures; column of 0–9 translated to target, `spring.soft`. Reduced: final value. |
| `lib/journeyState.ts` | localStorage demo state | `getUnlocked/setUnlocked`, `getWallet/decrementMeeting`, `getQuiz/setQuiz`, `getUser/setUser`. Pure functions, SSR-safe (typeof window guards). |
| `lib/data/companions.ts` | Mock dataset + `Companion` type | 14 Mumbai companions (see §A.1). |

Also extend `components/ui/Button.tsx` CVA (do not break existing variants):
- add variant `cta` → `text-white` + inline-style `background: var(--grad-cta)` consumer-side, OR
  class `bg-[--grad-cta]`-style; simplest: add variant `cta` with classes
  `text-white focus-visible:outline-white` and let callers pass `style={{background:'var(--grad-cta)', boxShadow:'var(--glow-azure)'}}`.
- add variant `aurora` (same, `--grad-aurora`).
- add size `lg`: `h-13 min-w-[44px] px-8 text-base rounded-pill` and `xl`: `h-14 px-10 text-lg`.
  Wrap hero/primary CTAs in `MagneticButton` (desktop-only magnetism already handled inside it).

---

## 2. CONCEPT EXPLORATIONS (the three required divergences) — with verdicts

### (a) Horizontal activity chapter
**Banned default:** a fullscreen Netflix-style horizontal row of 5 photo cards with a title overlay each.

| Concept | Lens | The move | Distinct / Fit / Build / A11y |
|---|---|---|---|
| **A1 "A Day With Company" (Day-Arc)** | Editorial / cinematic | Horizontal scroll = one day passing dawn→dusk; bg gradient morphs warm→cool→warm and a glowing "sun" orb arcs across the top as you pass 5 scenes (Walk→Gym→Café→Events→Elder). | **8 / 9 / 7 / 8** |
| A2 "Boarding Passes" | Neo-skeuomorph | 5 oversized TicketStub cards glide past, each stamped as it centers. | 7 / 6 / 5 / 7 |
| A3 "Split-flap board" | Retro-terminal | Airport split-flap board flips through activities while scenes pan. | 9 / 4 / 4 / 6 |

**Winner: A1.** It is the warmest, most platonic reading (a day shared with someone), reuses the
existing Unsplash activity photos + ghost-numeral motif, and the "sun orb" is the Aurora Thread's
horizontal expression — system continuity. A2's brass/paper TicketStub palette clashes with the vibrant
theme; A3's cold monospace fights the brand warmth. **Specced in §3.3.**

### (b) Unlock / unblur moment (the conversion climax)
**Banned default:** a spinner → instant blurred→clear swap → a "Success!" toast.

| Concept | Lens | The move | Distinct / Fit / Build / A11y |
|---|---|---|---|
| **B1 "Develop the Photographs"** | Spatial / analog | On pay-success the profiles *develop* like prints — `blur 18→0` + `sepia .6→0` + `scale 1→1.04→1` in a wave **radiating outward from the exact card they tapped**; a Milestone Seal presses first. | **8 / 9 / 7 / 8** |
| B2 "Frost-melt curtain" | Spatial | A frosted sheet melts away from the tapped card outward. | 8 / 8 / 4 / 7 |
| B3 "Card-flip reveal" | Kinetic | Cards flip (rotateY) to reveal faces in a grid wave. | 7 / 6 / 5 / 7 |

**Winner: B1.** It is literally about finally *seeing people's faces*, which is the emotional payload.
B2 animates `backdrop-filter` across a large area — the exact perf trap the codebase explicitly avoids
(see `AppMockupVisual` comments) — so it's a no. B3 reads as a gamble/slot-machine, slightly off the warm
tone, and doubles render cost. B1 animates `filter` on the image layer itself (GPU-cheap) with a
distance-based stagger. **Specced in §4.4.**

### (c) Quiz visual personality
**Banned default:** a centered white card, radio buttons, "Question 3 of 7," a top % bar (SurveyMonkey).

| Concept | Lens | The move | Distinct / Fit / Build / A11y |
|---|---|---|---|
| C1 "Companion-pass stamps" | Warm journey | Each answer stamps a seal onto a passport strip. | 8 / 8 / 6 / 8 |
| C2 "Conversation thread" | Intimate | The quiz is a gentle chat; answers build a thread; empathy-echo = typing→reply. | 9 / 9 / 5 / 7 |
| **C3 "The Warm Spread" (fusion)** | Editorial + intimate | Full-bleed one-question-per-screen magazine spreads (huge Fraunces question, tactile choice tiles, ghost numeral) **with** Companio "speaking" each question via a small avatar+bubble and replying with a Lora empathy-echo before sliding on. Named `SegmentedPill` with a seal-dot per done question (nod to C1). | **8 / 9 / 8 / 9** |

**Winner: C3 (fusion of C3 + C2's warmth + C1's seal-dot).** It is the most on-brand (matches the
landing's editorial Fraunces energy and reuses ghost-numeral + named-pill + seal motifs), the most
buildable (`AnimatePresence mode="wait"` swap — no growing thread / scroll management), and the most
accessible (exactly one question focused at a time). The chat-bubble framing + Lora reply injects C2's
conversational warmth without its complexity. **Specced in §5.2.**

---

# STAGE 1 — Landing upgrades (A–F)

Landing sections already exist and are good — these are **surgical upgrades**, not rewrites. New
section order (with seams):

```
Hero(light) ─wave→ People(dark) ─wave→ Bento(light) ─morph→ ActivityChapter(day-arc)
─wave→ Safety(dark) ─wave→ TrustCarousel(azure-tint) ─morph→ Stats(light) ─morph→ FinalCta(aurora)
```

### 3.1 (B) Phone hero → 250vh sticky 3-state scene
**Upgrade target:** `AppMockupHero.tsx`. New orchestrator `components/home/PhoneJourneyHero.tsx`
(replaces `AppMockupHero` in `app/page.tsx`); the old `AppMockupVisual` parallax chips are reused but
re-bound to scroll states.

**Layout (breakpoints):**
- Outer `<section>` height `250vh`, `position: relative`, `background: var(--grad-hero-bg)`.
- Inner `sticky top-0 h-screen` flex; `max-w-7xl` grid `md:grid-cols-2` (left text / right phone).
- `< md`: phone stacks under text; still sticky, still 3-state.

**The 3 phone states** (new files in `components/home/phone/`, each ≤120 lines, pure DOM/CSS, reuse the
`AppMockup` frame styling: 272×540, `border:7px solid #141A2E`, `rounded-[2.5rem]`):
1. **PhoneBrowse** — the existing `AppMockup` browse list (Priya / Arjun cards, search bar, "Available now").
2. **PhoneProfile** — one companion expanded: big azure avatar, "Priya S." + verified tick, frosted
   chips (City Walk · Museum · Café), `★ 4.9 (124)`, two 1-line review snippets, a `Book a walk` button.
3. **PhoneConfirmed** — confirmation: green Seal check, "Walk confirmed", `Sat · 7:00 AM · Marine Drive`,
   a mini TicketStub row, "Added to your meetups · 1 of 2 included used".

**Synced left text (3 messages, cross-fade):**
- State 0 — eyebrow `Trusted · Verified · Always platonic`; H1 (existing) **"Real company. Any time."**;
  sub "Verified companions for city walks, gym sessions, café chats, and more — strictly platonic."; CTAs.
- State 1 — H2 swap **"See who's actually near you."**; sub "Every profile Aadhaar-verified, rated by
  real members, in 38 cities."
- State 2 — H2 swap **"Then meet, this week."**; sub "Book in a tap. ₹ held in escrow until you meet."

**Motion choreography:**
- `const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start','end end'] })`.
- Phone screens: 3 absolutely-stacked layers; opacity via `useTransform(scrollYProgress, …)`:
  - browse: `[0,0.28,0.38] → [1,1,0]`; profile: `[0.30,0.40,0.62,0.72] → [0,1,1,0]`;
    confirmed: `[0.66,0.76,1] → [0,1,1]`. Add `y` of incoming `+18→0` (`--ease-enter` feel via transform range).
- Left text blocks: same opacity bands, with `y 24→0→−24`.
- Floating chips (reuse `AppMockupVisual`): bind visibility to state — "Aadhaar verified" chip in state 0–1,
  "★ 4.9 rated" peaks in state 1, a new green **"Booked ✓"** chip appears in state 2.
- Device micro-tilt: subtle `rotate` `useTransform([0,1],[−1.5,1.5])` for life. Keep pointer-parallax from `AppMockupVisual`.
- A thin progress tick on the phone's right edge mirrors `scrollYProgress` (aurora).

**Copy direction:** confident, present-tense, escalating from *discovery → trust → action*. Never "match."

**Reduced motion:** render **state 0 only** at normal `min-h-screen` (no 250vh, no sticky, no swaps) —
i.e. the current hero. Detect via `useReducedMotion()`; branch the section height/markup.

**Files:** new `PhoneJourneyHero.tsx`, `phone/PhoneBrowse.tsx` (wrap existing `AppMockup`),
`phone/PhoneProfile.tsx`, `phone/PhoneConfirmed.tsx`. Reuse `AppMockupVisual` chips, `MagneticButton`, `Button(cta/xl)`.

### 3.2 (A & E) Section seams — exact placements
Build `WaveBridge` + `ColorMorphBridge` (§1.6), then insert between sections in `app/page.tsx`:

| Seam | Component | Params |
|---|---|---|
| Hero → People | `WaveBridge` | `fill=var(--color-ink-dark-panel)` (dark wave rises into light), height 90 |
| People → Bento | `WaveBridge` | `fill=var(--color-bg)`, `flip`, height 80 |
| Bento → ActivityChapter | `ColorMorphBridge` | `from=#FBFCFF`→`to=#FFF3E0` (into dawn), 28vh |
| ActivityChapter → Safety | `WaveBridge` | `fill=var(--color-ink-dark-panel)`, height 90 |
| Safety → TrustCarousel | `WaveBridge` | `fill=var(--color-azure-tint)`, `flip`, height 80 |
| TrustCarousel → Stats | `ColorMorphBridge` | `from=#EBF1FF`→`to=#FBFCFF`, 24vh |
| Stats → FinalCta | `ColorMorphBridge` | `from=#FBFCFF`→`to=#EBF1FF`, 24vh (FinalCta's own overlay finishes the blend) |

`WaveBridge` is one inline `<svg viewBox="0 0 1440 80" preserveAspectRatio="none">` with a single
quadratic/cubic path filled `fill`; place it as the **last child** of the source section (absolute bottom,
full width) or as a standalone block — standalone block is simpler and Lenis-safe; prefer standalone.
Reduced motion: render statically (it already is, unless you add the optional `pathLength` draw).

### 3.3 (C) Activity chapter — "A Day With Company" (WINNER A1)
**New files:** `components/home/ActivityChapter.tsx` (orchestrator, sticky + translateX),
`components/home/ActivityScene.tsx` (one full-viewport scene). Insert after `BentoSection`.

**Layout:**
- Outer `<section>` `height: 520vh`, relative. Inner `sticky top-0 h-screen overflow-hidden`.
- A horizontal `motion.div` `flex` width `500vw` (5 scenes × 100vw), driven `x: useTransform(
  scrollYProgress, [0,1], ['0vw','-400vw'])`.
- Each `ActivityScene` = `w-screen h-screen`, two-column on `md` (alternating photo/text side per index
  for rhythm), single column stacked on mobile.
- **Sun orb / Aurora Thread:** an absolutely-positioned glowing orb (28px, `--grad-seal`, blur halo)
  that arcs across the top: `x: 8%→92%` and `y` follows a shallow parabola (`top: 18%` at ends, `8%` at
  midday scene 3) via `useTransform` with a multi-stop input range. It is the "time of day" indicator.

**The 5 scenes (index · activity · day-phase bg · photo · hook):** background of the inner sticky
container morphs through these via `useTransform(scrollYProgress,[0,.25,.5,.75,1], [c1..c5])`:
1. **01 · City Walk** — dawn gold `linear-gradient(140deg,#FFF3E0,#FFE0B0)` — Unsplash city-walk photo —
   "Start the day with a walk and someone who actually knows the lanes." (Marine Drive / Cubbon Park).
2. **02 · Gym Buddy** — bright azure morning `linear-gradient(140deg,#EBF1FF,#CFE0FF)` — gym photo —
   "The partner who actually shows up. Every time."
3. **03 · Café Chat** — warm cream midday `linear-gradient(140deg,#FFF8EC,#F3E8D6)` — café photo —
   "Two cups of chai, one long conversation. No rush."
4. **04 · Events** — electric violet evening `linear-gradient(140deg,#1E1840,#2E1F5E)` (dark scene,
   panel-text) — concert/event photo — "Nobody should skip the gig just because they'd go alone."
5. **05 · Elder Company** — golden-hour calm `linear-gradient(140deg,#FFF3E0,#E6F5EE)` — elder/park photo —
   "An unhurried afternoon. A patient ear. Warm, familiar company." 

Each scene also shows: a ghost numeral (`01`–`05`, Fraunces, accent at 8%), a frosted chip cluster
("What you'd do": 3 mini chips), and a small `Reveal`-style entrance for its text when it nears center
(`useTransform` on per-scene local progress, or simpler: opacity/`y` keyed to the scene's x-band).

**Motion:** translateX is the only scroll-bound transform on the big row; per-scene content fades in
within its band `[sceneStart, sceneStart+0.06]`. The sun orb arcs continuously. Use existing Unsplash
URLs from `PeopleSection.PHOTOS` (City Walk, Gym Buddy, Café Chat, Live Concert, plus a calm/park photo
for Elder). `next/image` with `sizes="100vw"`, `priority` only on scene 1.

**Copy direction:** each hook is one warm sentence; lead the eyebrow with the time of day
("Dawn", "Morning", "Midday", "Evening", "Golden hour") to reinforce the day-arc.

**Reduced motion:** collapse to a **normal vertical stack** — section height `auto`, no sticky, no
translateX, no sun arc; render 5 `ActivityScene`s as stacked full-width blocks each with a `Reveal`.
Each keeps its own bg as a solid block. (Branch on `useReducedMotion()` at the top of `ActivityChapter`.)

### 3.4 (D) Clip-mask heading reveals
Apply `ClipReveal` (§1.6) to the **primary** heading of: PeopleSection, BentoSection, SafetySection,
TrustCarousel, StatsSection, FinalCtaSection, and the ActivityChapter intro. Word-level, 30ms stagger,
inner `y 110%→0`, `--ease-enter`, `whileInView once`. Keep **one** aurora-clipped accent phrase per
heading max (most already have one — don't add more). Reduced motion: words appear, no slide.

### 3.5 (F) FinalCta particle drift
Drop `<ParticleField count={40} color="gold" />` absolutely inside `FinalCtaSection` (behind the
content, above the gradient, `pointer-events-none`, `aria-hidden`). Native rAF, DPR-aware, slow upward
drift with gentle horizontal sine, opacity 0.15–0.4, respawn at bottom. Pause off-screen via
IntersectionObserver. Reduced motion: render nothing (the existing static orbs remain).

---

# STAGE 2 — Explore rebuild + BlurLockCard + UnlockSheet + develop moment

**Route:** rewrite `app/explore/page.tsx` (keep `metadata` in a thin server wrapper; move interactive
parts to `components/explore/ExploreClient.tsx` `'use client'`). Reads `?matched=1` and `lib/journeyState`.

### 4.1 Explore layout
- **Header band** (light, `grad-hero-bg`): eyebrow, H1, and a **live social-proof line**:
  `2,300+ members · 41 meetups this week` (frosted chip, the green live-dot pattern). If `?matched=1`,
  swap H1 to personalised: **"Your 14 matches in {city}, {name}."** with sub "Tap anyone to take a closer
  look." Mock filter row (City · Activity · Availability) as frosted chips (non-functional in demo, but
  keyboard-focusable).
- **Companion grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`, 14 cards from
  `lib/data/companions.ts`. Exactly **one** card is unlocked (the `topMatch` — or `id:'ananya'` default);
  the other 13 are `BlurLockCard`s.
- Mount `<ActivityToast />` once (muted social proof). Mount `<UnlockSheet />` controlled by ExploreClient state.

### 4.2 BlurLockCard
**File:** `components/explore/BlurLockCard.tsx`. The gate must *be* the experience — these are desirable,
not censored.
- Photo layer: `next/image` portrait with `filter: blur(18px) saturate(1.05)`; a **2.4s shimmer loop**
  (a diagonal translucent gradient sweeping across, CSS `@keyframes`, `--ease-enter`-ish, `prefers-reduced-motion`
  → no shimmer). Above it a **frosted lock chip**: small pill, `Lock` icon + "Locked" (or "Tap to unlock").
- **Readable (non-photo) facts stay crisp and un-blurred:** city · area, `★ rating (reviews)`, 2–3
  activity chips, first-name **masked**: `"Pri···"` (show first 3 letters + `···`). Verified tick visible.
- Whole card is a button: `onClick` → opens `UnlockSheet` seeded with this card's `{name, city}` →
  sheet headline "Unlock {Name}'s profile + 13 others in {city}." `aria-label="Unlock {maskedName}'s
  full profile"`. Hover (desktop): `TiltCard` subtle + lock chip scales 1.05.
- The single **unlocked preview card** (`CompanionCard`) shows full photo, full name, full chips, a
  `View profile` link → `/companion/[id]` (free preview to build trust), and a `Book a walk` button that,
  if not yet unlocked, also opens `UnlockSheet`.

### 4.3 UnlockSheet (hand-built — no Radix)
**File:** `components/explore/UnlockSheet.tsx`. Bottom sheet on mobile, centered modal on `md+`. Single
screen, no scroll-wall. **This replaces the "modal price-list paywall" anti-pattern — it is a warm,
trust-dense unlock, not a pricing table.**

**Structure (top→bottom, this exact order):**
1. Headline: **"Unlock {Name}'s profile + 13 others in {city}."** Sub: "One step. You're 30 seconds away."
2. Anchor block: big **₹199** with strike-through context "2 meetings included · worth ₹998" (ghost
   numeral behind). Three benefit rows (icon + line), **in this order**:
   - ① `Users` — "Every verified profile in {city} — all 14, unblurred."
   - ② `CalendarHeart` — "2 meetings included — yours to use anytime, no expiry."
   - ③ `ShieldCheck` — "One-time. No subscription. No auto-debit."
3. **UPI-intent-first payment** (mock): three big tappable method tiles **GPay · PhonePe · Paytm**
   (brand-tinted, ≥56px), then a folded `Pay by card →` disclosure below (collapsed accordion).
4. Pay button (full-width, `Button cta xl`): **"Pay ₹199 — unlock everything."**
5. **Refund line directly under the button** (small, `ink-muted`): "Didn't find anyone you'd like to
   meet? Full refund in 7 days." + **Razorpay** trust badge (text "Secured by Razorpay" + lock icon).
6. Pre-disclosure (small): "After your 2 included meetings, each meetup is ₹499. We'll always show the
   price before you book."
7. One **safety-framed** testimonial (Lora italic): *"Verification meant my family was relaxed about it
   too." — Meena T., Delhi* + verified tick.

**Motion:** open — backdrop `opacity 0→1` (`--dur-fast`); sheet `y 100%→0` (mobile) / `scale .96→1`+`y
12→0` (desktop) `spring.soft`. Benefit rows stagger in `stagger.tight`. Close — reverse with `--ease-exit`.
Pay tap → button morphs to spinner 900ms → check; then **close sheet + trigger develop-reveal** (§4.4).
**A11y:** focus-trap, ESC closes, `role="dialog" aria-modal aria-labelledby`, restore focus to the card,
methods are real buttons, `aria-live` on the pay→processing→success state.

**Reduced motion:** no slide/scale — fade in/out only; spinner replaced by a static "Processing…" then immediate success.

### 4.4 Pay-success develop-reveal (WINNER B1) — the money moment
Orchestrated in `components/explore/CompanionGrid.tsx` via an `unlocking` boolean lifted from ExploreClient.

**Sequence (timeline):**
1. **t=0** — UnlockSheet closes (`y→100%`/fade, `--ease-exit`, 180ms).
2. **t=120ms** — `<MilestoneSeal>` presses dead-center over the grid (`scale .3→1`, `rotate −12→0`,
   `spring.stamp`) with line **"You're in, {name}."** + a single small `<Confetti>` burst. Seal +
   confetti auto-fade after ~1.1s.
3. **t=200ms onward — the develop wave.** Every `BlurLockCard` upgrades to `CompanionCard`. Each card's
   **photo layer** animates `filter: blur(18px)→0` + `sepia(0.6)→0` (composed: `blur(18px) sepia(.6)` →
   `blur(0) sepia(0)`) and `scale [1,1.04,1]`, `--dur-slow`, `--ease-enter`. **Stagger = distance-based,
   radiating from the tapped card:**
   `delay = 0.06 + 0.05 * chebyshevDistance(cardIndex, tappedIndex)` seconds (cap 0.7s). Compute row/col
   from the responsive column count. The tapped card goes **first** and gets a one-shot gold ring pulse
   (`box-shadow: var(--glow-gold)` fade).
4. The **frosted lock chips** dissolve (`opacity→0`, `scale→.9`, `--dur-fast`) ~80ms before each card's photo clears.
5. **Header counter rolls** via `DigitRoll`/`aria-live`: "1 unlocked" → "14 profiles unlocked." Social-proof
   line stays.
6. **t≈+1.6s settle** — `<ParticleField count={20} color="gold" fade />` drifts over the grid for ~1.5s then fades.
7. Persist `setUnlocked(true)` in `lib/journeyState` so revisits stay unlocked; `Book` buttons now active.

**Reduced motion:** no stagger, no sepia, no scale, no confetti, no particles, no ring. Lock chips
removed, photos render clear immediately, Seal appears statically with the line, counter shows "14
profiles unlocked." Instant, dignified.

**Files:** `ExploreClient.tsx`, `ExploreHeader.tsx`, `CompanionGrid.tsx`, `BlurLockCard.tsx`,
`CompanionCard.tsx`, `UnlockSheet.tsx`, `PaymentMethodTiles.tsx`. Reuse `MilestoneSeal`, `Confetti`,
`ParticleField`, `DigitRoll`, `TiltCard`, `Button`.

---

# STAGE 3 — Quiz funnel + labor-illusion + result reveal

**Route:** new `app/quiz/page.tsx` (client). Linked from Nav, hero secondary CTA, and an "Not sure who
to pick? Take 60 seconds →" link on `/explore`. On finish: `setQuiz({name,city,matchedId})` then
`router.push('/explore?matched=1')` through the `AuroraWipe`.

### 5.1 Quiz layout & flow
- 7 questions, **one per screen**, `AnimatePresence mode="wait"`. `SegmentedPill` across the top with word
  labels: **City · You · Time · Listen · Languages · Comfort · Name** (a seal-dot fills per completed step).
- Full-bleed `grad-hero-bg`; subtle per-question accent tint shift (azure→violet→gold cycling) on a soft
  background blob, not the whole bg.
- `< md`: question stacks above choice tiles; `md+`: split — oversized Fraunces question left, choice
  tiles right; ghost numeral `01`–`07` behind.

**The 7 questions (winner C3 "Warm Spread"):**
1. **City** — "Where are we meeting people?" — searchable city chips (Mumbai default selected for demo).
2. **You** (what you miss doing with company) — "What do you miss doing with someone?" — multi-select
   tactile tiles: morning walks · gym/runs · café & chai · live events · exploring the city · just talking.
3. **Time** — "When are you usually free?" — weekday eves / weekends / mornings / flexible.
4. **Listen** (listener/talker) — "In good company, you're more of a…" — "a listener" / "a talker" /
   "depends on the day" (slider or 3 tiles).
5. **Languages** — "Which languages feel like home?" — Hindi · English · Marathi · Tamil · Telugu ·
   Bengali · … multi-select chips.
6. **Comfort** — "Anything that would make you more comfortable?" — includes a clearly-offered
   **"I'd prefer a same-gender companion"** toggle + "verified only" (always on, shown as reassurance) +
   "public places first."
7. **Name** — "Last one — what should we call you?" — first-name text input (autofocus, `autoComplete="given-name"`).

**Conversational warmth (the C2 injection):** above each big question, a small Companio avatar (the
`Seal`, 28px) + a chat-style bubble *asks* the question conversationally. After each answer, before the
slide, Companio **replies** with a one-line **empathy-echo** in Lora italic (typing-dots → line),
e.g. after Q2: *"Morning walks it is — there's nothing like the city before it wakes up."*; after Q4
"listener": *"A good listener is rarer than you'd think. Noted."* (Copy bank §A.3.)

**Motion choreography:**
- Question swap: outgoing `x 0→−40, opacity 1→0` (`--ease-exit`, `--dur-fast`); incoming `x 40→0,
  opacity 0→1` (`spring.soft`). `AnimatePresence mode="wait"`.
- Choice tile select: `spring.snappy` scale `1→1.03` + accent border fill + check pop (`--ease-stamp`).
- Empathy-echo: dots (3 dots, staggered opacity loop, 600ms) → Lora line `opacity 0→1, y 8→0` then
  auto-advance after ~1.2s (or on explicit "Next").
- `SegmentedPill` seal-dot stamps in (`spring.stamp`) as each question completes.

**A11y:** each question is a `fieldset/legend`; one focused at a time = great for SR. `SegmentedPill`
`aria-valuetext="Step 4 of 7: Listen"`. Empathy-echo in `aria-live=polite`. Inputs keyboard-complete;
Enter advances. Reduced motion: no slide/typing — questions cross-fade instantly, echo line appears at
once and waits for an explicit **Next** button (don't auto-advance under reduced motion).

### 5.2 Labor-illusion interstitial (after Q7)
**File:** `components/quiz/LaborIllusion.tsx`. Dark panel (`grad-dark-panel`) — an intimacy beat.
- Centered Seal + "Hold on, {name} — finding your people…" Then an **itemized checklist** appears line by
  line, each line getting a **stamped checkmark** ~500–650ms after it appears. The **Aurora Thread draws
  down** the left, connecting the checkmarks. Total ≈ **3.5s**, then auto-advance to result.
- Lines (honest, ethical — these are real-ish filters):
  - "Scanning 2,300+ verified members in {city}…" ✓
  - "Matching your activities — {top 2 picks}…" ✓
  - "Checking who's free {their time pref}…" ✓
  - "Applying your comfort preferences…" ✓ (if same-gender chosen: "Filtering for same-gender companions…")
  - "Finalising your shortlist…" ✓
- **Motion:** each line `opacity 0→1, y 10→0` (`--ease-enter`, 70ms after previous); its check stamps
  (`spring.stamp`) 550ms later; thread `pathLength 0→1` over the full sequence.
- **Reduced motion:** all lines + checks render at once, hold 1.2s, advance. No drawing, no staggered pops.
- **Ethics note for builder:** this is a labor-illusion (showing real work happening), NOT a fake delay
  with fake numbers — keep lines truthful to what a real match would do. No fake countdown.

### 5.3 Result reveal
**File:** `components/quiz/ResultReveal.tsx`. Dark→light morph (`ColorMorphBridge` feel, or a quick bg
tween). Then:
- `<MilestoneSeal>` press + **"We found 14 companions for you, {name}."** (sub: "Here's who fits best.")
  ("companions," not "matches" in the hero line; "matched to your activities" is fine as supporting text.)
- **ONE clear top-match card** (full color, gold **"Top match"** ribbon, the `topMatch` companion) +,
  behind/below it, a grid of **blurred** others (mini `BlurLockCard`s) — visually promising "13 more."
- CTA `Button aurora xl`: **"Meet your matches →"** → triggers `<AuroraWipe>` → `router.push('/explore?matched=1')`.
- The actual unblur still happens on `/explore` behind the ₹199 unlock (same gate as direct browse) — the
  quiz simply gives a warm, personalised on-ramp and **the user unlocks their own results**. The top-match
  here becomes the single unlocked preview card on `/explore`.

**Motion:** seal press (`spring.stamp`); top-match card `scale .94→1, opacity 0→1` (`--ease-enter`, 200ms
after seal); blurred grid `opacity 0→1` staggered `stagger.tight`. **Reduced motion:** everything appears
composed at once; CTA navigates without the wipe (plain push).

---

# STAGE 4 — Companion profile + booking wizard + TicketStub confirmation

### 6.1 Companion profile — `app/companion/[id]/page.tsx`
Server wrapper reads `id` from `lib/data/companions`; renders `components/companion/CompanionProfile.tsx`.

**Layout:** `md` two-column. Left/main: large portrait (rounded-lg, `--shadow-2`), name + verified tick,
city · area, frosted activity chips, languages, age (optional), a warm bio (2–3 sentences), **"What we'd
do together"** suggestion list (3 ideas tied to their activities + city, e.g. "A sunrise loop around
Marine Drive, then cutting chai."). A `Stamp`/`PassportStack` row of verification credentials
(Aadhaar-matched · Selfie-matched · Background-checked · ₹-protected · Platonic Promise — reuse
`PassportStack` defaults). Reviews section: 3–4 reviews including **one honestly imperfect** review
(e.g. 4★: "Lovely company — ran a few minutes late, messaged ahead though."). Right/sticky: a **booking
rail** — rate ("2 meetings included, then ₹499/meetup"), `Book a meetup` button, and **a review snippet +
rating sit directly adjacent to the book button** (trust at the decision point).

**Motion:** `Reveal`/`RevealGroup` for sections; `TiltCard` on the portrait (desktop). Sticky rail on
`md+`. Book button → `/book?companion={id}` (or open wizard inline). Reduced motion: standard reveals off.
**A11y:** portrait `alt` describes the person+activity neutrally; reviews list semantics; book button ≥44px.

### 6.2 Booking wizard — `app/book/page.tsx` (or modal route)
**Calm + transactional.** Add `/book` to Lenis `DISABLED_ROUTES`. Use `calm.*` motion. Typeform energy
but lower-key than the quiz (this is a transaction, not discovery). `SegmentedPill` named steps.

**Steps (one per screen, `AnimatePresence mode="wait"`):**
1. **Activity** — pick from the companion's activities (tiles).
2. **Date** — simple calendar/next-7-days chips.
3. **Time** — slot chips (morning/afternoon/evening or specific slots).
4. **Place** — public-place suggestions in their area (reinforce safety: "Public places first").
5. **Review & confirm** — summary card + price line. If user has included meetings left: "This uses 1 of
   your 2 included meetings — ₹0 today." Else: "₹499 for this meetup." **Always show price before confirm.**
   Confirm = `Button cta lg` "Confirm meetup."

**Motion:** step slide `x ±32` cross-fade (`calm.base`); selected tiles `spring.snappy` + check
(`--ease-stamp`). `SegmentedPill` seal-dot per completed step. Reduced motion: instant cross-fade.

### 6.3 Confirmation — TicketStub + Seal + confetti
On confirm: decrement wallet (`journeyState.decrementMeeting()` if using an included meeting), then render
`components/booking/BookingConfirmed.tsx`:
- A **`TicketStub`** as the boarding-pass: main panel = activity · date · time · place · companion name +
  verified; stub tab = a `Stamp` ("Booked", date) + a small QR-ish mock. (Restyle TicketStub usage with
  the vibrant theme via className overrides if the paper/oat default clashes — keep the perforation, swap
  bg to surface + azure accents.)
- `<MilestoneSeal withConfetti>` press + line **"You're meeting {name} on {date}."**
- Reassurance row: "₹ held in escrow until you meet · SOS one tap away · they've been notified."
- CTAs: `Add to calendar` (mock), `View in dashboard →` (`/dashboard`).

**Motion:** ticket `scale .96→1, y 16→0` (`calm.base`); seal `spring.stamp`; one small `Confetti`.
Reduced motion: ticket appears composed, seal static, no confetti.
**A11y:** confirmation announced via `aria-live`; all details as real text (not in an image).

---

# STAGE 5 — Pricing + Dashboard

### 7.1 Pricing — `app/pricing/page.tsx`
**This is the meeting-credit top-up ladder (post-unlock), NOT the ₹199 gate.** No comparison-table wall.
Three packs as tactile cards (frosted, ghost numeral tier), the middle one is the **anchored
recommended** default:
- **1 meetup — ₹499** (`Single`).
- **5-pack — ₹1,999** — ribbon **"Most popular — chosen by 1,100+ members"** — visually the default
  (larger, raised, aurora-accented). "₹400 per meetup."
- **10-pack — ₹2,999** — "Best value · ₹300 per meetup."
Below: a **collapsible "What's included"** accordion (hand-built, framer height/opacity) — escrow,
verification, SOS, free reschedule, refund window. No fear, no scarcity.

**Motion:** the recommended card does the **anchoring spring pop** — `scale .95→1.03→1` (`spring.stamp`)
on an **800ms delay** after the cards reveal (draws the eye without a flashing badge). Others `Reveal`
normally. Accordion expand `height auto` + `opacity`, `--ease-enter`. Reduced motion: recommended card
just sits slightly larger/raised (static), accordion toggles instantly.
**A11y:** packs are `radiogroup`/labelled cards; accordion = real `button` + `aria-expanded` +
region. Prices and per-meetup math are text. Recommended marked with text, not color alone.

### 7.2 Dashboard — `app/dashboard/page.tsx`
**Calm, light, endowment-framed.** Add `/dashboard` to Lenis `DISABLED_ROUTES`. The wallet is the hero.

**Layout (cards on a light bg):**
1. **Wallet-as-endowment** (hero card): "Your meetings" with **filled pips ●●** (`Stamp`-pressed dots)
   "2 remaining" + **"worth ₹998"** via `CountUp`. Subtext: "Yours anytime — no expiry." A muted
   `Top up →` link to `/pricing` (offered, never pushed). Use `DigitRoll` if showing a larger figure.
2. **Next meetup** card with a **`FlipPill` countdown** ("in 2d 14h") — flip-clock digits — companion
   name + activity + place. No urgency styling; it's information, not pressure.
3. **Stamp shelf** (milestones, reuse `Stamp`/`Seal`): "First meetup booked", "Explored 2 activities",
   "Verified member" — **milestone language only, NEVER XP/levels/streaks.** Empty future slots shown as
   faint outlines ("Your next milestone: 3rd meetup").
4. **Rebook nudge** (post-meetup, warm not naggy): "How was your walk with Rohan? He's free Sat & Sun —
   want to go again?" with a `Book again` button. **No guilt streaks**, no "don't lose your progress."
5. Mount `<ActivityToast />` (one per session).

**Motion:** pip stamps `spring.stamp` staggered; `CountUp` for ₹998; `FlipPill` flips on mount; stamp
shelf `RevealGroup`. All within `calm` budget. Reduced motion: pips/figures final immediately, FlipPill =
plain text, no flips.
**A11y:** wallet figure has a text equivalent ("2 meetings remaining, worth ₹998"); countdown also as
plain text alongside the flip; milestones are a labelled list.

---

# STAGE 6 — Become-a-companion + auth wiring + transitions + activity toast

### 8.1 Become-a-companion upgrade — `app/become-a-companion/page.tsx`
Keep the existing hero + benefits; **add three sections**:

**(a) Earnings calculator** — `components/companion/EarningsCalculator.tsx`. A styled native
`<input type=range>` slider (meetings/week, 1–14) → live **`CountUp`** of estimated monthly earnings
(`meetings/week × ₹ per meetup × 4.3`, default ₹499, honest "estimate, varies by city/demand" caption).
Slider thumb azure, track aurora-fill to thumb. Big Fraunces figure with ghost numeral behind.
**Motion:** `CountUp` re-runs on slider change (debounced); thumb `spring.snappy`. Reduced motion: number
updates instantly, no count animation. **A11y:** range input labelled, `aria-valuetext="6 meetups a week
≈ ₹12,900/month"`, keyboard-operable; figure mirrored as text.

**(b) Application steps** — 4-step horizontal/stacked stepper (Apply → Verify → Profile → Go live), each a
frosted card with ghost numeral + `Reveal`.

**(c) Verification timeline** — vertical timeline with the **Aurora Thread** drawing down it on scroll
(`pathLength`), nodes = `Stamp`s (Aadhaar → Selfie → Background → Approved). Honest expected timing
("usually 2–3 days"). Reduced motion: thread static, stamps appear via `Reveal`.

**Copy:** "Turn your social energy into meaningful income." Honest, no hype, platonic ("warm, professional
company"). Keep the existing legally-platonic framing.

### 8.2 Auth wiring (mock) — `app/login`, `app/register`
Make the existing static forms **mock-functional** (client `onSubmit`): validate non-empty → `setUser({
firstName })` in `lib/journeyState` → redirect to `?next=` (default `/explore`). Wire from the quiz/result
("Save your matches — create a free account") and from UnlockSheet success ("Want to keep your meetings?
Create an account"). Pre-fill `firstName` from quiz if present. Keep it a demo: no real backend.
**Motion/A11y:** inline validation messages in `aria-live`; submit button shows "…"; respects `calm`.

### 8.3 Page-transition continuity
Add `app/template.tsx` (§1.3) using `pageVariants`. Verify it doesn't fight Lenis (template wraps content;
Lenis owns scroll). Confirm reduced-motion path. The two narrative hops use `AuroraWipe` (quiz→explore) as
specced; everything else is the calm template fade.

### 8.4 Activity toast — `components/journey/ActivityToast.tsx`
Mount on `/explore` and `/dashboard`. **One per session** (`sessionStorage 'companio_activity_toast'`),
appears ~4s after load, bottom-left above the mobile tab bar, auto-dismiss 6s, dismissible (×). Muted
frosted card + green live-dot. **Ethical copy only** — real-feeling, generic, no fake urgency:
- "Rohan just booked a Cubbon Park walk in Bengaluru."
- "Aisha and her companion met for chai in Pune this morning."
**Motion:** slide-up `y 20→0, opacity 0→1` (`spring.soft`); exit `--ease-exit`. `aria-live=polite`,
`role=status`. Reduced motion: fade only.

---

# APPENDIX

## A.1 Data model — `lib/data/companions.ts`
```ts
export interface Companion {
  id: string;
  name: string;          // full, shown when unlocked: "Ananya Iyer"
  firstName: string;     // "Ananya"
  maskedName: string;    // "Ana···"  (first 3 + ···)
  city: string;          // "Mumbai"
  area: string;          // "Bandra West"
  age?: number;
  activities: string[];  // ["City Walk","Café Chat","Museum"]
  languages: string[];   // ["Hindi","English","Marathi"]
  rating: number;        // 4.9
  reviews: number;       // 124
  ratePerMeeting: number;// 499
  bio: string;           // warm, platonic, 2–3 sentences
  suggestions: string[]; // "What we'd do" — 3 city-specific ideas
  photo: string;         // portrait URL (Unsplash friendly headshot)
  accent: string;        // one of azure/violet/gold/emerald hexes
  sameGenderNote?: boolean;
  topMatch?: boolean;    // exactly one true → the unlocked preview
  reviewsList: { name: string; city: string; stars: number; text: string }[]; // incl. one 4★ imperfect
}
```
Provide **14 Mumbai** companions; set `topMatch:true` on `id:'ananya'` (default unlocked preview). Mixed
genders, diverse names/areas, varied activities/languages. Portraits: reuse the Unsplash pattern already in
the repo (friendly, platonic headshots; `?w=480&q=80`). Names masked as first-3 + `···` for locked cards.
One review per companion must be honestly imperfect (4★).

## A.2 Demo state — `lib/journeyState.ts`
Keys: `companio_unlocked` (`'1'`), `companio_wallet` (`{credits:2, used:0}`), `companio_quiz`
(`{name,city,matchedId}`), `companio_user` (`{firstName}`). All getters SSR-safe (`typeof window`).
`decrementMeeting()` lowers credits, raises used; never below 0.

## A.3 Copy bank (sample lines — extend in voice, never break §1.5)
- Hero states: "Real company. Any time." / "See who's actually near you." / "Then meet, this week."
- Explore social proof: "2,300+ members · 41 meetups this week."
- Unlock headline: "Unlock Ananya's profile + 13 others in Mumbai."
- Unlock benefits: "Every verified profile in Mumbai — all 14, unblurred." / "2 meetings included —
  yours anytime, no expiry." / "One-time. No subscription. No auto-debit."
- Pay button: "Pay ₹199 — unlock everything." Refund: "Didn't find anyone you'd like to meet? Full
  refund in 7 days."
- Develop seal: "You're in, {name}."
- Quiz Qs: see §5.1. Empathy-echoes (Lora italic): "Morning walks it is — nothing like the city before
  it wakes up." / "A good listener is rarer than you'd think. Noted." / "Marathi and Hindi — we've got
  plenty of folks who'll feel like home."
- Labor-illusion: "Hold on, {name} — finding your people…"
- Result: "We found 14 companions for you, {name}." CTA "Meet your matches →".
- Booking confirm: "You're meeting Ananya on Saturday."
- Dashboard wallet: "Your meetings ●● 2 remaining — worth ₹998. Yours anytime."
- Rebook: "How was your walk with Rohan? He's free Sat & Sun — want to go again?"
- Activity toast: "Rohan just booked a Cubbon Park walk in Bengaluru."
- Earnings: "6 meetups a week ≈ ₹12,900/month — an estimate; varies by city and demand."

## A.4 File manifest (new files, grouped)
- `components/journey/`: WaveBridge, ColorMorphBridge, ClipReveal, MilestoneSeal, Confetti,
  ParticleField, AuroraWipe, SegmentedPill, ActivityToast, FlipPill, DigitRoll.
- `components/home/`: PhoneJourneyHero, ActivityChapter, ActivityScene, `phone/PhoneBrowse`,
  `phone/PhoneProfile`, `phone/PhoneConfirmed`.
- `components/explore/`: ExploreClient, ExploreHeader, CompanionGrid, BlurLockCard, CompanionCard,
  UnlockSheet, PaymentMethodTiles.
- `components/quiz/`: QuizClient, QuizQuestion, ChoiceTile, EmpathyEcho, LaborIllusion, ResultReveal.
- `components/companion/`: CompanionProfile, BookingRail, EarningsCalculator.
- `components/booking/`: BookingWizard, BookingStep, BookingConfirmed.
- `components/dashboard/`: WalletCard, NextMeetupCard, StampShelf, RebookNudge.
- `app/`: template.tsx, quiz/page.tsx, companion/[id]/page.tsx, book/page.tsx, pricing/page.tsx,
  dashboard/page.tsx; rewrite explore/page.tsx; upgrade page.tsx, become-a-companion, login, register.
- `lib/`: journeyState.ts, data/companions.ts.
- Edit: `components/motion/LenisProvider.tsx` (add `/book`,`/dashboard`,`/pricing` to DISABLED_ROUTES),
  `components/ui/Button.tsx` (add `cta`/`aurora` variants + `lg`/`xl` sizes).

## A.5 Novelty bar (the builder must pass)
> If any screen ends up looking like a default shadcn starter — white card, blue button, top % bar,
> centered modal price-list, instant blur swap — it failed. The unlock must *develop*, the quiz must
> *converse*, the activity chapter must feel like *a day passing*, and the journey must feel *stamped,
> warm, and unmistakably Companio* at every step. Bold stays AA.
