// lib/server/email.ts
//
// Transactional email via the Resend REST API (https://resend.com/docs/api-reference/emails/send-email).
//
// DORMANT PATTERN: when RESEND_API_KEY is absent the function returns
// { sent: false, reason: 'email_disabled' } and does nothing else. This lets
// every route that calls sendEmail compile and run in development or staging
// without any email service wired up. Set the key in production to activate.
//
// Never throws. Callers can fire-and-forget or check the result — their choice.

import { envValue } from '@/lib/env';

const RESEND_URL = 'https://api.resend.com/emails';

type SendResult =
  | { sent: true }
  | { sent: false; reason: string };

export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  // envValue(), not process.env: a `[[paste yours]]` key must read as absent, or
  // every send fails with a 401 that the caller reports as "email sent".
  const apiKey = envValue('RESEND_API_KEY');

  if (!apiKey) {
    console.info('[email] RESEND_API_KEY not set — email dormant, skipping send');
    return { sent: false, reason: 'email_disabled' };
  }

  const from = envValue('EMAIL_FROM') ?? 'Companio <hello@trycompanio.com>';

  let res: Response;
  try {
    res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.text ? { text: msg.text } : {}),
      }),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'network_error';
    console.warn('[email] fetch failed:', reason);
    return { sent: false, reason };
  }

  if (!res.ok) {
    let reason = `http_${res.status}`;
    try {
      const body = await res.json() as { message?: string; name?: string };
      if (body.message) reason = body.message;
    } catch {
      // body not JSON — keep the http_NNN reason
    }
    console.warn(`[email] Resend rejected (${res.status}):`, reason);
    return { sent: false, reason };
  }

  return { sent: true };
}
