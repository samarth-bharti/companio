# Chat — the plan, parked

_Written 2026-07-13. **Nothing here is built.** The schema change was started and
deliberately reverted rather than left half-applied, because an uncommitted Prisma
model with no migration breaks the Vercel build._

Read [`STATUS.md`](STATUS.md) first.

## Where chat actually is today

It works, and it is real, and it is plain.

- A member messages a companion; the companion reads it in their dashboard inbox
  and replies. Both directions persist to Postgres.
- Emoji reactions and stickers persist (`Message.reactions`, `Message.kind`).
- The contact-sharing filter (`lib/chat/contact.ts`) blocks phone numbers and
  email addresses **in both directions** — a phone number in a companion's reply is
  refused with a 422.
- A suspended or banned companion cannot send. A companion cannot open a thread the
  member never started, so an approved companion cannot cold-message every member
  id they can guess.

What it does **not** have: live updates (you must reload), read receipts, a typing
indicator, replies/quotes, or unsend.

## The design, ready to implement

### Schema

```prisma
model Message {
  // ...existing...

  // Read receipt — DURABLE on purpose. A tick that vanishes when the other side
  // reconnects is worse than no tick: it silently un-tells you something.
  readAt      DateTime?

  // Reply / quote. Self-relation, nullable. onDelete: SetNull, NOT Cascade — a
  // quoted message that is later unsent must not take its replies down with it.
  replyToId   String?
  replyTo     Message?  @relation("MessageReply", fields: [replyToId], references: [id], onDelete: SetNull)
  replies     Message[] @relation("MessageReply")

  // Unsend. SOFT, never a hard delete: the row must survive so the other side's
  // copy becomes "this message was deleted" rather than silently vanishing from
  // their history — which is exactly how a scammer covers their tracks.
  deletedAt   DateTime?
}
```

### The typing indicator is the one that needs care

Industry practice (and the right call here): **typing is ephemeral, read receipts
are durable.** A typing signal has no value after a few seconds, must never be
replayed on reconnect, and must not be written to Postgres on every keystroke.

Options, in order of preference:

1. **Do not build it.** It is the least valuable of these features and the most
   expensive to do properly. Replies and read receipts are worth more.
2. A `ChatTyping` row keyed `(userId, companionId, actor)` with an `expiresAt` a
   few seconds out, written **at most once every 2s** per typist and read by the
   existing poll. Honest, simple, and survives serverless. Costs one small write
   per two seconds of typing.
3. Redis pub/sub or a WebSocket. Correct at scale, and far more infrastructure than
   a product with 22 fake companions can justify.

**Do not fake it.** A typing indicator that animates on a timer without anyone
typing is exactly the class of theatre the rest of this codebase spent a week
deleting (see the scripted companion replies removed in `chatReplies.ts`).

### Live updates without a refresh

Polling, not WebSockets, for now:

- One endpoint: `GET /api/messages/[companionId]/state?since=<ts>` → `{ messages,
  typing }`.
- A shared `useChatThread()` hook polls every ~2.5s, **only while the tab is
  visible** (`document.visibilityState`), and backs off when the thread is idle.
- Both the member's `ChatPanel` and the companion's `CompanionDashMessages` consume
  the same hook, or they will drift apart the way the two data clients did.

### Read receipts

- `POST /api/messages/[companionId]/read` marks every incoming message in that
  thread `readAt = now()` when the thread is opened.
- Render as ticks on the sender's own bubbles. Sent → delivered → read.
- **Do not show a read receipt the reader did not earn**: mark on thread open, not
  on message arrival.

### Reply / quote and unsend

- Reply: long-press or hover → "Reply". The composer shows the quoted snippet, and
  the sent message carries `replyToId`.
- Unsend: only your own message, and the bubble becomes "This message was deleted"
  for **both** sides. Never remove the row.

## The trap to avoid

Every one of these features is a chance to reintroduce the bug this codebase keeps
having: **a component reaching into `lib/appState` / `lib/journeyState` instead of
going through `dataClient`.** Chat reactions did exactly that and, in http mode, a
single tap replaced the rendered server thread with an empty localStorage one — the
conversation appeared to be deleted.

```bash
grep -rn "from '@/lib/appState'\|from '@/lib/journeyState'" components app | grep -v "import type"
```

Anything that is not an `import type` is a bug until proven otherwise.

Second trap, from the same week: the quick-react bar renders **above** the bubble,
inside a chat log that scrolls. For the first message in a thread there is nothing
above it, so it was clipped by the log's own edge and every click landed on the
sticky header behind it — the feature was unusable with a mouse and no unit test
could see it. Anything that pops out of the log needs the same collision check
`MessageBubble` now does.
