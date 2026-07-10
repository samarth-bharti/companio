// Contact-sharing guard for the chat composer.
//
// This file used to be `REPLIES`: a pool of two scripted sentences per companion
// id, plus a `replyDelayMs()` that jittered 1200–2000 ms so the answer felt typed
// rather than fetched. ChatPanel called it after every message a member sent, and
// the three-dot typing indicator ran while it waited. Nobody was on the other end.
// A member could ask "is 7am ok?" and be told "Perfect! I know a filter coffee
// spot at Colaba Causeway" by a person who had never seen the message.
//
// That is gone. Messages now go to `POST /api/messages/:companionId` and sit
// there until a real companion answers. Which is slower, and true.
//
// The regex stays, because it is real safety: Companio keeps conversations on the
// platform until a meetup is agreed, so a phone number or an email address in the
// composer is blocked before it is sent.

export const CONTACT_RE = /(?:\+?91[-\s]?)?[6-9]\d{9}|[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i;
