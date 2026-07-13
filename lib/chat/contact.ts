// Contact-sharing guard, shared by both sides of a conversation.
//
// This regex used to live in components/dashboard/chatReplies.ts, next to a pool
// of scripted companion replies (now deleted — nobody was on the other end). It
// was applied only to what the MEMBER typed, which is exactly backwards: the
// companion is the party with an incentive to take the booking off-platform and
// off the record, and the member is the one the platform's safety guarantees are
// there to protect.
//
// It now lives in lib/ so the server can enforce it on the companion's replies
// too. Companio keeps conversations on-platform until a meetup is agreed, so a
// phone number or an email address is blocked in either direction.

export const CONTACT_RE = /(?:\+?91[-\s]?)?[6-9]\d{9}|[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i;
