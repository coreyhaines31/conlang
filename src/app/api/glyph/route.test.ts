import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('openai')
vi.mock('@/lib/rate-limit')
vi.mock('@/lib/sanitize-svg')

const mockChatCompletions = vi.hoisted(() => ({
  create: vi.fn(),
}))

const mockOpenAIClass = vi.hoisted(() => {
  return class MockOpenAI {
    chat = {
      completions: mockChatCompletions,
    }
  }
})

vi.mock('openai', () => ({
  default: mockOpenAIClass,
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

describe('POST /api/glyph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful rate limit
    mockRateLimit.rateLimit.mockReturnValue({
      success: true,
      limit: 10,
      remaining: 9,
      resetIn: 60000,
    })
    
    mockRateLimit.getClientIP.mockReturnValue('127.0.0.1')
    
    // Set OpenAI API key
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('returns 503 with friendly message when OpenAI returns 429 quota error', async () => {
    const quotaError = {
      status: 429,
      code: 'insufficient_quota',
      message: 'You exceeded your current quota',
    }
    
    mockChatCompletions.create.mockRejectedValueOnce(quotaError)
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(503)
    expect(data.error).toContain('temporarily unavailable')
    expect(data.code).toBe('service_unavailable')
    expect(response.headers.get('Retry-After')).toBe('3600')
  })

  it('returns 429 with short Retry-After for transient OpenAI rate limits', async () => {
    mockChatCompletions.create.mockRejectedValueOnce({
      status: 429,
      code: 'rate_limit_exceeded',
      message: 'Rate limit reached',
    })

    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.code).toBe('rate_limited')
    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('returns 500 for non-429 OpenAI errors', async () => {
    const genericError = {
      status: 500,
      code: 'internal_error',
      message: 'Internal server error',
    }
    
    mockChatCompletions.create.mockRejectedValueOnce(genericError)
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate glyph')
  })

  it('returns 500 for non-API errors', async () => {
    mockChatCompletions.create.mockRejectedValueOnce(
      new Error('Network error')
    )
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate glyph')
  })

  it('successfully generates glyph when OpenAI returns valid SVG', async () => {
    mockChatCompletions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '<svg viewBox="0 0 100 100"><path d="M10 10 L90 90" stroke="currentColor"/></svg>',
          },
        },
      ],
    })
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.svg).toContain('<svg')
    expect(data.svg).toContain('</svg>')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.rateLimit.mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      resetIn: 30000,
    })
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(429)
    expect(data.error).toContain('Rate limit exceeded')
    expect(mockChatCompletions.create).not.toHaveBeenCalled()
  })

  it('returns 500 when OpenAI API key is not configured', async () => {
    delete process.env.OPENAI_API_KEY
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toContain('not configured')
  })

  it('returns 500 when AI does not return valid SVG', async () => {
    mockChatCompletions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'This is not SVG content',
          },
        },
      ],
    })
    
    const request = new NextRequest('http://localhost:3001/api/glyph', {
      method: 'POST',
      body: JSON.stringify({
        sketchDataUrl: 'data:image/png;base64,test',
        style: 'geometric',
        phoneme: 'a',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('AI did not return valid SVG')
  })
})
