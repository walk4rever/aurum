import { sendEmail } from '@/lib/resend'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { to, subject, html, from } = body

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    const data = await sendEmail({ to, subject, html, from })
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
