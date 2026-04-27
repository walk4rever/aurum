/**
 * Email templates for Aurum.
 * All templates return HTML string.
 */

export function verificationEmail({ confirmUrl, siteUrl }) {
  return `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
  <h2 style="margin-bottom:8px;color:#C8A84B">Welcome to Aurum</h2>
  <p style="color:#555;margin-bottom:24px">
    Click the button below to verify your email and activate your account.
  </p>
  <a href="${confirmUrl}"
     style="display:inline-block;background:#C8A84B;color:#fff;text-decoration:none;
            padding:12px 28px;border-radius:8px;font-weight:600">
    Verify email
  </a>
  <p style="color:#888;font-size:13px;margin-top:24px">
    Or copy this link:<br/>
    <code style="word-break:break-all">${confirmUrl}</code>
  </p>
  <p style="color:#aaa;font-size:12px;margin-top:32px">
    This link expires in 24 hours. If you didn't request this, you can ignore this email.<br/>
    — Aurum Team
  </p>
</div>
`.trim()
}

export function welcomeEmail({ siteUrl }) {
  return `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
  <h2 style="margin-bottom:8px;color:#C8A84B">Your Aurum account is ready</h2>
  <p style="color:#555;margin-bottom:24px">
    You can now create trusted agent identities and manage them from your dashboard.
  </p>
  <a href="${siteUrl}/dashboard"
     style="display:inline-block;background:#C8A84B;color:#fff;text-decoration:none;
            padding:12px 28px;border-radius:8px;font-weight:600">
    Go to dashboard
  </a>
  <p style="color:#aaa;font-size:12px;margin-top:32px">— Aurum Team</p>
</div>
`.trim()
}

export function agentCreatedEmail({ handle, apiKey, siteUrl }) {
  return `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
  <h2 style="margin-bottom:8px;color:#C8A84B">Agent created</h2>
  <p style="color:#555;margin-bottom:24px">
    Your agent <strong>${handle}@air7.fun</strong> is now active.
  </p>
  <p style="color:#555;margin-bottom:8px">API Key:</p>
  <code style="display:block;background:#f5f5f5;padding:12px;border-radius:6px;
               word-break:break-all;font-size:13px;margin-bottom:24px">
    ${apiKey}
  </code>
  <p style="color:#c44;font-size:13px;margin-bottom:24px">
    Copy this key now — it will not be shown again.
  </p>
  <a href="${siteUrl}/dashboard"
     style="display:inline-block;background:#C8A84B;color:#fff;text-decoration:none;
            padding:12px 28px;border-radius:8px;font-weight:600">
    Manage agents
  </a>
  <p style="color:#aaa;font-size:12px;margin-top:32px">— Aurum Team</p>
</div>
`.trim()
}
