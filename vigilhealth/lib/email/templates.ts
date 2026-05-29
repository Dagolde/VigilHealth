/**
 * Email Templates
 *
 * HTML and text templates for all transactional emails sent via Resend.
 * Each template returns { subject, html, text }.
 */

const APP_NAME = 'VigilHealth';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// ─── Shared Layout ────────────────────────────────────────────────────────────

function wrapHtml(title: string, body: string, unsubscribeUrl?: string): string {
  const footer = unsubscribeUrl
    ? `<p style="font-size:12px;color:#9ca3af;margin-top:24px;">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a> from these emails.
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#1d4ed8;">${APP_NAME}</span>
    </div>
    ${body}
    ${footer}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px;" />
    <p style="font-size:12px;color:#9ca3af;">
      &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export interface WelcomeEmailData {
  userName: string;
  verificationUrl: string;
}

export function welcomeTemplate(data: WelcomeEmailData): EmailTemplate {
  const subject = `Welcome to ${APP_NAME}!`;
  const body = `
    <h1 style="font-size:24px;color:#111827;margin-bottom:8px;">Welcome, ${data.userName}!</h1>
    <p style="color:#374151;">Thank you for joining ${APP_NAME} — your hyperlocal health intelligence platform.</p>
    <p style="color:#374151;">Please verify your email address to get started:</p>
    <a href="${data.verificationUrl}"
       style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">
      Verify Email Address
    </a>
    <p style="color:#6b7280;font-size:14px;">If you did not create this account, you can safely ignore this email.</p>
  `;
  const text = `Welcome to ${APP_NAME}, ${data.userName}!\n\nVerify your email: ${data.verificationUrl}`;
  return { subject, html: wrapHtml(subject, body), text };
}

// ─── Verification Email ───────────────────────────────────────────────────────

export interface VerificationEmailData {
  userName: string;
  verificationUrl: string;
}

export function verificationTemplate(data: VerificationEmailData): EmailTemplate {
  const subject = `Verify your ${APP_NAME} email address`;
  const body = `
    <h1 style="font-size:24px;color:#111827;margin-bottom:8px;">Verify your email</h1>
    <p style="color:#374151;">Hi ${data.userName}, please confirm your email address by clicking the button below.</p>
    <a href="${data.verificationUrl}"
       style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">
      Verify Email
    </a>
    <p style="color:#6b7280;font-size:14px;">This link expires in 24 hours.</p>
  `;
  const text = `Verify your ${APP_NAME} email: ${data.verificationUrl}`;
  return { subject, html: wrapHtml(subject, body), text };
}

// ─── Password Reset Email ─────────────────────────────────────────────────────

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
}

export function passwordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
  const subject = `Reset your ${APP_NAME} password`;
  const body = `
    <h1 style="font-size:24px;color:#111827;margin-bottom:8px;">Password Reset Request</h1>
    <p style="color:#374151;">Hi ${data.userName}, we received a request to reset your password.</p>
    <a href="${data.resetUrl}"
       style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">
      Reset Password
    </a>
    <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
  `;
  const text = `Reset your ${APP_NAME} password: ${data.resetUrl}`;
  return { subject, html: wrapHtml(subject, body), text };
}

// ─── Daily Digest Email ───────────────────────────────────────────────────────

export interface DigestEmailData {
  userName: string;
  location: string;
  riskChanges: Array<{ disease: string; level: string; change: string }>;
  supplyUpdates: Array<{ item: string; location: string; status: string }>;
  noChanges?: boolean;
  unsubscribeUrl: string;
}

export function dailyDigestTemplate(data: DigestEmailData): EmailTemplate {
  const subject = `Your ${APP_NAME} Daily Health Digest — ${new Date().toLocaleDateString()}`;

  let contentHtml = '';
  let contentText = '';

  if (data.noChanges) {
    contentHtml = `<p style="color:#374151;">No significant health changes in your area today. Stay safe!</p>`;
    contentText = 'No significant health changes in your area today.';
  } else {
    if (data.riskChanges.length > 0) {
      const rows = data.riskChanges
        .map(
          (r) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${r.disease}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${r.level}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${r.change}</td>
            </tr>`
        )
        .join('');
      contentHtml += `
        <h2 style="font-size:18px;color:#111827;margin-top:24px;">Risk Level Changes</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;">Disease</th>
              <th style="padding:8px;text-align:left;">Level</th>
              <th style="padding:8px;text-align:left;">Change</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#6b7280;margin-top:8px;">
          Sources: <a href="https://www.who.int">WHO</a>, <a href="https://www.cdc.gov">CDC</a>
        </p>
      `;
      contentText += `Risk Changes:\n${data.riskChanges.map((r) => `${r.disease}: ${r.level} (${r.change})`).join('\n')}\n`;
    }

    if (data.supplyUpdates.length > 0) {
      const rows = data.supplyUpdates
        .map(
          (s) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${s.item}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${s.location}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${s.status}</td>
            </tr>`
        )
        .join('');
      contentHtml += `
        <h2 style="font-size:18px;color:#111827;margin-top:24px;">Supply Updates</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:left;">Location</th>
              <th style="padding:8px;text-align:left;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      contentText += `Supply Updates:\n${data.supplyUpdates.map((s) => `${s.item} at ${s.location}: ${s.status}`).join('\n')}\n`;
    }
  }

  const body = `
    <h1 style="font-size:24px;color:#111827;margin-bottom:4px;">Daily Health Digest</h1>
    <p style="color:#6b7280;font-size:14px;">Area: ${data.location} &bull; ${new Date().toLocaleDateString()}</p>
    ${contentHtml}
    <div style="margin-top:24px;">
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;">
        View Full Dashboard
      </a>
    </div>
  `;

  const text = `${APP_NAME} Daily Digest for ${data.location}\n\n${contentText}\nView dashboard: ${APP_URL}/dashboard\n\nUnsubscribe: ${data.unsubscribeUrl}`;
  return { subject, html: wrapHtml(subject, body, data.unsubscribeUrl), text };
}

// ─── Critical Alert Email ─────────────────────────────────────────────────────

export interface CriticalAlertEmailData {
  userName: string;
  alertTitle: string;
  alertBody: string;
  location: string;
  sourceUrl?: string;
  unsubscribeUrl: string;
}

export function criticalAlertTemplate(data: CriticalAlertEmailData): EmailTemplate {
  const subject = `🚨 Critical Health Alert — ${data.alertTitle}`;
  const sourceLink = data.sourceUrl
    ? `<p style="font-size:13px;color:#6b7280;">Source: <a href="${data.sourceUrl}">${data.sourceUrl}</a></p>`
    : '';
  const body = `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:16px;margin-bottom:16px;">
      <h1 style="font-size:20px;color:#dc2626;margin:0 0 8px;">🚨 Critical Health Alert</h1>
      <p style="color:#374151;font-weight:600;margin:0;">${data.alertTitle}</p>
    </div>
    <p style="color:#374151;"><strong>Location:</strong> ${data.location}</p>
    <p style="color:#374151;">${data.alertBody}</p>
    ${sourceLink}
    <a href="${APP_URL}/dashboard"
       style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:16px;">
      View Details
    </a>
  `;
  const text = `CRITICAL HEALTH ALERT: ${data.alertTitle}\nLocation: ${data.location}\n\n${data.alertBody}\n\nView details: ${APP_URL}/dashboard\n\nUnsubscribe: ${data.unsubscribeUrl}`;
  return { subject, html: wrapHtml(subject, body, data.unsubscribeUrl), text };
}
