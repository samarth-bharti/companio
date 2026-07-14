// app/api/contact/route.ts
//
// POST /api/contact  { name, email, topic, message }
//
// The /contact page used to be four paragraphs of email addresses. This accepts
// the message instead.
//
// PERSIST FIRST, EMAIL SECOND. The row is written before Resend is called, and
// `emailedAt` is stamped only if the send succeeds. If email is down — or simply
// not configured — the message is still on record and can be read from the
// database, rather than lost inside a failed fetch. A contact form that drops
// messages when the mailer hiccups is worse than no contact form, because the
// sender believes they have been heard.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { envValue } from '@/lib/env';
import { clientKey, rateLimit } from '@/lib/server/rateLimit';
import { sendEmail } from '@/lib/server/email';
import { COMPANY } from '@/lib/company';

export const dynamic = 'force-dynamic';

const TOPICS = ['support', 'refund', 'safety', 'privacy', 'companion', 'other'] as const;

const body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(10).max(4000),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(req: Request) {
  if (!envValue('DATABASE_URL')) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const rl = await rateLimit({ key: clientKey(req, 'contact'), limit: 3, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', detail: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, topic, message } = parsed.data;

  const { prisma } = await import('@/lib/prisma');
  const row = await prisma.contactMessage.create({
    data: { name, email, topic, message },
    select: { id: true },
  });

  // A safety report must not wait behind a general query, so it says so in the
  // subject line rather than in the body where a triager might miss it.
  const urgent = topic === 'safety';
  const subject = `${urgent ? '[URGENT SAFETY] ' : ''}Contact form: ${topic} — ${name}`;

  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
    <p><strong>Reference:</strong> ${row.id}</p>
    <hr>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  const text = `From: ${name} <${email}>\nTopic: ${topic}\nReference: ${row.id}\n\n${message}`;

  const sent = await sendEmail({ to: COMPANY.supportEmail, subject, html, text });
  if (sent.sent) {
    await prisma.contactMessage.update({
      where: { id: row.id },
      data: { emailedAt: new Date() },
    });
  } else {
    console.warn(`[contact] message ${row.id} stored but not emailed:`, sent.reason);
  }

  // The message is safely stored either way, so the sender gets the same answer
  // either way. We do not make our mail configuration their problem.
  return NextResponse.json({ ok: true, reference: row.id });
}
