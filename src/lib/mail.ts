import { Resend } from 'resend'

// Transactional mail. Sends through PostShiba when POSTSHIBA_API_KEY is set,
// otherwise through Resend as before. Unsetting POSTSHIBA_API_KEY is the
// rollback.

const POSTSHIBA_URL = 'https://app.postshiba.com/api/v1/emails'

// mail.conlang.app is verified in PostShiba. PostShiba rejects a `from` on an
// unverified domain, so with PostShiba active anything else falls back here.
export const VERIFIED_MAIL_DOMAIN = 'mail.conlang.app'
const DEFAULT_FROM_ADDRESS = `noreply@${VERIFIED_MAIL_DOMAIN}`

export type MailAttachment = { filename: string; content: Buffer; contentType?: string }

export type MailInput = {
  from: string
  to: string
  subject: string
  html: string
  replyTo?: string
  attachments?: MailAttachment[]
}

export type MailResult = { ok: true; id?: string } | { ok: false; reason: string }

export function isMailConfigured(): boolean {
  return Boolean(process.env.POSTSHIBA_API_KEY || process.env.RESEND_API_KEY)
}

// Builds "Name <address>" from MAIL_FROM_ADDRESS, keeping PostShiba sends on
// the verified domain.
export function fromAddress(name: string): string {
  const configured = process.env.MAIL_FROM_ADDRESS?.trim()
  let address = configured || DEFAULT_FROM_ADDRESS
  if (process.env.POSTSHIBA_API_KEY && !address.toLowerCase().endsWith(`@${VERIFIED_MAIL_DOMAIN}`)) {
    address = DEFAULT_FROM_ADDRESS
  }
  return `${name} <${address}>`
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const key = process.env.POSTSHIBA_API_KEY
  return key ? sendViaPostShiba(key, input) : sendViaResend(input)
}

async function sendViaPostShiba(key: string, input: MailInput): Promise<MailResult> {
  try {
    const response = await fetch(POSTSHIBA_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.attachments?.length
          ? {
              attachments: input.attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString('base64'),
                ...(a.contentType ? { content_type: a.contentType } : {}),
              })),
            }
          : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const body = await response.json().catch(() => null)
    if (!response.ok) {
      // Only the error code is kept so nothing sensitive ends up in logs.
      const code = typeof body?.error === 'string' ? body.error : 'unknown'
      return { ok: false, reason: `postshiba ${response.status} ${code}` }
    }
    // 200 with queued: false means every recipient is suppressed.
    if (body?.queued === false) {
      return { ok: false, reason: 'postshiba not queued (recipient suppressed)' }
    }
    return { ok: true, id: typeof body?.message_id === 'string' ? body.message_id : undefined }
  } catch (err) {
    const name = err instanceof Error ? err.name : 'unknown'
    return { ok: false, reason: `postshiba request failed: ${name}` }
  }
}

async function sendViaResend(input: MailInput): Promise<MailResult> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
      attachments: input.attachments?.length
        ? input.attachments.map((a) => ({ filename: a.filename, content: a.content }))
        : undefined,
    })
    if (error) return { ok: false, reason: `resend ${error.name}` }
    return { ok: true, id: data?.id }
  } catch (err) {
    const name = err instanceof Error ? err.name : 'unknown'
    return { ok: false, reason: `resend request failed: ${name}` }
  }
}
