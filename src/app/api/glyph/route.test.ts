import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RetryError } from 'ai'
import { POST } from './route'
import { NextRequest } from 'next/server'

const mockGenerateText = vi.hoisted(() => vi.fn())

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  generateText: mockGenerateText,
}))

const mockRateLimit = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  getClientIP: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => mockRateLimit)

const mockSanitize = vi.hoisted(() => ({
  sanitizeGlyphSvg: vi.fn((svg) => svg),
}))

vi.mock('@/lib/sanitize-svg', () => mockSanitize)

function glyphRequest(sketchDataUrl = 'data:image/png;base64,test') {
  return new NextRequest('http://localhost:3001/api/glyph', {
    method: 'POST',
    body: JSON.stringify({
      sketchDataUrl,
      style: 'geometric',
      phoneme: 'a',
    }),
  })
}

function gatewayError(statusCode: number, type: string) {
  return Object.assign(new Error(type), { statusCode, type })
}

describe('POST /api/glyph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.GLYPH_MODEL

    mockRateLimit.rateLimit.mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      resetIn: 60,
    })

    mockRateLimit.getClientIP.mockReturnValue('127.0.0.1')
  })

  it('returns 503 with friendly message when AI Gateway credits run out', async () => {
    mockGenerateText.mockRejectedValueOnce(gatewayError(402, 'insufficient_funds'))

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toContain('temporarily unavailable')
    expect(data.code).toBe('service_unavailable')
    expect(response.headers.get('Retry-After')).toBe('3600')
  })

  it('returns 429 with short Retry-After for transient rate limits', async () => {
    mockGenerateText.mockRejectedValueOnce(gatewayError(429, 'rate_limit_exceeded'))

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.code).toBe('rate_limited')
    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('unwraps RetryError to find the underlying gateway status', async () => {
    const lastError = gatewayError(429, 'rate_limit_exceeded')
    mockGenerateText.mockRejectedValueOnce(
      new RetryError({ message: 'Failed after 3 attempts', reason: 'maxRetriesExceeded', errors: [lastError] })
    )

    const response = await POST(glyphRequest())

    expect(response.status).toBe(429)
  })

  it('returns 500 for other gateway errors', async () => {
    mockGenerateText.mockRejectedValueOnce(gatewayError(500, 'internal_server_error'))

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate glyph')
  })

  it('returns 500 for non-API errors', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('Network error'))

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate glyph')
  })

  it('successfully generates glyph when the model returns valid SVG', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '<svg viewBox="0 0 100 100"><path d="M10 10 L90 90" stroke="currentColor"/></svg>',
    })

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.svg).toContain('<svg')
    expect(data.svg).toContain('</svg>')
  })

  it('uses the default model with fallbacks from other providers', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: '<svg></svg>' })

    await POST(glyphRequest())

    const call = mockGenerateText.mock.calls[0][0]
    expect(call.model).toBe('anthropic/claude-haiku-5.5')
    expect(call.providerOptions.gateway.models).toEqual([
      'google/gemini-2.5-flash-lite',
      'openai/gpt-6-luna',
    ])
  })

  it('uses GLYPH_MODEL when set and drops it from the fallbacks', async () => {
    process.env.GLYPH_MODEL = 'google/gemini-2.5-flash-lite'
    mockGenerateText.mockResolvedValueOnce({ text: '<svg></svg>' })

    await POST(glyphRequest())

    const call = mockGenerateText.mock.calls[0][0]
    expect(call.model).toBe('google/gemini-2.5-flash-lite')
    expect(call.providerOptions.gateway.models).toEqual(['openai/gpt-6-luna'])
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.rateLimit.mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      resetIn: 30,
    })

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Rate limit exceeded')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it.each([
    ['a remote URL', 'http://169.254.169.254/latest/meta-data'],
    ['a non-PNG data URL', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['an oversized image', 'data:image/png;base64,' + 'A'.repeat(2_000_000)],
  ])('returns 400 and skips the model for %s', async (_, sketchDataUrl) => {
    const response = await POST(glyphRequest(sketchDataUrl))

    expect(response.status).toBe(400)
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('returns 500 when AI does not return valid SVG', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'This is not SVG content' })

    const response = await POST(glyphRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('AI did not return valid SVG')
  })
})
