'use server'

import { Resend } from 'resend'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const SUPPORT_EMAIL = 'haines.corey@gmail.com'
const FROM_EMAIL = 'Conlang Support <noreply@mail.conlang.app>'

const VALID_TYPES = ['question', 'bug', 'feature'] as const
type SupportType = (typeof VALID_TYPES)[number]

const TYPE_LABELS: Record<SupportType, string> = {
  question: '❓ Question',
  bug: '🐛 Bug Report',
  feature: '✨ Feature Request',
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024 // 5 MB

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function submitSupportRequest(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  // Validate type
  const rawType = formData.get('type') as string
  if (!VALID_TYPES.includes(rawType as SupportType)) {
    return { success: false, error: 'Invalid request type.' }
  }
  const type = rawType as SupportType

  const subject = (formData.get('subject') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()
  const guestEmail = (formData.get('guestEmail') as string | null)?.trim() || null
  const imageFile = formData.get('image') as File | null

  if (!subject || !body) {
    return { success: false, error: 'Subject and message are required.' }
  }

  // For logged-in users, read email from server session (never trust client).
  // For guests, use the email they submitted in the form.
  const session = await auth.api.getSession({ headers: await headers() })
  const userEmail = session?.user?.email ?? guestEmail

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Email service not configured.' }
  }

  // Validate attachment
  const attachments: Array<{ filename: string; content: Buffer }> = []
  if (imageFile && imageFile.size > 0) {
    if (!imageFile.type.startsWith('image/')) {
      return { success: false, error: 'Only image attachments are supported.' }
    }
    if (imageFile.size > MAX_ATTACHMENT_BYTES) {
      return { success: false, error: 'Attachment must be under 5 MB.' }
    }
    const arrayBuffer = await imageFile.arrayBuffer()
    attachments.push({
      filename: imageFile.name,
      content: Buffer.from(arrayBuffer),
    })
  }

  const resend = new Resend(apiKey)
  const typeLabel = TYPE_LABELS[type]
  const safeSubject = esc(subject)
  const safeBody = esc(body).replace(/\n/g, '<br>')
  const safeEmail = userEmail ? esc(userEmail) : null

  // Email to support inbox — reply-to set to user so you can reply directly
  const supportHtml = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2 style="margin-bottom: 4px;">${typeLabel}: ${safeSubject}</h2>
      <p style="color: #666; margin-top: 0;">
        From: <strong>${safeEmail ?? 'Anonymous (not logged in)'}</strong>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
      <p style="line-height: 1.6;">${safeBody}</p>
    </div>
  `

  const { error: supportSendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: SUPPORT_EMAIL,
    replyTo: userEmail ?? SUPPORT_EMAIL,
    subject: `[Conlang Support] ${typeLabel}: ${subject}`,
    html: supportHtml,
    attachments: attachments.length > 0 ? attachments : undefined,
  })

  if (supportSendError) {
    return { success: false, error: 'Failed to send message. Please try again.' }
  }

  // Confirmation email to user — reply-to set to support so they can continue the thread
  if (userEmail) {
    const confirmHtml = `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2>We received your message</h2>
        <p>Thanks for reaching out! Here's a copy of what you sent:</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Type:</strong> ${typeLabel}</p>
          <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${safeSubject}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 12px 0;" />
          <p style="margin: 0; line-height: 1.6;">${safeBody}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Reply to this email and your message will come straight to us.
        </p>
      </div>
    `

    // Non-fatal: log error but don't fail the whole request
    const { error: confirmSendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      replyTo: SUPPORT_EMAIL,
      subject: `Re: [Conlang Support] ${subject}`,
      html: confirmHtml,
    })

    if (confirmSendError) {
      console.error('Failed to send confirmation email:', confirmSendError)
    }
  }

  return { success: true }
}
