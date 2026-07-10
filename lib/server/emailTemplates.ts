// lib/server/emailTemplates.ts
//
// Pure template functions — no side effects, no imports. Each returns
// { subject, html, text } ready to pass straight to sendEmail().
// Copy is warm, professional, and strictly platonic throughout.

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#6B46C1'; // purple — matches the UI
const FOOTER_TEXT = `You're receiving this because you have a Companio account.
To manage your notification preferences, visit trycompanio.com/dashboard.`;

function layout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,Helvetica,sans-serif;color:#1F2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden;max-width:560px;">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:24px 32px;">
            <span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Companio</span>
            <span style="color:#DDD6FE;font-size:13px;margin-left:8px;">platonic companionship</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F3F4F6;padding:20px 32px;border-top:1px solid #E5E7EB;">
            <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6;">${FOOTER_TEXT.replace('\n', '<br>')}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;font-size:14px;color:#6B7280;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;font-size:14px;color:#111827;font-weight:600;">${value}</td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function bookingConfirmationEmail(opts: {
  name: string;
  companionName: string;
  activity: string;
  dateISO: string;
  place: string;
}): { subject: string; html: string; text: string } {
  const { name, companionName, activity, dateISO, place } = opts;

  const readableDate = new Date(dateISO).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const subject = `Your Companio booking with ${companionName} is confirmed`;

  const bodyHtml = `
    ${p(`Hi ${name},`)}
    ${p(`Your booking is confirmed. Here are the details:`)}
    <table cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:6px;width:100%;margin-bottom:20px;">
      ${detail('Companion', companionName)}
      ${detail('Activity', activity)}
      ${detail('Date & time', readableDate)}
      ${detail('Place', place)}
    </table>
    ${p(`This is a platonic companionship experience — a genuine opportunity to enjoy good company, share a conversation, or explore something new together.`)}
    ${p(`If you have any questions before your meeting, feel free to reach out through the Companio app.`)}
    ${p(`Looking forward to a wonderful time,<br><strong>The Companio Team</strong>`)}
  `;

  const text = [
    `Hi ${name},`,
    ``,
    `Your Companio booking is confirmed.`,
    ``,
    `Companion : ${companionName}`,
    `Activity  : ${activity}`,
    `Date/time : ${readableDate}`,
    `Place     : ${place}`,
    ``,
    `This is a strictly platonic companionship experience. If you have questions, contact us through the app.`,
    ``,
    `— The Companio Team`,
  ].join('\n');

  return { subject, html: layout(bodyHtml), text };
}

export function otpEmail(opts: {
  code: string;
}): { subject: string; html: string; text: string } {
  const { code } = opts;

  const subject = `Your Companio verification code: ${code}`;

  const bodyHtml = `
    ${p(`Use the code below to verify your identity. It expires in 10 minutes.`)}
    <div style="background:#F5F3FF;border:2px dashed ${BRAND_COLOR};border-radius:8px;padding:24px;text-align:center;margin-bottom:20px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:${BRAND_COLOR};">${code}</span>
    </div>
    ${p(`If you didn't request this, you can safely ignore this email. Your account is not at risk.`)}
  `;

  const text = [
    `Your Companio verification code is: ${code}`,
    ``,
    `This code expires in 10 minutes.`,
    `If you didn't request this, ignore this email.`,
  ].join('\n');

  return { subject, html: layout(bodyHtml), text };
}

export function receiptEmail(opts: {
  name: string;
  amountPaise: number;
  description: string;
}): { subject: string; html: string; text: string } {
  const { name, amountPaise, description } = opts;

  const rupees = (amountPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  const subject = `Your Companio receipt — ${rupees}`;

  const bodyHtml = `
    ${p(`Hi ${name},`)}
    ${p(`Thanks for your payment. Here's your receipt:`)}
    <table cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:6px;width:100%;margin-bottom:20px;">
      ${detail('Description', description)}
      ${detail('Amount paid', rupees)}
    </table>
    ${p(`Questions about this charge? Contact us at <a href="mailto:support@trycompanio.com" style="color:${BRAND_COLOR};">support@trycompanio.com</a>.`)}
    ${p(`Thank you for being part of Companio.<br><strong>The Companio Team</strong>`)}
  `;

  const text = [
    `Hi ${name},`,
    ``,
    `Thanks for your payment. Here is your receipt:`,
    ``,
    `Description : ${description}`,
    `Amount paid : ${rupees}`,
    ``,
    `Questions? Email support@trycompanio.com.`,
    ``,
    `— The Companio Team`,
  ].join('\n');

  return { subject, html: layout(bodyHtml), text };
}
