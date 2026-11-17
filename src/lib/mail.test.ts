import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const resendSend = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend }
  },
}))

const { fromAddress, sendMail } = await import('./mail')

const message = {
  from: 'Conlang <noreply@mail.conlang.app>',
  to: 'ada@example.test',
  subject: 'Hello',
  html: '<p>Body</p>',
  replyTo: 'support@example.test',
}

const realFetch = globalThis.fetch

describe('sendMail via PostShiba', () => {
  beforeEach(() => {
    process.env.POSTSHIBA_API_KEY = 'test-key'
  })

  afterEach(() => {
    globalThis.fetch = realFetch
    delete process.env.POSTSHIBA_API_KEY
    delete process.env.MAIL_FROM_ADDRESS
  })

  it('posts the expected request', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ queued: true, message_id: 'm1' }), { status: 201 }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await sendMail({
      ...message,
      attachments: [{ filename: 'shot.png', content: Buffer.from('png'), contentType: 'image/png' }],
    })

    expect(result).toEqual({ ok: true, id: 'm1' })
    expect(resendSend).not.toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://app.postshiba.com/api/v1/emails')
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer test-key')
    expect(headers['content-type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({
      from: message.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      reply_to: message.replyTo,
      attachments: [
        { filename: 'shot.png', content: Buffer.from('png').toString('base64'), content_type: 'image/png' },
      ],
    })
  })

  it('maps a non-2xx response to its error code', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'domain_unverified', message: 'secret detail' }), {
        status: 403,
      })) as typeof fetch

    expect(await sendMail(message)).toEqual({ ok: false, reason: 'postshiba 403 domain_unverified' })
  })

  it('treats a suppressed recipient as a failure', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ queued: false }), { status: 200 })) as typeof fetch

    expect((await sendMail(message)).ok).toBe(false)
  })

  it('returns ok: false when fetch throws', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('network down')
    }) as typeof fetch

    expect(await sendMail(message)).toEqual({ ok: false, reason: 'postshiba request failed: TypeError' })
  })

  it('keeps the from address on the verified domain', () => {
    process.env.MAIL_FROM_ADDRESS = 'hello@conlang.app'
    expect(fromAddress('Conlang')).toBe('Conlang <noreply@mail.conlang.app>')

    process.env.MAIL_FROM_ADDRESS = 'hello@mail.conlang.app'
    expect(fromAddress('Conlang')).toBe('Conlang <hello@mail.conlang.app>')
  })
})

describe('sendMail via Resend', () => {
  beforeEach(() => {
    delete process.env.POSTSHIBA_API_KEY
    resendSend.mockReset()
  })

  it('falls back to Resend when POSTSHIBA_API_KEY is unset', async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    resendSend.mockResolvedValue({ data: { id: 're_1' }, error: null })

    const result = await sendMail(message)

    globalThis.fetch = realFetch
    expect(result).toEqual({ ok: true, id: 're_1' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(resendSend).toHaveBeenCalledWith(expect.objectContaining({ to: message.to, replyTo: message.replyTo }))
  })

  it('maps a Resend error', async () => {
    resendSend.mockResolvedValue({ data: null, error: { name: 'rate_limit_exceeded' } })

    expect(await sendMail(message)).toEqual({ ok: false, reason: 'resend rate_limit_exceeded' })
  })

  it('leaves the from address alone without PostShiba', () => {
    process.env.MAIL_FROM_ADDRESS = 'hello@conlang.app'
    expect(fromAddress('Conlang')).toBe('Conlang <hello@conlang.app>')
    delete process.env.MAIL_FROM_ADDRESS
  })
})
