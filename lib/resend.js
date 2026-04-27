import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'aurum@air7.fun'

/**
 * Send email via Resend.
 * @param {{to: string[], subject: string, html: string, from?: string}} opts
 */
export async function sendEmail({ to, subject, html, from }) {
  const { data, error } = await resend.emails.send({
    from: from || `Aurum <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}
