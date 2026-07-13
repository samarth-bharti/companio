// The contact-sharing guard now lives in lib/chat/contact.ts, so the SERVER can
// apply it to a companion's replies as well as to a member's. It is re-exported
// here because ChatPanel already imports it from this path.
//
// This file used to be `REPLIES`: a pool of two scripted sentences per companion
// id, plus a `replyDelayMs()` that jittered 1200–2000 ms so the answer felt typed
// rather than fetched. ChatPanel called it after every message a member sent, and
// the three-dot typing indicator ran while it waited. Nobody was on the other end.
// A member could ask "is 7am ok?" and be told "Perfect! I know a filter coffee
// spot at Colaba Causeway" by a person who had never seen the message.
//
// That is gone. Messages go to `POST /api/messages/:companionId`, and the
// companion answers them from their own inbox.

export { CONTACT_RE } from '@/lib/chat/contact';
