import { beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn().mockResolvedValue({ error: null })
const getSession = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: () => getSession() } } }))

let ip = 0
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': `10.0.0.${ip}` }),
}))

const { submitSupportRequest } = await import('./support-actions')

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

describe('submitSupportRequest', () => {
  beforeEach(() => {
    send.mockClear()
    getSession.mockReset()
    ip += 1
    process.env.RESEND_API_KEY = 're_test'
    process.env.SUPPORT_EMAIL = 'support@example.test'
  })

  it('never emails a guest-supplied address', async () => {
    getSession.mockResolvedValue(null)

    const result = await submitSupportRequest(
      form({ type: 'question', subject: 'Hi', body: 'Hello', guestEmail: 'victim@example.test' }),
    )

    expect(result.success).toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].to).toBe('support@example.test')
    expect(send.mock.calls[0][0].replyTo).toBe('victim@example.test')
  })

  it('sends a confirmation to a signed-in user', async () => {
    getSession.mockResolvedValue({ user: { email: 'ada@example.test' } })

    await submitSupportRequest(form({ type: 'bug', subject: 'Bug', body: 'Broken' }))

    expect(send.mock.calls.map((call) => call[0].to)).toEqual(['support@example.test', 'ada@example.test'])
  })

  it('rate-limits repeated submissions from one IP', async () => {
    getSession.mockResolvedValue(null)
    const results = []
    for (let i = 0; i < 6; i++) {
      results.push(await submitSupportRequest(form({ type: 'question', subject: 'Hi', body: 'Hello' })))
    }

    expect(results.slice(0, 5).every((r) => r.success)).toBe(true)
    expect(results[5]).toEqual({ success: false, error: 'Too many requests. Please try again later.' })
  })
})
